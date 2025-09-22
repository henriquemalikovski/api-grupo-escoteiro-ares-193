const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar se usuário está autenticado
const protegerRota = async (req, res, next) => {
  try {
    // 1) Verificar se o token existe
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Você não está logado! Por favor faça login para acessar.'
      });
    }

    // 2) Verificar se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Verificar se o usuário ainda existe
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'O usuário do token não existe mais.'
      });
    }

    // 4) Verificar se usuário não está inativo
    if (!currentUser.ativo) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Sua conta foi desativada. Entre em contato com o administrador.'
      });
    }

    // 5) Verificar se usuário mudou senha depois que o token foi emitido
    if (currentUser.mudouSenhaDepoisToken(decoded.iat)) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário mudou a senha recentemente! Por favor faça login novamente.'
      });
    }

    // CONCEDER ACESSO À ROTA PROTEGIDA
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido. Por favor faça login novamente!'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Seu token expirou! Por favor faça login novamente.'
      });
    }

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor',
      erro: error.message
    });
  }
};

// Middleware para restringir acesso apenas para administradores
const restringirPara = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Você não tem permissão para realizar esta ação'
      });
    }
    next();
  };
};

// Middleware opcional - não bloqueia se não tiver token, mas adiciona user se tiver
const authOpcional = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);

      if (currentUser && currentUser.ativo && !currentUser.mudouSenhaDepoisToken(decoded.iat)) {
        req.user = currentUser;
      }
    }

    next();
  } catch (error) {
    // Em caso de erro, apenas continue sem usuário
    next();
  }
};

module.exports = {
  protegerRota,
  restringirPara,
  authOpcional
};