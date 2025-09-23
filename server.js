require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const itemRoutes = require('./routes/itemRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Conectar ao banco de dados
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
const authRoutes = require('./routes/authRoutes');
const solicitacaoRoutes = require('./routes/solicitacaoRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/itens', itemRoutes);
app.use('/api/v1/solicitacoes', solicitacaoRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    mensagem: 'API do Sistema de Estoque Escoteiro',
    versao: '1.0.0',
    autenticacao: 'JWT Bearer Token',
    rotas: {
      // Rotas de Autenticação
      'POST /api/v1/auth/registrar': 'Registrar novo usuário',
      'POST /api/v1/auth/login': 'Login de usuário',
      'POST /api/v1/auth/logout': 'Logout',
      'GET /api/v1/auth/perfil': 'Obter perfil (auth)',
      'PATCH /api/v1/auth/atualizar-perfil': 'Atualizar perfil (auth)',
      'PATCH /api/v1/auth/atualizar-senha': 'Atualizar senha (auth)',
      'DELETE /api/v1/auth/desativar-conta': 'Desativar conta (auth)',
      'GET /api/v1/auth/usuarios': 'Listar usuários (admin)',
      'GET /api/v1/auth/usuarios/:id': 'Buscar usuário por ID (admin)',
      'PATCH /api/v1/auth/usuarios/:id': 'Atualizar usuário (admin)',
      'DELETE /api/v1/auth/usuarios/:id': 'Deletar usuário (admin)',

      // Rotas de Itens
      'GET /api/v1/itens': 'Listar todos os itens (público)',
      'GET /api/v1/itens/:id': 'Buscar item por ID (público)',
      'POST /api/v1/itens': 'Criar um novo item (admin)',
      'PUT /api/v1/itens/:id': 'Atualizar item (admin)',
      'DELETE /api/v1/itens/:id': 'Deletar item (admin)',

      // Rotas de Solicitações de Retirada
      'POST /api/v1/solicitacoes': 'Criar solicitação de retirada (auth)',
      'GET /api/v1/solicitacoes/minhas': 'Listar minhas solicitações (auth)',
      'GET /api/v1/solicitacoes': 'Listar todas solicitações (admin)',
      'GET /api/v1/solicitacoes/:id': 'Buscar solicitação por ID (auth)',
      'PATCH /api/v1/solicitacoes/:id': 'Atualizar solicitação (confirmar retirada, observação) (auth)',
      'PATCH /api/v1/solicitacoes/:id/confirmar-admin': 'Confirmar pelo admin e reduzir estoque (admin)',
      'PATCH /api/v1/solicitacoes/:id/cancelar': 'Cancelar solicitação (auth/admin)'
    },
    permissoes: {
      'público': 'Rotas acessíveis sem autenticação',
      'auth': 'Rotas que precisam de usuário autenticado',
      'admin': 'Rotas exclusivas para administradores'
    }
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;