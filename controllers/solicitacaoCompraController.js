const SolicitacaoCompra = require('../models/SolicitacaoCompra');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

// @desc    Criar nova solicitação de compra
// @route   POST /api/v1/solicitacoes-compra
// @access  Private (Usuário Autenticado)
exports.criarSolicitacaoCompra = asyncHandler(async (req, res, next) => {
  const { itens, justificativa, prioridadeUso } = req.body;

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return next(new AppError('É necessário informar pelo menos um item', 400));
  }

  // Validar cada item
  for (const item of itens) {
    if (!item.tipo || !item.nivel || !item.descricao || !item.ramo || !item.quantidadeDesejada) {
      return next(new AppError('Todos os campos do item são obrigatórios (tipo, nivel, descricao, ramo, quantidadeDesejada)', 400));
    }

    if (item.quantidadeDesejada <= 0) {
      return next(new AppError('Quantidade desejada deve ser maior que zero', 400));
    }
  }

  // Criar a solicitação de compra
  const solicitacaoCompra = await SolicitacaoCompra.create({
    usuario: req.user.id,
    itens,
    justificativa,
    prioridadeUso: prioridadeUso || 'media'
  });

  // Carregar dados completos para resposta
  await solicitacaoCompra.populate({
    path: 'usuario',
    select: 'nome email grupoEscoteiro'
  });

  const valorEstimado = solicitacaoCompra.calcularValorEstimado();

  res.status(201).json({
    sucesso: true,
    data: {
      solicitacaoCompra,
      valorEstimado
    }
  });
});

// @desc    Listar solicitações de compra do usuário
// @route   GET /api/v1/solicitacoes-compra/minhas
// @access  Private (Usuário Autenticado)
exports.listarMinhasSolicitacoesCompra = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filtro = { usuario: req.user.id };
  if (status) {
    filtro.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'usuario', select: 'nome email grupoEscoteiro' },
      { path: 'adminAnalise', select: 'nome email' }
    ]
  };

  const solicitacoes = await SolicitacaoCompra.paginate(filtro, options);

  res.status(200).json({
    sucesso: true,
    data: solicitacoes
  });
});

// @desc    Listar todas as solicitações de compra (Admin)
// @route   GET /api/v1/solicitacoes-compra
// @access  Private (Admin)
exports.listarTodasSolicitacoesCompra = asyncHandler(async (req, res, next) => {
  const { status, usuario, prioridadeUso, page = 1, limit = 10 } = req.query;

  const filtro = {};
  if (status) filtro.status = status;
  if (usuario) filtro.usuario = usuario;
  if (prioridadeUso) filtro.prioridadeUso = prioridadeUso;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'usuario', select: 'nome email grupoEscoteiro' },
      { path: 'adminAnalise', select: 'nome email' }
    ]
  };

  const solicitacoes = await SolicitacaoCompra.paginate(filtro, options);

  res.status(200).json({
    sucesso: true,
    data: solicitacoes
  });
});

// @desc    Buscar solicitação de compra por ID
// @route   GET /api/v1/solicitacoes-compra/:id
// @access  Private (Usuário Autenticado)
exports.buscarSolicitacaoCompra = asyncHandler(async (req, res, next) => {
  const solicitacao = await SolicitacaoCompra.findById(req.params.id)
    .populate([
      { path: 'usuario', select: 'nome email grupoEscoteiro' },
      { path: 'adminAnalise', select: 'nome email' }
    ]);

  if (!solicitacao) {
    return next(new AppError('Solicitação de compra não encontrada', 404));
  }

  // Verificar se o usuário pode ver esta solicitação
  if (req.user.role !== 'admin' && solicitacao.usuario._id.toString() !== req.user.id) {
    return next(new AppError('Acesso negado', 403));
  }

  const valorEstimado = solicitacao.calcularValorEstimado();

  res.status(200).json({
    sucesso: true,
    data: {
      solicitacao,
      valorEstimado
    }
  });
});

// @desc    Aprovar solicitação de compra
// @route   PATCH /api/v1/solicitacoes-compra/:id/aprovar
// @access  Private (Admin)
exports.aprovarSolicitacaoCompra = asyncHandler(async (req, res, next) => {
  const { observacaoAdmin } = req.body;

  const solicitacao = await SolicitacaoCompra.findById(req.params.id);

  if (!solicitacao) {
    return next(new AppError('Solicitação de compra não encontrada', 404));
  }

  if (solicitacao.status !== 'pendente') {
    return next(new AppError('Apenas solicitações pendentes podem ser aprovadas', 400));
  }

  solicitacao.status = 'aprovada';
  solicitacao.adminAnalise = req.user.id;
  if (observacaoAdmin) {
    solicitacao.observacaoAdmin = observacaoAdmin;
  }

  await solicitacao.save();

  await solicitacao.populate([
    { path: 'usuario', select: 'nome email grupoEscoteiro' },
    { path: 'adminAnalise', select: 'nome email' }
  ]);

  res.status(200).json({
    sucesso: true,
    data: { solicitacao }
  });
});

// @desc    Rejeitar solicitação de compra
// @route   PATCH /api/v1/solicitacoes-compra/:id/rejeitar
// @access  Private (Admin)
exports.rejeitarSolicitacaoCompra = asyncHandler(async (req, res, next) => {
  const { motivoRejeicao, observacaoAdmin } = req.body;

  if (!motivoRejeicao) {
    return next(new AppError('Motivo da rejeição é obrigatório', 400));
  }

  const solicitacao = await SolicitacaoCompra.findById(req.params.id);

  if (!solicitacao) {
    return next(new AppError('Solicitação de compra não encontrada', 404));
  }

  if (solicitacao.status !== 'pendente') {
    return next(new AppError('Apenas solicitações pendentes podem ser rejeitadas', 400));
  }

  solicitacao.status = 'rejeitada';
  solicitacao.adminAnalise = req.user.id;
  solicitacao.motivoRejeicao = motivoRejeicao;
  if (observacaoAdmin) {
    solicitacao.observacaoAdmin = observacaoAdmin;
  }

  await solicitacao.save();

  await solicitacao.populate([
    { path: 'usuario', select: 'nome email grupoEscoteiro' },
    { path: 'adminAnalise', select: 'nome email' }
  ]);

  res.status(200).json({
    sucesso: true,
    data: { solicitacao }
  });
});

// @desc    Marcar solicitação como comprada
// @route   PATCH /api/v1/solicitacoes-compra/:id/marcar-comprada
// @access  Private (Admin)
exports.marcarComoComprada = asyncHandler(async (req, res, next) => {
  const { fornecedor, valorTotalCompra, observacaoAdmin } = req.body;

  const solicitacao = await SolicitacaoCompra.findById(req.params.id);

  if (!solicitacao) {
    return next(new AppError('Solicitação de compra não encontrada', 404));
  }

  if (solicitacao.status !== 'aprovada') {
    return next(new AppError('Apenas solicitações aprovadas podem ser marcadas como compradas', 400));
  }

  solicitacao.status = 'comprada';
  solicitacao.dataCompra = new Date();
  if (fornecedor) solicitacao.fornecedor = fornecedor;
  if (valorTotalCompra) solicitacao.valorTotalCompra = valorTotalCompra;
  if (observacaoAdmin) solicitacao.observacaoAdmin = observacaoAdmin;

  await solicitacao.save();

  await solicitacao.populate([
    { path: 'usuario', select: 'nome email grupoEscoteiro' },
    { path: 'adminAnalise', select: 'nome email' }
  ]);

  res.status(200).json({
    sucesso: true,
    data: { solicitacao }
  });
});

// @desc    Atualizar solicitação de compra
// @route   PATCH /api/v1/solicitacoes-compra/:id
// @access  Private (Usuário Autenticado - apenas suas próprias)
exports.atualizarSolicitacaoCompra = asyncHandler(async (req, res, next) => {
  const { justificativa, prioridadeUso } = req.body;

  const solicitacao = await SolicitacaoCompra.findById(req.params.id);

  if (!solicitacao) {
    return next(new AppError('Solicitação de compra não encontrada', 404));
  }

  // Verificar se é o usuário da solicitação
  if (solicitacao.usuario.toString() !== req.user.id) {
    return next(new AppError('Acesso negado', 403));
  }

  // Verificar se ainda pode ser atualizada
  if (solicitacao.status !== 'pendente') {
    return next(new AppError('Apenas solicitações pendentes podem ser atualizadas', 400));
  }

  // Atualizar campos permitidos
  if (justificativa !== undefined) {
    solicitacao.justificativa = justificativa;
  }

  if (prioridadeUso !== undefined) {
    solicitacao.prioridadeUso = prioridadeUso;
  }

  await solicitacao.save();

  // Carregar dados completos para resposta
  await solicitacao.populate([
    { path: 'usuario', select: 'nome email grupoEscoteiro' },
    { path: 'adminAnalise', select: 'nome email' }
  ]);

  const valorEstimado = solicitacao.calcularValorEstimado();

  res.status(200).json({
    sucesso: true,
    data: {
      solicitacao,
      valorEstimado
    }
  });
});

// @desc    Cancelar solicitação de compra
// @route   DELETE /api/v1/solicitacoes-compra/:id
// @access  Private (Usuário Autenticado - apenas suas próprias)
exports.cancelarSolicitacaoCompra = asyncHandler(async (req, res, next) => {
  const solicitacao = await SolicitacaoCompra.findById(req.params.id);

  if (!solicitacao) {
    return next(new AppError('Solicitação de compra não encontrada', 404));
  }

  // Verificar permissões
  const isOwner = solicitacao.usuario.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('Acesso negado', 403));
  }

  // Verificar se pode ser cancelada
  if (solicitacao.status === 'comprada') {
    return next(new AppError('Solicitação já comprada não pode ser cancelada', 400));
  }

  await SolicitacaoCompra.findByIdAndDelete(req.params.id);

  res.status(200).json({
    sucesso: true,
    data: {}
  });
});