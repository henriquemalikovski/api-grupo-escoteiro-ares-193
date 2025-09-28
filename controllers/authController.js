const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// Função para gerar JWT com tokenId único
const signToken = (id, tokenId) => {
  return jwt.sign({ id, tokenId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

// Função para extrair informações do dispositivo
const extrairInfoDispositivo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Desconhecido';

  let dispositivo = 'Desconhecido';
  let navegador = 'Desconhecido';

  // Detectar dispositivo
  if (userAgent.includes('Mobile')) dispositivo = 'Mobile';
  else if (userAgent.includes('Tablet')) dispositivo = 'Tablet';
  else dispositivo = 'Desktop';

  // Detectar navegador
  if (userAgent.includes('Chrome')) navegador = 'Chrome';
  else if (userAgent.includes('Firefox')) navegador = 'Firefox';
  else if (userAgent.includes('Safari')) navegador = 'Safari';
  else if (userAgent.includes('Edge')) navegador = 'Edge';

  return { dispositivo, navegador, ip };
};

// Função para criar e enviar token
const createSendToken = async (user, statusCode, res, req) => {
  // Gerar ID único para esta sessão
  const tokenId = crypto.randomUUID();
  const token = signToken(user._id, tokenId);

  // Configurações do cookie JWT
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Extrair informações do dispositivo
  const deviceInfo = extrairInfoDispositivo(req);

  // Limpar sessões expiradas antes de adicionar nova
  await user.limparSessoesExpiradas();

  // Adicionar nova sessão
  await user.adicionarSessao(tokenId, deviceInfo);

  // Atualizar último login
  user.ultimoLogin = new Date();
  await user.save();

  // Remover senha da resposta
  user.senha = undefined;

  res.status(statusCode).json({
    sucesso: true,
    token,
    data: {
      user,
      sessao: {
        tokenId,
        ...deviceInfo,
        criadoEm: new Date()
      }
    }
  });
};

// Registrar novo usuário
exports.registrar = async (req, res) => {
  try {
    const { nome, email, senha, grupoEscoteiro, role } = req.body;

    // Verificar se usuário já existe
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Usuário com este email já existe'
      });
    }

    // Apenas admins podem criar outros admins
    let userRole = 'usuario';
    if (role === 'admin') {
      if (req.user && req.user.role === 'admin') {
        userRole = 'admin';
      } else {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Apenas administradores podem criar outros administradores'
        });
      }
    }

    // Criar novo usuário
    const novoUsuario = await User.create({
      nome,
      email,
      senha,
      grupoEscoteiro,
      role: userRole
    });

    await createSendToken(novoUsuario, 201, res, req);
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao registrar usuário',
      erro: error.message
    });
  }
};

// Login de usuário
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // 1) Verificar se email e senha foram fornecidos
    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Por favor forneça email e senha!'
      });
    }

    // 2) Verificar se usuário existe && senha está correta
    const user = await User.findOne({ email }).select('+senha');

    if (!user || !(await user.compararSenha(senha))) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Email ou senha incorretos'
      });
    }

    // 3) Verificar se usuário está ativo
    if (!user.ativo) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Sua conta foi desativada. Entre em contato com o administrador.'
      });
    }

    // 4) Se tudo ok, enviar token para cliente
    await createSendToken(user, 200, res, req);
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao fazer login',
      erro: error.message
    });
  }
};

// Logout da sessão atual
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user && decoded.tokenId) {
        // Remover sessão específica
        await user.removerSessao(decoded.tokenId);
      }
    }

    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      sucesso: true,
      mensagem: 'Logout realizado com sucesso'
    });
  } catch (error) {
    res.status(200).json({
      sucesso: true,
      mensagem: 'Logout realizado com sucesso'
    });
  }
};

// Obter perfil do usuário atual
exports.obterPerfil = async (req, res) => {
  try {
    res.status(200).json({
      sucesso: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter perfil',
      erro: error.message
    });
  }
};

// Atualizar perfil do usuário atual (sem senha)
exports.atualizarPerfil = async (req, res) => {
  try {
    // 1) Criar objeto de erro se usuário tentar atualizar senha
    if (req.body.senha || req.body.senhaConfirm) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Esta rota não é para atualização de senha. Use /atualizar-senha.'
      });
    }

    // 2) Campos permitidos para atualização
    const camposPermitidos = ['nome', 'email', 'grupoEscoteiro'];
    const updates = {};

    camposPermitidos.forEach(campo => {
      if (req.body[campo]) updates[campo] = req.body[campo];
    });

    // 3) Atualizar documento do usuário
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      sucesso: true,
      mensagem: 'Perfil atualizado com sucesso',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar perfil',
      erro: error.message
    });
  }
};

// Atualizar senha do usuário atual
exports.atualizarSenha = async (req, res) => {
  try {
    // 1) Obter usuário da coleção
    const user = await User.findById(req.user.id).select('+senha');

    // 2) Verificar se a senha atual está correta
    if (!(await user.compararSenha(req.body.senhaAtual))) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Sua senha atual está incorreta.'
      });
    }

    // 3) Se sim, atualizar senha
    user.senha = req.body.senha;
    await user.save();

    // 4) Logar usuário, enviar JWT
    await createSendToken(user, 200, res, req);
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar senha',
      erro: error.message
    });
  }
};

// Desativar conta do usuário atual
exports.desativarConta = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { ativo: false });

    res.status(204).json({
      sucesso: true,
      mensagem: 'Conta desativada com sucesso',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao desativar conta',
      erro: error.message
    });
  }
};

// ADMIN ONLY - Listar todos os usuários
exports.listarUsuarios = async (req, res) => {
  try {
    const { page = 1, limit = 10, ativo, role, grupoEscoteiro } = req.query;

    // Construir filtros
    const filtros = {};
    if (ativo !== undefined) filtros.ativo = ativo === 'true';
    if (role) filtros.role = role;
    if (grupoEscoteiro) filtros.grupoEscoteiro = new RegExp(grupoEscoteiro, 'i');

    // Paginação
    const skip = (page - 1) * limit;

    const usuarios = await User.find(filtros)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filtros);

    res.status(200).json({
      sucesso: true,
      data: usuarios,
      paginacao: {
        paginaAtual: parseInt(page),
        totalPaginas: Math.ceil(total / limit),
        totalUsuarios: total,
        usuariosPorPagina: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar usuários',
      erro: error.message
    });
  }
};

// ADMIN ONLY - Buscar usuário por ID
exports.buscarUsuarioPorId = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      sucesso: true,
      data: {
        user: usuario
      }
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar usuário',
      erro: error.message
    });
  }
};

// ADMIN ONLY - Atualizar usuário
exports.atualizarUsuario = async (req, res) => {
  try {
    const { senha, ...updates } = req.body;

    // Não permitir atualização de senha por esta rota
    if (senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível atualizar senha por esta rota'
      });
    }

    const usuario = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Usuário atualizado com sucesso',
      data: {
        user: usuario
      }
    });
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar usuário',
      erro: error.message
    });
  }
};

// ADMIN ONLY - Deletar usuário
exports.deletarUsuario = async (req, res) => {
  try {
    const usuario = await User.findByIdAndDelete(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao deletar usuário',
      erro: error.message
    });
  }
};

// Listar sessões ativas do usuário atual
exports.listarSessoes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Limpar sessões expiradas
    await user.limparSessoesExpiradas();

    res.status(200).json({
      sucesso: true,
      data: {
        sessoes: user.sessoesAtivas,
        total: user.sessoesAtivas.length
      }
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar sessões',
      erro: error.message
    });
  }
};

// Encerrar sessão específica
exports.encerrarSessao = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const user = await User.findById(req.user.id);

    const sessaoExistia = user.sessoesAtivas.some(s => s.tokenId === tokenId);

    if (!sessaoExistia) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Sessão não encontrada'
      });
    }

    await user.removerSessao(tokenId);

    res.status(200).json({
      sucesso: true,
      mensagem: 'Sessão encerrada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao encerrar sessão',
      erro: error.message
    });
  }
};

// Encerrar todas as outras sessões (manter apenas a atual)
exports.encerrarOutrasSessoes = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(req.user.id);

    // Manter apenas a sessão atual
    if (decoded.tokenId) {
      user.sessoesAtivas = user.sessoesAtivas.filter(sessao =>
        sessao.tokenId === decoded.tokenId
      );
      await user.save();
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Outras sessões encerradas com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao encerrar outras sessões',
      erro: error.message
    });
  }
};

// Logout global - encerrar todas as sessões
exports.logoutGlobal = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    await user.encerrarTodasSessoes();

    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      sucesso: true,
      mensagem: 'Logout global realizado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao realizar logout global',
      erro: error.message
    });
  }
};