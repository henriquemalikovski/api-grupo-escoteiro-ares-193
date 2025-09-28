const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const itemCompraSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['Certificado', 'Cordão', 'Distintivo', 'Distintivo de Especialidade', 'Distintivo de Progressão']
  },
  nivel: {
    type: String,
    required: true,
    enum: ['Não Tem', 'Nível 1', 'Nível 2', 'Nível 3'],
    default: 'Não Tem'
  },
  descricao: {
    type: String,
    required: true,
    trim: true
  },
  ramo: {
    type: String,
    required: true,
    enum: ['Todos', 'Jovens', 'Escotista', 'Lobinho', 'Escoteiro', 'Sênior', 'Pioneiro']
  },
  quantidadeDesejada: {
    type: Number,
    required: true,
    min: 1
  },
  valorEstimado: {
    type: Number,
    min: 0
  }
}, { _id: false });

const solicitacaoCompraSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itens: [itemCompraSchema],
  justificativa: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  prioridadeUso: {
    type: String,
    enum: ['baixa', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  status: {
    type: String,
    enum: ['pendente', 'aprovada', 'rejeitada', 'comprada'],
    default: 'pendente'
  },
  adminAnalise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dataAnalise: {
    type: Date
  },
  observacaoAdmin: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  motivoRejeicao: {
    type: String,
    trim: true,
    maxlength: 500
  },
  dataCompra: {
    type: Date
  },
  fornecedor: {
    type: String,
    trim: true,
    maxlength: 200
  },
  valorTotalCompra: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Middleware para atualizar data de análise
solicitacaoCompraSchema.pre('save', function(next) {
  if ((this.status === 'aprovada' || this.status === 'rejeitada') && !this.dataAnalise) {
    this.dataAnalise = new Date();
  }

  next();
});

// Método para calcular valor total estimado
solicitacaoCompraSchema.methods.calcularValorEstimado = function() {
  let valorTotal = 0;
  for (const item of this.itens) {
    if (item.valorEstimado) {
      valorTotal += item.valorEstimado * item.quantidadeDesejada;
    }
  }
  return valorTotal;
};

// Plugin de paginação
solicitacaoCompraSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SolicitacaoCompra', solicitacaoCompraSchema);