const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
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
  quantidade: {
    type: Number,
    required: true,
    min: 0
  },
  valorUnitario: {
    type: Number,
    required: true,
    min: 0
  },
  valorTotal: {
    type: Number,
    default: function() {
      return this.quantidade * this.valorUnitario;
    }
  },
  ramo: {
    type: String,
    required: true,
    enum: ['Todos', 'Jovens', 'Escotista', 'Lobinho', 'Escoteiro', 'Sênior', 'Pioneiro']
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Middleware para calcular valor total antes de salvar
itemSchema.pre('save', function(next) {
  this.valorTotal = this.quantidade * this.valorUnitario;
  next();
});

module.exports = mongoose.model('Item', itemSchema);