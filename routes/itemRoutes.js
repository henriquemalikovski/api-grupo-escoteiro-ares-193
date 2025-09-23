const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protegerRota, restringirPara, authOpcional } = require('../middleware/auth');

// Rotas que podem ser acessadas com ou sem autenticação
// GET /api/itens - Listar todos os itens (com filtros e paginação)
router.get('/', authOpcional, itemController.listarItens);

// GET /api/itens/:id - Buscar item por ID
router.get('/:id', authOpcional, itemController.buscarItemPorId);

// Rotas apenas para administradores
router.use(protegerRota, restringirPara('admin')); // Middleware aplicado a todas as rotas abaixo

// POST /api/itens - Criar um novo item (apenas admin)
router.post('/', itemController.criarItem);

// PUT /api/itens/:id - Atualizar item (apenas admin)
router.put('/:id', itemController.atualizarItem);

// DELETE /api/itens/:id - Deletar item (apenas admin)
router.delete('/:id', itemController.deletarItem);

module.exports = router;