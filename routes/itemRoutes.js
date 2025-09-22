const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protegerRota, restringirPara, authOpcional } = require('../middleware/auth');

// Rotas que podem ser acessadas com ou sem autenticação
// GET /api/itens - Listar todos os itens (com filtros e paginação)
router.get('/', authOpcional, itemController.listarItens);

// GET /api/itens/:id - Buscar item por ID
router.get('/:id', authOpcional, itemController.buscarItemPorId);

// Rotas que precisam de autenticação
router.use(protegerRota); // Middleware aplicado a todas as rotas abaixo

// POST /api/itens - Criar um novo item (usuário autenticado)
router.post('/', itemController.criarItem);

// PUT /api/itens/:id - Atualizar item (usuário autenticado)
router.put('/:id', itemController.atualizarItem);

// Rotas apenas para administradores
router.use(restringirPara('admin')); // Middleware aplicado a todas as rotas abaixo

// DELETE /api/itens/:id - Deletar item (apenas admin)
router.delete('/:id', itemController.deletarItem);

module.exports = router;