const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const itemSolicitadoSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 1
  },
  observacao: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { _id: false });

const solicitacaoRetiradaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itens: [itemSolicitadoSchema],
  status: {
    type: String,
    enum: ['pendente', 'retirada_usuario', 'confirmada_admin', 'cancelada'],
    default: 'pendente'
  },
  retiradaConfirmadaPeloUsuario: {
    type: Boolean,
    default: false
  },
  dataRetiradaUsuario: {
    type: Date
  },
  confirmadaPeloAdmin: {
    type: Boolean,
    default: false
  },
  adminConfirmacao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dataConfirmacaoAdmin: {
    type: Date
  },
  observacaoAdmin: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  motivoCancelamento: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Middleware para atualizar status automaticamente
solicitacaoRetiradaSchema.pre('save', function(next) {
  if (this.retiradaConfirmadaPeloUsuario && !this.dataRetiradaUsuario) {
    this.dataRetiradaUsuario = new Date();
    this.status = 'retirada_usuario';
  }

  if (this.confirmadaPeloAdmin && !this.dataConfirmacaoAdmin) {
    this.dataConfirmacaoAdmin = new Date();
    this.status = 'confirmada_admin';
  }

  next();
});

// Método para calcular valor total da solicitação
solicitacaoRetiradaSchema.methods.calcularValorTotal = async function() {
  await this.populate('itens.item');

  let valorTotal = 0;
  for (const itemSolicitado of this.itens) {
    valorTotal += itemSolicitado.item.valorUnitario * itemSolicitado.quantidade;
  }

  return valorTotal;
};

// Método para verificar disponibilidade de estoque
solicitacaoRetiradaSchema.methods.verificarDisponibilidade = async function() {
  await this.populate('itens.item');

  const indisponiveis = [];

  for (const itemSolicitado of this.itens) {
    if (itemSolicitado.item.quantidade < itemSolicitado.quantidade) {
      indisponiveis.push({
        item: itemSolicitado.item.descricao,
        solicitado: itemSolicitado.quantidade,
        disponivel: itemSolicitado.item.quantidade
      });
    }
  }

  return indisponiveis;
};

// Plugin de paginação
solicitacaoRetiradaSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SolicitacaoRetirada', solicitacaoRetiradaSchema);