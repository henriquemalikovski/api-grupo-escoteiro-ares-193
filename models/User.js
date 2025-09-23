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
  }
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
  if (this.updatedAt) {
    const changedTimestamp = parseInt(this.updatedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Método toJSON para remover campos sensíveis
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.senha;
  return user;
};

module.exports = mongoose.model('User', userSchema);