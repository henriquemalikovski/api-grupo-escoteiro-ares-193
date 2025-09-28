const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protegerRota, restringirPara } = require('../middleware/auth');

// Rotas públicas (não precisam de autenticação)
router.post('/registrar', authController.registrar);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Rotas protegidas (precisam de autenticação)
router.use(protegerRota); // Middleware aplicado a todas as rotas abaixo

// Rotas do usuário autenticado
router.get('/perfil', authController.obterPerfil);
router.patch('/atualizar-perfil', authController.atualizarPerfil);
router.patch('/atualizar-senha', authController.atualizarSenha);
router.delete('/desativar-conta', authController.desativarConta);

// Rotas de gerenciamento de sessões
router.get('/sessoes', authController.listarSessoes);
router.delete('/sessoes/:tokenId', authController.encerrarSessao);
router.post('/logout-outras-sessoes', authController.encerrarOutrasSessoes);
router.post('/logout-global', authController.logoutGlobal);

// Rotas apenas para administradores
router.use(restringirPara('admin')); // Middleware aplicado a todas as rotas abaixo

router.get('/usuarios', authController.listarUsuarios);
router.get('/usuarios/:id', authController.buscarUsuarioPorId);
router.patch('/usuarios/:id', authController.atualizarUsuario);
router.delete('/usuarios/:id', authController.deletarUsuario);

module.exports = router;