# Guia de Setup - YouBot Backend

## ✅ ERROS CORRIGIDOS (Nov 09, 2025)

### 1. **Arquivo de Inicialização Incorreto**
- **Problema**: package.json tentava executar `node index.js` mas o arquivo é `server.js`
- **Solução**: Corrigido para `"start": "node server.js"`

### 2. **Dependências Faltando**
Adicionadas:
- `express` (4.18.2) - Framework web
- `cors` (2.8.5) - CORS middleware
- `mongoose` (8.0.0) - MongoDB ODM
- `dotenv` (16.3.1) - Variáveis de ambiente
- `@whiskeysockets/baileys` (6.7.0) - WhatsApp API
- `qrcode` (1.5.3) - Gerador de QR Code

### 3. **Evento de Mensagens Comentado**
- **Problema**: `sock.ev.on('messages.upsert')` no botManager.js estava descomentado
- **Solução**: Descomentado para receber mensagens

## 🔧 CONFIGURAÇÃO NO RENDER

### Variáveis de Ambiente Necessárias:

1. **MONGO_URI** (Obrigatório)
   - URL de conexão ao MongoDB Atlas
   - Exemplo: `mongodb+srv://user:pass@cluster.mongodb.net/njbot`

2. **JWT_SECRET** (Obrigatório)
   - Chave secreta para geração de tokens JWT
   - Use uma string aleatória forte

3. **LOGIN_FIXO_EMAIL** (Obrigatório)
   - Email para fazer login na aplicação
   - Padrão: seu_email@exemplo.com

4. **LOGIN_FIXO_SENHA** (Obrigatório)
   - Senha para fazer login
   - Use uma senha segura

5. **PORT** (Opcional)
   - Porta do servidor (padrão: 3000)

6. **GOOGLE_GEMINI_API_KEY** (Opcional)
   - Chave da API Google Gemini para IA

## 🚀 COMO USAR

### Localmente:
```bash
cp .env.example .env
# Editar .env com suas credenciais
npm install
npm start
```

### No Render:
1. Vá para Dashboard > Configurações
2. Adicione cada variável em "Variáveis de Ambiente"
3. Faça deploy

## 📝 ENDPOINTS PRINCIPAIS

- `POST /api/login` - Login com email/senha
- `POST /api/empresas` - Criar nova empresa
- `GET /api/empresas` - Listar empresas
- `GET /api/qr/:id` - Obter QR Code
- `POST /api/reiniciar-bot/:id` - Reiniciar bot
