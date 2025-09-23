const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protegerRota, restringirPara, authOpcional } = require('../middleware/auth');

// Rotas que precisam de autenticação
router.use(protegerRota); // Middleware aplicado a todas as rotas abaixo

// GET /api/itens - Listar todos os itens (usuário autenticado)
router.get('/', itemController.listarItens);

// GET /api/itens/:id - Buscar item por ID (usuário autenticado)
router.get('/:id', itemController.buscarItemPorId);

// Rotas apenas para administradores
router.use(restringirPara('admin')); // Middleware aplicado a todas as rotas abaixo

// POST /api/itens - Criar um novo item (apenas admin)
router.post('/', itemController.criarItem);

// PUT /api/itens/:id - Atualizar item (apenas admin)
router.put('/:id', itemController.atualizarItem);

// DELETE /api/itens/:id - Deletar item (apenas admin)
router.delete('/:id', itemController.deletarItem);

module.exports = router;