const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const empresaDB = require('./models/Empresa');
const handleMensagem = require('./handlers/chatbot');
const { gerarRespostaGemini } = require('./gemini');

const bots = {};
const atendimentosManuais = {};
const qrCodesGerados = {};
const statusBots = {};
const instanciasAtivas = new Map();

function estaEmHorarioComercial(empresa) {
  try {
    const agora = new Date();
    const diaAtual = agora.getDay().toString();
    const horariosMap = empresa.horariosSemana || new Map();
    const configDia = horariosMap.get ? horariosMap.get(diaAtual) : horariosMap[diaAtual];
    
    if (!configDia || !configDia.ativo) return false;
    
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    const minutosAgora = horaAtual * 60 + minutoAtual;
    
    const [hInicio, mInicio] = (configDia.inicio || '09:00').split(':').map(Number);
    const [hIntervaloInicio, mIntervaloInicio] = (configDia.intervaloInicio || '12:00').split(':').map(Number);
    const [hIntervaloFim, mIntervaloFim] = (configDia.intervaloFim || '13:00').split(':').map(Number);
    const [hFim, mFim] = (configDia.fim || '18:00').split(':').map(Number);
    
    const minutosInicio = hInicio * 60 + mInicio;
    const minutosIntervaloInicio = hIntervaloInicio * 60 + mIntervaloInicio;
    const minutosIntervaloFim = hIntervaloFim * 60 + mIntervaloFim;
    const minutosFim = hFim * 60 + mFim;
    
    const estaNoTurnoManha = minutosAgora >= minutosInicio && minutosAgora < minutosIntervaloInicio;
    const estaNoTurnoTarde = minutosAgora >= minutosIntervaloFim && minutosAgora < minutosFim;
    
    return estaNoTurnoManha || estaNoTurnoTarde;
  } catch (error) {
    console.error('Erro ao verificar horario comercial:', error);
    return true;
  }
}

async function iniciarBot(empresa) {
  const empresaId = empresa._id.toString();
  if (instanciasAtivas.has(empresaId)) {
    console.log('Ja existe instancia ativa para ' + empresa.nome);
    return null;
  }
  
  const pastaBase = path.join(__dirname, 'bots', empresaId);
  const pasta = path.join(pastaBase, 'auth_info_baileys');
  
  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta, { recursive: true });
  }
  
  instanciasAtivas.set(empresaId, true);
  console.log('Iniciando bot para: ' + empresa.nome);
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState(pasta);
    const { version } = await fetchLatestBaileysVersion();
    
    let resolveQRCode = null;
    const qrCodePromise = new Promise(resolve => {
      resolveQRCode = resolve;
    });
    
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      connectTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
      markOnlineOnConnect: false
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log('Estado da conexao: ' + connection);
      
      if (qr) {
        try {
          const qrCodeDataURL = await qrcode.toDataURL(qr);
          qrCodesGerados[empresaId] = qrCodeDataURL;
          if (resolveQRCode) resolveQRCode(qrCodeDataURL);
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
        }
      }
      
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        instanciasAtivas.delete(empresaId);
        delete bots[empresaId];
        
        try {
          const empresaAtualizada = await empresaDB.findById(empresa._id);
          if (!loggedOut && empresaAtualizada?.botAtivo) {
            setTimeout(() => {
              if (empresaAtualizada?.botAtivo && !instanciasAtivas.has(empresaId)) {
                iniciarBot(empresaAtualizada);
              }
            }, 10000);
            statusBots[empresaId] = { conectado: false, ultimaAtualizacao: new Date(), reconectando: true };
          } else {
            statusBots[empresaId] = { conectado: false, ultimaAtualizacao: new Date(), reconectando: false };
            if (loggedOut && fs.existsSync(pastaBase)) {
              fs.rmSync(pastaBase, { recursive: true, force: true });
            }
          }
        } catch (error) {
          console.error('Erro durante reconexao:', error);
          instanciasAtivas.delete(empresaId);
          delete bots[empresaId];
        }
      }
      
      if (connection === 'open') {
        console.log('Conectado com sucesso!');
        statusBots[empresaId] = { conectado: true, ultimaAtualizacao: new Date(), reconectando: false };
        delete qrCodesGerados[empresaId];
        bots[empresaId] = sock;
      }
    });
    
    sock.ev.on('messages.upsert', async (m) => {
      try {
        if (!m.messages || m.messages.length === 0) return;
        
        for (const msg of m.messages) {
          try {
            if (!msg || !msg.message) continue;
            
            const sender = msg.key.remoteJid;
            let texto = msg.message?.conversation || '';
            const textoLower = texto.toLowerCase().trim();
            
            const empresaAtualizada = await empresaDB.findById(empresa._id);
            if (!empresaAtualizada?.botAtivo) continue;
            
            const chaveAtendimento = empresaAtualizada._id + '_' + sender;
            if (!atendimentosManuais[chaveAtendimento]) {
              atendimentosManuais[chaveAtendimento] = {
                ativo: false,
                ultimoContato: null,
                iniciado: false,
                nomeEmpresa: empresaAtualizada.nome
              };
            }
            
            const atendimento = atendimentosManuais[chaveAtendimento];
            
            if (!estaEmHorarioComercial(empresaAtualizada)) {
              continue;
            }
            
            const solicitarHumanoKeywords = ['#humano', 'humano', 'atendente'];
            if (solicitarHumanoKeywords.some(k => textoLower.includes(k))) {
              atendimento.ativo = true;
              try {
                await sock.sendMessage(sender, { text: 'Transferindo para atendente humano...' });
              } catch (err) {
                console.error('Erro ao avisar sobre transferencia:', err);
              }
              continue;
            }
            
            if (atendimento.ativo) continue;
            
            try {
              const resultado = await handleMensagem(empresaAtualizada._id.toString(), texto);
              const respostaTexto = resultado?.resposta || (typeof resultado === 'string' ? resultado : null);
              if (respostaTexto) {
                await sock.sendMessage(sender, { text: respostaTexto });
              }
            } catch (err) {
              console.error('Erro ao gerar resposta:', err);
            }
          } catch (msgErr) {
            console.error('Erro processando mensagem:', msgErr);
          }
        }
      } catch (error) {
        console.error('Erro em messages.upsert:', error);
      }
    });
    
    console.log('Aguardando QR Code indefinidamente...');
    const qrCodeBase64 = await qrCodePromise;
    console.log('QR Code processado');
    return qrCodeBase64;
  } catch (error) {
    console.error('Erro critico ao iniciar bot:', error);
    instanciasAtivas.delete(empresaId);
    delete bots[empresaId];
    throw error;
  }
}

function getQRCode(empresaId) {
  return qrCodesGerados[empresaId] || null;
}

async function reiniciarBot(empresa) {
  const empresaId = empresa._id.toString();
  console.log('Reiniciando bot para: ' + empresa.nome);
  const pastaBase = path.join(__dirname, 'bots', empresaId);
  
  if (fs.existsSync(pastaBase)) {
    fs.rmSync(pastaBase, { recursive: true, force: true });
  }
  
  instanciasAtivas.delete(empresaId);
  if (bots[empresaId]) {
    try {
      await bots[empresaId].end();
    } catch (err) {
      console.error('Erro ao encerrar bot:', err);
    }
    delete bots[empresaId];
  }
  
  delete qrCodesGerados[empresaId];
  await new Promise(resolve => setTimeout(resolve, 2000));
  return iniciarBot(empresa);
}

async function toggleBot(empresa) {
  const empresaId = empresa._id.toString();
  console.log('Alternando bot ' + empresa.nome);
  
  if (!empresa.botAtivo) {
    if (bots[empresaId]) {
      try {
        await bots[empresaId].end();
        delete bots[empresaId];
        instanciasAtivas.delete(empresaId);
      } catch (err) {
        console.error('Erro ao desligar bot:', err);
      }
    }
    delete qrCodesGerados[empresaId];
  }
  
  if (empresa.botAtivo && !instanciasAtivas.has(empresaId)) {
    try {
      await iniciarBot(empresa);
    } catch (err) {
      console.error('Erro ao iniciar bot:', err);
    }
  }
}

function deletarEmpresa(empresaId) {
  console.log('Excluindo bot da empresa: ' + empresaId);
  delete qrCodesGerados[empresaId];
  if (bots[empresaId]) {
    try {
      bots[empresaId].end();
    } catch (err) {
      console.error('Erro ao encerrar bot:', err);
    }
    delete bots[empresaId];
  }
  
  const authPath = path.join(__dirname, 'bots', empresaId);
  if (fs.existsSync(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true });
  }
  
  for (const chave in atendimentosManuais) {
    if (chave.startsWith(empresaId)) {
      delete atendimentosManuais[chave];
    }
  }
  
  instanciasAtivas.delete(empresaId);
  delete statusBots[empresaId];
}

module.exports = {
  iniciarBot,
  getQRCode,
  reiniciarBot,
  toggleBot,
  deletarEmpresa,
  statusBots,
  instanciasAtivas,
  bots,
  atendimentosManuais
};
