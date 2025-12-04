# YouAi.BETA 🚀

MVP - Multi-tenant WhatsApp Chatbot Platform with AI Integration

## 📋 Overview

YouAi.BETA é uma plataforma inovadora que permite gerenciar múltiplos chatbots WhatsApp com integração de IA (OpenAI, Google Gemini). Cada empresa pode ter seus próprios bots e configurar credenciais de forma segura.

### ✨ Features

- 👥 **Multi-tenant**: Gerenciar múltiplas empresas e bots
- 🤖 **AI Integration**: Suporte para OpenAI e Google Gemini
- 💬 **WhatsApp Bot**: Integração com WhatsApp via Baileys
- 🔐 **Segurança**: JWT authentication + bcrypt password hashing
- 📊 **Dashboard**: Painel de controle para gerenciamento de bots
- ⚙️ **Config**: Gerenciar credenciais e prompts da IA por empresa

---

## 🛠️ Instalação

### Requisitos
- **Node.js** 20.x (veja `.nvmrc`)
- **MongoDB** (local ou Atlas)
- **npm** ou **yarn**

### Passo 1: Clonar e instalar

```bash
# Clonar repositório
git clone https://github.com/JeanSd1/YouAi.BETA.git
cd YouAi.BETA

# Instalar dependências da raiz
npm install

# Instalar dependências do backend
cd backend && npm install

# Instalar dependências do frontend
cd ../frontend/painel-empresas && npm install

# Voltar para a raiz
cd ../../
```

### Passo 2: Configurar variáveis de ambiente

Crie arquivo `.env` na raiz e em `backend/.env`:

```env
# .env (raiz)
PORT=3000
NODE_ENV=development

# .env (backend)
PORT=3000
DB_URL=mongodb+srv://user:password@cluster.mongodb.net/youai
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIzaSy...
JWT_SECRET=seu_secret_aleatorio
```

Copie do `.env.example`:
```bash
cp .env.example .env
# Edite .env com suas credenciais
```

---

## 🚀 Rodando o Projeto

### Backend Standalone

```bash
cd backend
npm start
# Servidor rodando em http://localhost:3000
```

### Frontend Standalone

```bash
cd frontend/painel-empresas
npm run dev
# Frontend rodando em http://localhost:5174
```

### Backend + Frontend (Concorrente)

```bash
npm run start:dev
# Ambos rodando
```

### Testar MVP

```bash
# Certifique-se que backend está rodando
npm run test:mvp
# Testa login, busca de empresas e IA
```

---

## 🐳 Docker

### Build

```bash
docker build -t youai .
```

### Run

```bash
docker run \
  -p 3000:3000 \
  -e DB_URL=mongodb+srv://... \
  -e OPENAI_API_KEY=sk-... \
  youai
```

---

## 📁 Estrutura do Projeto

```
YouAi.BETA/
├── backend/                    # API Express
│   ├── models/                # MongoDB schemas
│   ├── services/              # Lógica de negócio
│   ├── middleware/            # Auth, validação
│   ├── handlers/              # Handlers de eventos
│   └── server.js              # Servidor principal
│
├── frontend/
│   └── painel-empresas/       # Dashboard React + Vite
│       ├── src/
│       │   ├── components/    # Componentes React
│       │   ├── pages/         # Páginas
│       │   └── services/      # API client
│       └── package.json
│
├── .env.example               # Template variáveis
├── .gitignore                 # Git ignore
├── Dockerfile                 # Container setup
├── package.json               # Dependências raiz
└── test-ia.js                 # MVP test script
```

---

## 🔌 API Endpoints

### Autenticação
- `POST /api/login` - Login com email/senha
- `POST /api/register` - Registrar novo usuário

### Empresas
- `GET /api/empresas` - Listar empresas (auth)
- `POST /api/empresas` - Criar empresa (auth)
- `PUT /api/empresas/:id` - Atualizar empresa (auth)
- `POST /api/empresas/:id/credenciais` - Atualizar credenciais (auth)
- `POST /api/empresas-setup/:id/credenciais` - Setup credenciais (sem auth)

### IA
- `POST /api/test-message` - Testar resposta IA
- `POST /api/empresas/:id/configurar-ia` - Configurar IA

---

## 🧪 Testes

### MVP Test

```bash
npm run test:mvp
```

Testa:
1. Login com credenciais master
2. Listagem de empresas
3. Teste de mensagem IA

---

## 🔐 Segurança

- ✅ Senhas com bcrypt (10 salt rounds)
- ✅ JWT para autenticação
- ✅ Validação de inputs
- ✅ CORS configurado
- ✅ Credenciais em .env (nunca no Git)

---

## 📝 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente | `development` |
| `DB_URL` | MongoDB connection string | `mongodb+srv://...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `JWT_SECRET` | JWT signing secret | `seu_secret` |

---

## 🚨 Troubleshooting

### Erro: "Cannot find module"
```bash
rm -rf node_modules backend/node_modules frontend/painel-empresas/node_modules
npm install
```

### Erro: "Connection refused" no banco de dados
- Verificar `DB_URL` em `.env`
- Confirmar MongoDB está rodando

### Erro: "Invalid API Key"
- Verificar chaves em `.env`
- Confirmar valores estão corretos

---

## 👨‍💻 Autor

**YouAi Team** - [GitHub](https://github.com/JeanSd1)

---

**Última atualização**: Dezembro 2024

