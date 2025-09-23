const SolicitacaoRetirada = require('../models/SolicitacaoRetirada');
const Item = require('../models/Item');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

// @desc    Criar nova solicitação de retirada
// @route   POST /api/v1/solicitacoes
// @access  Private (Usuário Autenticado)
exports.criarSolicitacao = asyncHandler(async (req, res, next) => {
  const { itens, observacao, retiradaConfirmadaPeloUsuario } = req.body;

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return next(new AppError('É necessário informar pelo menos um item', 400));
  }

  // Verificar se todos os itens existem
  for (const itemSolicitado of itens) {
    const item = await Item.findById(itemSolicitado.item);
    if (!item) {
      return next(new AppError(`Item com ID ${itemSolicitado.item} não encontrado`, 404));
    }

    if (itemSolicitado.quantidade <= 0) {
      return next(new AppError('Quantidade deve ser maior que zero', 400));
    }
  }

  // Criar a solicitação
  const solicitacao = await SolicitacaoRetirada.create({
    usuario: req.user.id,
    itens,
    observacao,
    retiradaConfirmadaPeloUsuario: retiradaConfirmadaPeloUsuario || false
  });

  // Carregar dados completos para resposta
  await solicitacao.populate([
    { path: 'usuario', select: 'nome email grupoEscoteiro' },
    { path: 'itens.item', select: 'tipo descricao valorUnitario quantidade ramo nivel' }
  ]);

  // Verificar disponibilidade
  const indisponiveis = await solicitacao.verificarDisponibilidade();
  const valorTotal = await solicitacao.calcularValorTotal();

  res.status(201).json({
    sucesso: true,
    data: {
      solicitacao,
      valorTotal,
      itensIndisponiveis: indisponiveis
    }
  });
});

// @desc    Listar solicitações do usuário
// @route   GET /api/v1/solicitacoes/minhas
// @access  Private (Usuário Autenticado)
exports.listarMinhasSolicitacoes = asyncHandler(async (req, res, next) => {
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
      { path: 'itens.item', select: 'tipo descricao valorUnitario quantidade ramo nivel' },
      { path: 'adminConfirmacao', select: 'nome email' }
    ]
  };

  const solicitacoes = await SolicitacaoRetirada.paginate(filtro, options);

  res.status(200).json({
    sucesso: true,
    data: solicitacoes
  });
});

// @desc    Listar todas as solicitações (Admin)
// @route   GET /api/v1/solicitacoes
// @access  Private (Admin)
exports.listarTodasSolicitacoes = asyncHandler(async (req, res, next) => {
  const { status, usuario, page = 1, limit = 10 } = req.query;

  const filtro = {};
  if (status) filtro.status = status;
  if (usuario) filtro.usuario = usuario;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'usuario', select: 'nome email grupoEscoteiro' },
      { path: 'itens.item', select: 'tipo descricao valorUnitario quantidade ramo nivel' },
      { path: 'adminConfirmacao', select: 'nome email' }
    ]
  };

  const solicitacoes = await SolicitacaoRetirada.paginate(filtro, options);

  res.status(200).json({
    sucesso: true,
    data: solicitacoes
  });
});

// @desc    Buscar solicitação por ID
// @route   GET /api/v1/solicitacoes/:id
// @access  Private (Usuário Autenticado)
exports.buscarSolicitacao = asyncHandler(async (req, res, next) => {
  const solicitacao = await SolicitacaoRetirada.findById(req.params.id)
    .populate([
      { path: 'usuario', select: 'nome email grupoEscoteiro' },
      { path: 'itens.item', select: 'tipo descricao valorUnitario quantidade ramo nivel' },
      { path: 'adminConfirmacao', select: 'nome email' }
    ]);

  if (!solicitacao) {
    return next(new AppError('Solicitação não encontrada', 404));
  }

  // Verificar se o usuário pode ver esta solicitação
  if (req.user.role !== 'admin' && solicitacao.usuario._id.toString() !== req.user.id) {
    return next(new AppError('Acesso negado', 403));
  }

  const valorTotal = await solicitacao.calcularValorTotal();

  res.status(200).json({
    sucesso: true,
    data: {
      solicitacao,
      valorTotal
    }
  });
});

// @desc    Atualizar solicitação de retirada
// @route   PATCH /api/v1/solicitacoes/:id
// @access  Private (Usuário Autenticado - apenas suas próprias)
exports.atualizarSolicitacao = asyncHandler(async (req, res, next) => {
  const { retiradaConfirmadaPeloUsuario, observacao } = req.body;

  const solicitacao = await SolicitacaoRetirada.findById(req.params.id);

  if (!solicitacao) {
    return next(new AppError('Solicitação não encontrada', 404));
  }

  // Verificar se é o usuário da solicitação ou admin
  const isOwner = solicitacao.usuario.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('Acesso negado', 403));
  }

  // Verificar se ainda pode ser atualizada
  if (solicitacao.status === 'confirmada_admin') {
    return next(new AppError('Solicitação já foi confirmada pelo admin e não pode ser alterada', 400));
  }

  if (solicitacao.status === 'cancelada') {
    return next(new AppError('Solicitação cancelada não pode ser alterada', 400));
  }

  // Atualizar campos permitidos
  if (observacao !== undefined) {
    solicitacao.observacao = observacao;
  }

  if (retiradaConfirmadaPeloUsuario !== undefined) {
    // Verificar disponibilidade antes de confirmar retirada
    if (retiradaConfirmadaPeloUsuario && !solicitacao.retiradaConfirmadaPeloUsuario) {
      await solicitacao.populate('itens.item');
      const indisponiveis = await solicitacao.verificarDisponibilidade();

      if (indisponiveis.length > 0) {
        return next(new AppError('Alguns itens não possuem estoque suficiente', 400));
      }
    }

    solicitacao.retiradaConfirmadaPeloUsuario = retiradaConfirmadaPeloUsuario;
  }

  await solicitacao.save();

  // Carregar dados completos para resposta
  await solicitacao.populate([
    { path: 'usuario', select: 'nome email grupoEscoteiro' },
    { path: 'itens.item', select: 'tipo descricao valorUnitario quantidade ramo nivel' },
    { path: 'adminConfirmacao', select: 'nome email' }
  ]);

  const valorTotal = await solicitacao.calcularValorTotal();

  res.status(200).json({
    sucesso: true,
    data: {
      solicitacao,
      valorTotal
    }
  });
});

// @desc    Confirmar retirada pelo admin e reduzir estoque
// @route   PATCH /api/v1/solicitacoes/:id/confirmar-admin
// @access  Private (Admin)
exports.confirmarRetiradaAdmin = asyncHandler(async (req, res, next) => {
  const { observacaoAdmin } = req.body;

  const solicitacao = await SolicitacaoRetirada.findById(req.params.id);

  if (!solicitacao) {
    return next(new AppError('Solicitação não encontrada', 404));
  }

  // Verificar se pode ser confirmada pelo admin
  if (solicitacao.status !== 'retirada_usuario') {
    return next(new AppError('Solicitação deve estar com status "retirada_usuario" para ser confirmada', 400));
  }

  if (solicitacao.confirmadaPeloAdmin) {
    return next(new AppError('Solicitação já foi confirmada pelo admin', 400));
  }

  // Verificar disponibilidade e reduzir estoque
  await solicitacao.populate('itens.item');

  const session = await SolicitacaoRetirada.startSession();

  try {
    await session.withTransaction(async () => {
      // Verificar disponibilidade novamente
      const indisponiveis = await solicitacao.verificarDisponibilidade();

      if (indisponiveis.length > 0) {
        throw new AppError('Alguns itens não possuem estoque suficiente', 400);
      }

      // Reduzir quantidade do estoque
      for (const itemSolicitado of solicitacao.itens) {
        await Item.findByIdAndUpdate(
          itemSolicitado.item._id,
          { $inc: { quantidade: -itemSolicitado.quantidade } },
          { session }
        );
      }

      // Confirmar a solicitação
      solicitacao.confirmadaPeloAdmin = true;
      solicitacao.adminConfirmacao = req.user.id;
      if (observacaoAdmin) {
        solicitacao.observacaoAdmin = observacaoAdmin;
      }

      await solicitacao.save({ session });
    });

    await solicitacao.populate([
      { path: 'usuario', select: 'nome email grupoEscoteiro' },
      { path: 'itens.item', select: 'tipo descricao valorUnitario quantidade ramo nivel' },
      { path: 'adminConfirmacao', select: 'nome email' }
    ]);

    res.status(200).json({
      sucesso: true,
      data: { solicitacao }
    });

  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

// @desc    Cancelar solicitação
// @route   PATCH /api/v1/solicitacoes/:id/cancelar
// @access  Private (Usuário Autenticado ou Admin)
exports.cancelarSolicitacao = asyncHandler(async (req, res, next) => {
  const { motivoCancelamento } = req.body;

  const solicitacao = await SolicitacaoRetirada.findById(req.params.id);

  if (!solicitacao) {
    return next(new AppError('Solicitação não encontrada', 404));
  }

  // Verificar permissões
  const isOwner = solicitacao.usuario.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('Acesso negado', 403));
  }

  // Verificar se pode ser cancelada
  if (solicitacao.status === 'confirmada_admin') {
    return next(new AppError('Solicitação já confirmada pelo admin não pode ser cancelada', 400));
  }

  if (solicitacao.status === 'cancelada') {
    return next(new AppError('Solicitação já está cancelada', 400));
  }

  solicitacao.status = 'cancelada';
  if (motivoCancelamento) {
    solicitacao.motivoCancelamento = motivoCancelamento;
  }

  await solicitacao.save();

  await solicitacao.populate([
    { path: 'usuario', select: 'nome email grupoEscoteiro' },
    { path: 'itens.item', select: 'tipo descricao valorUnitario quantidade ramo nivel' }
  ]);

  res.status(200).json({
    sucesso: true,
    data: { solicitacao }
  });
});