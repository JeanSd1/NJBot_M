# 🔐 Sistema de Login - Usuário Teste

## Como funciona

O sistema YouAi.BETA possui um sistema de autenticação com JWT onde:

1. **Usuário faz login** com email e senha
2. **Backend valida** e gera um token JWT
3. **Token é salvo** no localStorage do navegador
4. **Usuário tem acesso** à sua base de dados (empresas)

---

## 📋 Dados de acesso do usuário "teste"

**Email:** `teste@teste.com`
**Senha:** `teste123`

### Como criar esse usuário:

```bash
cd backend
node criar-usuario-teste.js
```

Este script:
- Verifica se o usuário já existe
- Cria o usuário com bcrypt hash da senha
- Salva na coleção `users` do MongoDB

---

## 🏢 Criar empresa para o usuário

Depois de criar o usuário, crie a empresa associada:

```bash
node criar-empresa-teste.js
```

Este script:
- Encontra o usuário teste@teste.com
- Cria uma empresa chamada "Empresa Teste"
- Associa a empresa ao usuário
- Configura IA padrão (Gemini)

---

## 🔄 Fluxo de Login

### 1. Tela inicial (Login.jsx)
```
usuario digita: teste@teste.com
usuario digita: teste123
aperta: "Entrar"
```

### 2. API envia para backend
```
POST /api/login
{
  "email": "teste@teste.com",
  "senha": "teste123"
}
```

### 3. Backend valida
```javascript
- Busca usuário no banco
- Valida senha com bcrypt
- Gera JWT token
- Retorna token + dados do usuário
```

### 4. Frontend salva token
```javascript
localStorage.setItem('token', response.token)
localStorage.setItem('user', JSON.stringify(response))
```

### 5. Usuário vê suas empresas
```
GET /api/empresas
Headers: Authorization: Bearer {token}
```

---

## 📁 Estrutura de dados

### Collection: users
```javascript
{
  _id: ObjectId,
  nome: "Usuário Teste",
  email: "teste@teste.com",
  passwordHash: "$2a$10$...", // bcrypt hash
  role: "client",
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: empresas
```javascript
{
  _id: ObjectId,
  nome: "Empresa Teste",
  usuario: ObjectId, // referência para User._id
  descricao: "Empresa de teste",
  email: "contato@empresateste.com",
  // ... outros campos
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔑 Tokens JWT

Quando o usuário faz login, recebe um JWT com:
```javascript
{
  id: user._id,
  email: user.email,
  role: user.role,
  iat: timestamp,
  exp: timestamp + 8h
}
```

O token é enviado em cada requisição como:
```
Authorization: Bearer {token}
```

---

## 🛡️ Segurança

✅ Senhas hashadas com bcrypt (10 rounds)
✅ JWT com expiração de 8 horas
✅ Validação de token em cada rota protegida
✅ Roles de usuário (master, admin, client)
✅ CORS configurado

---

## 🐛 Troubleshooting

### Erro: "Email ou senha inválidos"
- Verifique se o usuário foi criado com `node criar-usuario-teste.js`
- Verifique se o MongoDB está conectando
- Confirme as credenciais

### Erro: "Token inválido"
- Token expirou (8h)
- Faça login novamente
- Limpe o localStorage se necessário

### Erro: "MongoDB connection"
- Confirme a MONGO_URI em .env
- Verifique se o cluster MongoDB está ativo
- Teste a conexão com `mongosh`

---

## 📚 Arquivos relacionados

- `backend/models/User.js` - Schema de usuário
- `backend/models/Empresa.js` - Schema de empresa
- `backend/server.js` - Endpoints de login e autenticação
- `backend/middleware/auth.js` - Validação de token
- `frontend/painel-empresas/src/pages/Login.jsx` - Tela de login
- `frontend/painel-empresas/src/services/api.js` - Cliente axios
- `backend/criar-usuario-teste.js` - Script para criar usuário
- `backend/criar-empresa-teste.js` - Script para criar empresa

