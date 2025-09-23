const express = require('express');
const {
  criarSolicitacao,
  listarMinhasSolicitacoes,
  listarTodasSolicitacoes,
  buscarSolicitacao,
  atualizarSolicitacao,
  confirmarRetiradaAdmin,
  cancelarSolicitacao
} = require('../controllers/solicitacaoController');

const { protegerRota, restringirPara } = require('../middleware/auth');

const router = express.Router();

// Aplicar proteção de autenticação a todas as rotas
router.use(protegerRota);

// @route   POST /api/v1/solicitacoes
// @desc    Criar nova solicitação de retirada
// @access  Private (Usuário Autenticado)
router.post('/', criarSolicitacao);

// @route   GET /api/v1/solicitacoes/minhas
// @desc    Listar solicitações do usuário autenticado
// @access  Private (Usuário Autenticado)
router.get('/minhas', listarMinhasSolicitacoes);

// ROTAS ADMINISTRATIVAS

// @route   GET /api/v1/solicitacoes
// @desc    Listar todas as solicitações (Admin)
// @access  Private (Admin)
router.get('/', restringirPara('admin'), listarTodasSolicitacoes);

// @route   PATCH /api/v1/solicitacoes/:id/cancelar
// @desc    Cancelar solicitação
// @access  Private (Usuário pode cancelar suas próprias, Admin cancela qualquer uma)
router.patch('/:id/cancelar', cancelarSolicitacao);

// @route   PATCH /api/v1/solicitacoes/:id/confirmar-admin
// @desc    Confirmar retirada pelo admin e reduzir estoque automaticamente
// @access  Private (Admin)
router.patch('/:id/confirmar-admin', restringirPara('admin'), confirmarRetiradaAdmin);

// @route   GET /api/v1/solicitacoes/:id
// @desc    Buscar solicitação por ID
// @access  Private (Usuário pode ver suas próprias, Admin vê todas)
router.get('/:id', buscarSolicitacao);

// @route   PATCH /api/v1/solicitacoes/:id
// @desc    Atualizar solicitação (incluindo confirmação de retirada)
// @access  Private (Usuário Autenticado - apenas suas próprias)
router.patch('/:id', atualizarSolicitacao);

module.exports = router;