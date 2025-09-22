# 🔐 Sistema de Autenticação - API Estoque Escoteiro

## ✅ **Resumo dos "Erros" Identificados**

O único "erro" que você encontrou foi:
- **`EADDRINUSE: address already in use :::3000`** - Significa que a porta 3000 já estava sendo usada por outro processo. Isso é normal e foi resolvido.

## 🚀 **Sistema de Autenticação Implementado**

### **Tecnologias Utilizadas:**
- **JWT (JSON Web Tokens)** para autenticação
- **bcryptjs** para hash de senhas
- **Middleware de proteção** de rotas

### **Níveis de Acesso:**
1. **Público** - Sem autenticação
2. **Autenticado** - Usuário logado
3. **Admin** - Apenas administradores

## 📋 **Estrutura de Usuário**

```javascript
{
  "nome": "String",
  "email": "String (único)",
  "senha": "String (hash)",
  "role": "usuario | admin",
  "grupoEscoteiro": "String",
  "ativo": "Boolean",
  "ultimoLogin": "Date"
}
```

## 🛡️ **Proteção de Rotas**

### **Rotas Públicas (sem auth):**
- `GET /api/v1/itens` - Listar itens
- `GET /api/v1/itens/:id` - Buscar item por ID

### **Rotas Autenticadas (usuário logado):**
- `POST /api/v1/itens` - Criar item
- `PUT /api/v1/itens/:id` - Atualizar item
- `GET /api/v1/auth/perfil` - Ver perfil
- `PATCH /api/v1/auth/atualizar-perfil` - Atualizar perfil

### **Rotas Admin (apenas administrador):**
- `DELETE /api/v1/itens/:id` - Deletar item
- `GET /api/v1/auth/usuarios` - Listar usuários
- `DELETE /api/v1/auth/usuarios/:id` - Deletar usuário

## 🔑 **Como Usar a Autenticação**

### **1. Registrar Usuário:**
```bash
POST /api/v1/auth/registrar
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "123456",
  "grupoEscoteiro": "Grupo Escoteiro São Paulo"
}
```

### **2. Fazer Login:**
```bash
POST /api/v1/auth/login
{
  "email": "joao@email.com",
  "senha": "123456"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": { ... }
  }
}
```

### **3. Usar Token nas Requisições:**
Adicione o header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 **Testando no Insomnia**

### **Passo 1 - Importar Collection:**
1. Importe o arquivo `insomnia-auth-collection.json`
2. Configure as variáveis de ambiente:
   - `base_url`: `http://localhost:3000`
   - `access_token`: (será preenchido após login)

### **Passo 2 - Fluxo de Teste:**
1. **Registrar** um usuário
2. **Login** para obter o token
3. **Copiar o token** para a variável `access_token`
4. **Testar rotas protegidas**

### **Passo 3 - Criar Admin:**
Para criar um administrador, você precisa:
1. Alterar manualmente um usuário no banco para `role: "admin"`
2. Ou usar a rota de registro com um token de admin

## ⚙️ **Configuração JWT (.env)**

```env
# JWT Configuration
JWT_SECRET=estoque-escoteiro-super-secret-key-2024-very-secure
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
```

## 🔒 **Recursos de Segurança**

### **Middleware de Proteção:**
- ✅ Verificação de token válido
- ✅ Verificação se usuário existe
- ✅ Verificação se usuário está ativo
- ✅ Verificação se senha foi alterada após token

### **Validações:**
- ✅ Email único
- ✅ Senha mínima de 6 caracteres
- ✅ Hash automático da senha
- ✅ Campos obrigatórios

### **Controle de Acesso:**
- ✅ Rotas por nível de permissão
- ✅ Restrição de criação de admin
- ✅ Proteção contra ataques

## 📊 **Status Codes de Resposta**

- **200 OK** - Operação realizada com sucesso
- **201 Created** - Usuário/item criado
- **400 Bad Request** - Dados inválidos
- **401 Unauthorized** - Não autenticado ou token inválido
- **403 Forbidden** - Sem permissão para a ação
- **404 Not Found** - Recurso não encontrado
- **500 Internal Server Error** - Erro interno

## 🛠️ **Comandos Úteis**

### **Iniciar API:**
```bash
npm run dev
# ou
node server.js
```

### **Verificar Porta Ocupada:**
```bash
lsof -ti:3000 | xargs kill -9
```

### **Testar Syntax:**
```bash
node -c server.js
```

## 📁 **Arquivos Criados**

1. `models/User.js` - Model do usuário
2. `middleware/auth.js` - Middleware de autenticação
3. `controllers/authController.js` - Controller de auth
4. `routes/authRoutes.js` - Rotas de autenticação
5. `insomnia-auth-collection.json` - Collection do Insomnia

## 🚨 **Importante**

⚠️ **NUNCA** commite o arquivo `.env` com secrets reais em produção!

⚠️ **Mude o JWT_SECRET** para algo mais seguro em produção.

⚠️ **Use HTTPS** em produção para proteger os tokens.

---

✅ **Sistema de autenticação implementado com sucesso!**

Agora você tem um sistema completo de autenticação JWT com diferentes níveis de acesso para sua API de estoque escoteiro.