# 🏕️ API Sistema de Estoque Escoteiro

Sistema de gerenciamento de estoque para grupos escoteiros, desenvolvido com Node.js, Express e MongoDB.

## 🚀 Funcionalidades

### 📦 **Gestão de Itens**
- ✅ Cadastro de itens (Distintivos, Certificados, Cordões, etc.)
- ✅ Filtros por tipo, ramo e nível
- ✅ Paginação de resultados
- ✅ Cálculo automático de valor total
- ✅ CRUD completo

### 🔐 **Sistema de Autenticação**
- ✅ Registro e login de usuários
- ✅ JWT (JSON Web Tokens)
- ✅ Middleware de proteção de rotas
- ✅ 3 níveis de acesso: Público, Autenticado, Admin
- ✅ Gestão de perfil de usuário
- ✅ Hash seguro de senhas

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **CORS** - Cross-Origin Resource Sharing

## ⚙️ Instalação

### Pré-requisitos
- Node.js (v14 ou superior)
- MongoDB Atlas ou MongoDB local
- Git

### Passos

1. **Clone o repositório:**
```bash
git clone https://github.com/henriquemalikovski/estoque-escoteiro-api.git
cd estoque-escoteiro-api
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env` na raiz do projeto:
```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=sua-chave-secreta-super-segura
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
```

4. **Inicie o servidor:**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🌐 API Endpoints

### **Autenticação**
```
POST   /api/v1/auth/registrar          # Registrar usuário
POST   /api/v1/auth/login              # Login
POST   /api/v1/auth/logout             # Logout
GET    /api/v1/auth/perfil             # Obter perfil (auth)
PATCH  /api/v1/auth/atualizar-perfil   # Atualizar perfil (auth)
PATCH  /api/v1/auth/atualizar-senha    # Atualizar senha (auth)
```

### **Admin - Gestão de Usuários**
```
GET    /api/v1/auth/usuarios           # Listar usuários (admin)
GET    /api/v1/auth/usuarios/:id       # Buscar usuário (admin)
PATCH  /api/v1/auth/usuarios/:id       # Atualizar usuário (admin)
DELETE /api/v1/auth/usuarios/:id       # Deletar usuário (admin)
```

### **Itens do Estoque**
```
GET    /api/v1/itens                   # Listar itens (público)
GET    /api/v1/itens/:id               # Buscar item (público)
POST   /api/v1/itens                   # Criar item (auth)
PUT    /api/v1/itens/:id               # Atualizar item (auth)
DELETE /api/v1/itens/:id               # Deletar item (admin)
```

## 🧪 Testando a API

### **Insomnia/Postman**
1. Importe a collection `insomnia-auth-collection.json`
2. Configure as variáveis:
   - `base_url`: `http://localhost:3000`
   - `access_token`: (obtido após login)

### **Fluxo de Teste:**
1. **Registrar** um usuário
2. **Login** para obter token
3. **Copiar token** para `access_token`
4. **Testar rotas protegidas**

## 🔑 Autenticação

### **Registro:**
```json
POST /api/v1/auth/registrar
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "123456",
  "grupoEscoteiro": "Grupo Escoteiro São Paulo"
}
```

### **Login:**
```json
POST /api/v1/auth/login
{
  "email": "joao@email.com",
  "senha": "123456"
}
```

### **Usando o Token:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 👥 Autor

**Henrique Malikovski**
- GitHub: [@henriquemalikovski](https://github.com/henriquemalikovski)

---

⭐ **Se este projeto foi útil para você, deixe uma estrela!** ⭐