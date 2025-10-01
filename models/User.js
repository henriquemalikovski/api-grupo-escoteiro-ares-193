const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email deve ter um formato válido']
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
    select: false // Por padrão não retorna a senha nas consultas
  },
  role: {
    type: String,
    enum: ['usuario', 'admin'],
    default: 'usuario'
  },
  grupoEscoteiro: {
    type: String,
    required: [true, 'Grupo Escoteiro é obrigatório'],
    trim: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  ultimoLogin: {
    type: Date
  },
  senhaAlteradaEm: {
    type: Date
  },
  sessoesAtivas: [{
    tokenId: {
      type: String,
      required: true
    },
    dispositivo: {
      type: String,
      default: 'Desconhecido'
    },
    navegador: {
      type: String,
      default: 'Desconhecido'
    },
    ip: {
      type: String,
      default: 'Desconhecido'
    },
    criadoEm: {
      type: Date,
      default: Date.now
    },
    ultimaAtividade: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Middleware para hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  // Só faz hash se a senha foi modificada
  if (!this.isModified('senha')) return next();

  // Verificar se a senha existe
  if (!this.senha) {
    return next(new Error('Senha é obrigatória'));
  }

  try {
    // Hash da senha com custo 12
    this.senha = await bcrypt.hash(this.senha.toString(), 12);

    // Registrar quando a senha foi alterada
    this.senhaAlteradaEm = Date.now() - 1000; // Subtrair 1s para garantir que o token seja criado depois

    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.compararSenha = async function(senhaCandidata) {
  return await bcrypt.compare(senhaCandidata, this.senha);
};

// Método para verificar se usuário mudou senha depois do JWT ser criado
userSchema.methods.mudouSenhaDepoisToken = function(JWTTimestamp) {
  if (this.senhaAlteradaEm) {
    const changedTimestamp = parseInt(this.senhaAlteradaEm.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Método para adicionar nova sessão
userSchema.methods.adicionarSessao = function(tokenId, deviceInfo = {}) {
  const novaSessao = {
    tokenId,
    dispositivo: deviceInfo.dispositivo || 'Desconhecido',
    navegador: deviceInfo.navegador || 'Desconhecido',
    ip: deviceInfo.ip || 'Desconhecido',
    criadoEm: new Date(),
    ultimaAtividade: new Date()
  };

  this.sessoesAtivas.push(novaSessao);
  return this.save();
};

// Método para remover sessão específica
userSchema.methods.removerSessao = function(tokenId) {
  this.sessoesAtivas = this.sessoesAtivas.filter(sessao => sessao.tokenId !== tokenId);
  return this.save();
};

// Método para verificar se sessão é válida
userSchema.methods.sessaoValida = function(tokenId) {
  return this.sessoesAtivas.some(sessao => sessao.tokenId === tokenId);
};

// Método para atualizar última atividade da sessão
userSchema.methods.atualizarAtividadeSessao = function(tokenId) {
  const sessao = this.sessoesAtivas.find(s => s.tokenId === tokenId);
  if (sessao) {
    sessao.ultimaAtividade = new Date();
    return this.save();
  }
};

// Método para limpar sessões expiradas (mais de 90 dias sem atividade)
userSchema.methods.limparSessoesExpiradas = function() {
  const agora = new Date();
  const limite = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 dias

  this.sessoesAtivas = this.sessoesAtivas.filter(sessao =>
    sessao.ultimaAtividade > limite
  );

  return this.save();
};

// Método para encerrar todas as sessões (útil para logout global)
userSchema.methods.encerrarTodasSessoes = function() {
  this.sessoesAtivas = [];
  return this.save();
};

// Método toJSON para remover campos sensíveis
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.senha;
  return user;
};

module.exports = mongoose.model('User', userSchema);