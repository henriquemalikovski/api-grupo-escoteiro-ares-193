const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Dados inválidos',
      erros: errors
    });
  }
  
  // Erro de ID inválido do MongoDB
  if (err.name === 'CastError') {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'ID inválido'
    });
  }
  
  // Erro padrão
  res.status(500).json({
    sucesso: false,
    mensagem: 'Erro interno do servidor'
  });
};

module.exports = errorHandler;