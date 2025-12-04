# Melhorias Pendentes para o Bot

## 1. ADICIONAR LOGGING COMPLETO NO botManager.js

Na seção `messages.upsert` (linha 136), TROCAR:

```javascript
let texto = msg.message?.conversation || '';
const textoLower = texto.toLowerCase().trim();

const empresaAtualizada = await empresaDB.findById(empresa._id);
if (!empresaAtualizada?.botAtivo) continue;
```

POR:

```javascript
// Ignora mensagens do próprio bot
if (msg.key.fromMe) continue;

const sender = msg.key.remoteJid;

// Extrai texto de diferentes tipos de mensagem
let texto = msg.message?.conversation || 
           msg.message?.extendedTextMessage?.text || 
           msg.message?.imageMessage?.caption || 
           '';

if (!texto || !texto.trim()) {
  console.log('📝 [VAZIO] Mensagem sem texto');
  continue;
}

const textoLower = texto.toLowerCase().trim();
console.log(`📨 [RECEBIDA] ${sender}: "${texto.substring(0, 50)}..."`);

const empresaAtualizada = await empresaDB.findById(empresa._id);
if (!empresaAtualizada?.botAtivo) {
  console.log('❌ [BLOQUEADO] Bot inativo');
  continue;
}
```

## 2. ADICIONAR MAIS LOGS EM CADA PASSO

Nas linhas 180-190, adicione:

```javascript
try {
  console.log('🤖 [IA] Gerando resposta para:', empresaAtualizada.nome);
  const resultado = await handleMensagem(empresaAtualizada._id.toString(), texto);
  const respostaTexto = resultado?.resposta || (typeof resultado === 'string' ? resultado : null);
  if (respostaTexto) {
    console.log('✅ [ENVIADA] Resposta:', respostaTexto.substring(0, 50) + '...');
    await sock.sendMessage(sender, { text: respostaTexto });
  } else {
    console.warn('⚠️ [VAZIO] Resposta IA vazia');
  }
} catch (err) {
  console.error('❌ [ERRO IA]', err.message);
  await sock.sendMessage(sender, { text: '⚠️ Erro ao processar. Digite #humano para falar com atendente.' });
}
```

## 3. RESULTADO

Agora você verá nos logs do backend:

```
📨 [RECEBIDA] +5551234567890: "Oi, tudo bem?"
🤖 [IA] Gerando resposta para: Minha Empresa
✅ [ENVIADA] Resposta: "Olá! Bem-vindo ao..."
```

Isso ajudará a debugar os problemas!

## 4. SOBRE O BOT NÃO INICIAR CONVERSA

O bot APENAS RESPONDE mensagens. Para ele iniciar conversa, seria necessário:

- [ ] Adicionar comando `/enviar-msg` no painel para enviar mensagem via API
- [ ] Adicionar agendador (cron job) para enviar mensagens periódicas
- [ ] Webhook externo para disparar mensagens

Quer que implemente algum desses?
