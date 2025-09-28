const express = require('express');
const {
  criarSolicitacaoCompra,
  listarMinhasSolicitacoesCompra,
  listarTodasSolicitacoesCompra,
  buscarSolicitacaoCompra,
  aprovarSolicitacaoCompra,
  rejeitarSolicitacaoCompra,
  marcarComoComprada,
  atualizarSolicitacaoCompra,
  cancelarSolicitacaoCompra
} = require('../controllers/solicitacaoCompraController');

const { protegerRota, restringirPara } = require('../middleware/auth');

const router = express.Router();

// Aplicar proteção de autenticação a todas as rotas
router.use(protegerRota);

// @route   POST /api/v1/solicitacoes-compra
// @desc    Criar nova solicitação de compra
// @access  Private (Usuário Autenticado)
router.post('/', criarSolicitacaoCompra);

// @route   GET /api/v1/solicitacoes-compra/minhas
// @desc    Listar solicitações de compra do usuário autenticado
// @access  Private (Usuário Autenticado)
router.get('/minhas', listarMinhasSolicitacoesCompra);

// ROTAS ADMINISTRATIVAS

// @route   GET /api/v1/solicitacoes-compra
// @desc    Listar todas as solicitações de compra (Admin)
// @access  Private (Admin)
router.get('/', restringirPara('admin'), listarTodasSolicitacoesCompra);

// @route   PATCH /api/v1/solicitacoes-compra/:id/aprovar
// @desc    Aprovar solicitação de compra
// @access  Private (Admin)
router.patch('/:id/aprovar', restringirPara('admin'), aprovarSolicitacaoCompra);

// @route   PATCH /api/v1/solicitacoes-compra/:id/rejeitar
// @desc    Rejeitar solicitação de compra
// @access  Private (Admin)
router.patch('/:id/rejeitar', restringirPara('admin'), rejeitarSolicitacaoCompra);

// @route   PATCH /api/v1/solicitacoes-compra/:id/marcar-comprada
// @desc    Marcar solicitação como comprada
// @access  Private (Admin)
router.patch('/:id/marcar-comprada', restringirPara('admin'), marcarComoComprada);

// @route   GET /api/v1/solicitacoes-compra/:id
// @desc    Buscar solicitação de compra por ID
// @access  Private (Usuário pode ver suas próprias, Admin vê todas)
router.get('/:id', buscarSolicitacaoCompra);

// @route   PATCH /api/v1/solicitacoes-compra/:id
// @desc    Atualizar solicitação de compra
// @access  Private (Usuário Autenticado - apenas suas próprias)
router.patch('/:id', atualizarSolicitacaoCompra);

// @route   DELETE /api/v1/solicitacoes-compra/:id
// @desc    Cancelar/deletar solicitação de compra
// @access  Private (Usuário Autenticado - apenas suas próprias)
router.delete('/:id', cancelarSolicitacaoCompra);

module.exports = router;