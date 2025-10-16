// const fs = require('fs');
// const path = require('path');
// const qrcode = require('qrcode');
// const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
// const empresaDB = require('./models/Empresa');

// const bots = {};  // cache { nomeEmpresa: sock }
// const atendimentosManuais = {};  // { chaveEmpresa_remetente: { ativo, ultimoContato, iniciado, nomeEmpresa } }
// const qrCodesGerados = {}; // { nomeEmpresa: base64QR }

// const statusBots = {}; // { nomeEmpresa: { conectado: boolean, ultimaAtualizacao: Date } }

// async function iniciarBot(empresa) {
//   const pasta = path.join(__dirname, 'bots', empresa.nome, 'auth_info_baileys');
//   if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });

// const { state, saveCreds } = await useMultiFileAuthState(pasta);
// const sock = makeWASocket({ auth: state });

// let resolveQRCode;
// const qrCodePromise = new Promise(resolve => { resolveQRCode = resolve; });

// sock.ev.on('creds.update', saveCreds);

// sock.ev.on('connection.update', async (update) => {
// const { connection, lastDisconnect, qr } = update;

// if (qr) {
//  qrCodesGerados[empresa.nome] = await qrcode.toDataURL(qr);
// resolveQRCode(qr);
// }

// if (connection === 'close') {
//  const statusCode = lastDisconnect?.error?.output?.statusCode;
//  const loggedOut = statusCode === DisconnectReason.loggedOut;
//  const empresaAtualizada = await empresaDB.findById(empresa._id);

// // Limpa o QR Code do cache caso a conexão caia
// if(qrCodesGerados[empresa.nome]) {
// delete qrCodesGerados[empresa.nome];
//  }

// if (!loggedOut && empresaAtualizada?.botAtivo) {
//  console.log(`[RECONNECT] Reconectando bot de ${empresaAtualizada.nome}...`);
//  iniciarBot(empresaAtualizada);

// // >>> REMOVIDO: A linha statusBots[empresa._id] = { conectado: false, ... }
//  // é removida aqui. O status permanece o último conhecido até reconectar.
//  } else {
// console.log(`[RECONNECT] Não reconectando: loggedOut=${loggedOut}, botAtivo=${empresaAtualizada?.botAtivo}`);

// // MANTIDO: Se realmente foi logout, aí sim marca como desconectado permanente
// statusBots[empresa._id] = { conectado: false, ultimaAtualizacao: new Date() };
//  }
// }

//  if (connection === 'open') {
//  statusBots[empresa._id] = { conectado: true, ultimaAtualizacao: new Date() };
//  console.log(`🤖 Conectado com sucesso: ${empresa.nome}`);

// // Limpa o QR Code do cache quando a conexão é estabelecida
// if (qrCodesGerados[empresa.nome]) {
//  delete qrCodesGerados[empresa.nome];
//  console.log(`[QR CODE] QR Code de ${empresa.nome} limpo após conexão.`);
//  }
//  }
//  });

//   const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
//   const { WritableStreamBuffer } = require('stream-buffers');
//   const handleMensagem = require('./handlers/chatbot');
//   const { transcreverAudio } = require('./transcreverAudio');

//   sock.ev.on('messages.upsert', async (m) => {
//     try {
//       const msg = m.messages?.[0];
//       if (!msg || !msg.message) return;

//       const sender = msg.key.remoteJid;

//       // Extrai texto das mensagens
//       let texto =
//         msg.message?.conversation ||
//         msg.message?.extendedTextMessage?.text ||
//         msg.message?.imageMessage?.caption ||
//         msg.message?.videoMessage?.caption ||
//         msg.message?.documentMessage?.caption ||
//         msg.message?.buttonsResponseMessage?.selectedButtonId ||
//         msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
//         '';

//       // Tratamento de áudio (voz)
//       if (msg.message?.voiceMessage || msg.message?.audioMessage) {
//         const type = msg.message.voiceMessage ? 'voiceMessage' : 'audioMessage';
//         const stream = await downloadContentFromMessage(msg.message[type], type.replace('Message', ''));

//         const bufferStream = new WritableStreamBuffer();
//         for await (const chunk of stream) {
//           bufferStream.write(chunk);
//         }
//         bufferStream.end();

//         const audioBuffer = bufferStream.getContents();
//         if (audioBuffer) {
//           texto = await transcreverAudio(audioBuffer);
//         }
//       }

//       const textoLower = texto.toLowerCase().trim();

//       // Lista de comandos que podem ser usados mesmo se vierem de fromMe (atendente humano)
//       const comandosPermitidosMesmoFromMe = [
//         '#bot', '#sair', '#encerrar', 'bot',
//         '#humano', '#atendente', '#manual'
//       ];

//       if (msg.key.fromMe && !comandosPermitidosMesmoFromMe.some(c => textoLower.includes(c))) {
//         return;
//       }

//       const empresaAtualizada = await empresaDB.findById(empresa._id);
//       if (!empresaAtualizada?.botAtivo) return;

//       const chaveAtendimento = `${empresaAtualizada._id}_${sender}`;
//       if (!atendimentosManuais[chaveAtendimento]) {
//         atendimentosManuais[chaveAtendimento] = {
//           ativo: false,
//           ultimoContato: null,
//           iniciado: false,
//           nomeEmpresa: empresaAtualizada.nome
//         };
//       }

//       const saudacoes = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite'];
//       const comandosEspeciais = ['#sair', '#bot', 'bot'];

//       // Comandos especiais
//       if (comandosEspeciais.includes(textoLower)) {
//         if (textoLower === '#sair') {
//           delete atendimentosManuais[chaveAtendimento];
//           await sock.sendMessage(sender, { text: '✅ Conversa reiniciada. Digite "oi" para começar.' });
//           return;
//         }
//         if (textoLower === '#bot' || textoLower === 'bot') {
//           atendimentosManuais[chaveAtendimento] = { ativo: false, iniciado: false, nomeEmpresa: empresaAtualizada.nome };
//           await sock.sendMessage(sender, { text: '🤖 Atendimento automático ativado.' });
//           return;
//         }
//       }

//       // Palavras-chave para atendimento humano (cliente OU atendente)
//       const palavrasChaveAtendente = [
//         'atendente', 'humano', 'pessoa', 'falar com atendente', 'falar com humano',
//         'quero atendimento humano', 'quero falar com alguém', 'ajuda de um atendente',
//         'quero um atendente', 'preciso de ajuda humana',
//         '#humano', '#atendente', '#manual'
//       ];

//       if (palavrasChaveAtendente.some(p => textoLower.includes(p))) {
//         atendimentosManuais[chaveAtendimento].ativo = true;
//         atendimentosManuais[chaveAtendimento].ultimoContato = new Date();

//         if (!msg.key.fromMe) {
//           await sock.sendMessage(sender, { text: '📨 Solicitação enviada ao atendente humano. Aguarde um momento.' });
//         }
//         return;
//       }

//       if (saudacoes.includes(textoLower) && !atendimentosManuais[chaveAtendimento].iniciado) {
//       atendimentosManuais[chaveAtendimento].iniciado = true;
//       atendimentosManuais[chaveAtendimento].ultimoContato = new Date();

//       // 1. Define o texto de saudação: usa o campo do DB ou um fallback
//       const textoSaudacao = empresaAtualizada.msgBoasVindas || 
//       `Olá! 👋 Bem-vindo(a) à ${empresaAtualizada.nome}! Como posso te ajudar?`;

//       // 2. Garante que se o placeholder [Nome da Empresa] for usado no DB, ele seja substituído
//       const saudacaoFinal = textoSaudacao.replace('[Nome da Empresa]', empresaAtualizada.nome);

//       // 3. O sock.sendMessage permanece, enviando o texto dinâmico.
//       await sock.sendMessage(sender, {
//           text: saudacaoFinal 
//       });
//       return;
//   }

//       // Atualiza último contato
//       atendimentosManuais[chaveAtendimento].ultimoContato = new Date();

//       // Atualiza presença
//       await sock.sendPresenceUpdate('composing', sender);

//       // Integração com Gemini (IA)
//       const { gerarRespostaGemini } = require('./gemini');
//       const respostaTexto = await gerarRespostaGemini(empresaAtualizada.promptIA, texto);
//       await sock.sendMessage(sender, { text: respostaTexto });

//     } catch (err) {
//       console.error('❌ Erro no processamento da mensagem:', err);
//     }
//   });

//   bots[empresa.nome] = sock;
//   const qrCodeBase64 = await qrCodePromise.then(qr => qrcode.toDataURL(qr));
//   return qrCodeBase64;
// }

// function getQRCode(nomeEmpresa) {
//   return qrCodesGerados[nomeEmpresa] || null;
// }

// async function reiniciarBot(empresa) {
//   const authPath = path.join(__dirname, 'bots', empresa.nome, 'auth_info_baileys');
//   if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });

//   if (bots[empresa.nome]) {
//     try {
//       if (bots[empresa.nome].end) {
//         await bots[empresa.nome].end();
//       } else if (bots[empresa.nome].logout) {
//         await bots[empresa.nome].logout();
//       }
//     } catch (err) {
//       console.error(`Erro ao encerrar bot ${empresa.nome} antes de reiniciar:`, err);
//     }
//     delete bots[empresa.nome];
//   }

//   return iniciarBot(empresa);
// }

// async function toggleBot(empresa) {
//   if (!empresa.botAtivo && bots[empresa.nome]) {
//     try {
//       if (bots[empresa.nome].end) {
//         await bots[empresa.nome].end();
//       } else if (bots[empresa.nome].logout) {
//         await bots[empresa.nome].logout();
//       }
//       delete bots[empresa.nome];
//       console.log(`[TOGGLE] Bot de ${empresa.nome} desligado.`);
//     } catch (err) {
//       console.error(`[TOGGLE] Erro ao desligar bot de ${empresa.nome}:`, err);
//     }
//   }

//   if (empresa.botAtivo && !bots[empresa.nome]) {
//     try {
//       await iniciarBot(empresa);
//       console.log(`[TOGGLE] Bot de ${empresa.nome} iniciado.`);
//     } catch (err) {
//       console.error(`[TOGGLE] Erro ao iniciar bot de ${empresa.nome}:`, err);
//     }
//   }
// }

// function deletarEmpresa(nomeEmpresa) {
//   delete qrCodesGerados[nomeEmpresa];

//   if (bots[nomeEmpresa]) {
//     try {
//       bots[nomeEmpresa].end ? bots[nomeEmpresa].end() : bots[nomeEmpresa].logout();
//     } catch (err) {
//       console.error(`Erro ao encerrar bot ${nomeEmpresa} durante exclusão:`, err);
//     }
//     delete bots[nomeEmpresa];
//   }
// }

// // Intervalo para encerrar atendimentos inativos + resetar boas-vindas
// setInterval(async () => { // <<< MUDANÇA: O setInterval deve ser assíncrono para usar await
//   const agora = new Date();

//   for (const chave in atendimentosManuais) {
//     const atendimento = atendimentosManuais[chave];

//     // Extrai o ID da empresa da chave (formato: ID_remetente)
//     const idEmpresa = chave.split('_')[0]; 

//     // Busca as configurações atuais da empresa
//     const empresaConfig = await empresaDB.findById(idEmpresa);

//     // Define o timeout: usa o valor do DB, com 10 minutos como fallback seguro
//     const timeoutMinutos = empresaConfig?.timeoutHumanoMinutos || 10;
    
//     // Encerrar atendimento humano após timeout customizado
//     if (atendimento.ativo && atendimento.ultimoContato) {
//       const diffMinutos = (agora - atendimento.ultimoContato) / 1000 / 60;
      
//       if (diffMinutos >= timeoutMinutos) { // <<< USANDO O VALOR DINÂMICO
//         atendimento.ativo = false;
//         atendimento.ultimoContato = null;

//         const sender = chave.split('_')[1];
//         // Nota: O botSock ainda usa o nome. Recomendado migrar o cache 'bots' para usar o ID.
//         const botSock = bots[atendimento.nomeEmpresa]; 

//         if (botSock) {
//           botSock.sendMessage(sender, {
//             text: '🤖 Atendimento humano encerrado por inatividade. Agora você está falando com o assistente virtual novamente.'
//           }).catch(console.error);
//         }
//       }
//     }
    

//     // Resetar boas-vindas após 2h sem contato
//     if (atendimento.iniciado && atendimento.ultimoContato) {
//       const diffHoras = (agora - atendimento.ultimoContato) / 1000 / 60 / 60;
//       if (diffHoras >= 2) {
//         atendimento.iniciado = false;
//         atendimento.ultimoContato = null;
//         console.log(`🔄 Reset de saudação para ${chave} por inatividade de 2h.`);
//       }
//     }
//   }
// }, 60 * 1000);

// module.exports = {
//   iniciarBot,
//   getQRCode,
//   reiniciarBot,
//   toggleBot,
//   deletarEmpresa,
//   statusBots
// };

const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const empresaDB = require('./models/Empresa');

const bots = {};  // cache { nomeEmpresa: sock }
// ATUALIZAÇÃO: Adiciona msgFechadoEnviada para controle de spam no horário fechado
const atendimentosManuais = {};  // { chaveEmpresa_remetente: { ativo, ultimoContato, iniciado, nomeEmpresa, msgFechadoEnviada } }
const qrCodesGerados = {}; // { nomeEmpresa: base64QR }
const statusBots = {}; // { nomeEmpresa: { conectado: boolean, ultimaAtualizacao: Date } }

// 1. FUNÇÃO DE VERIFICAÇÃO DE HORÁRIO DE ATENDIMENTO
function estaEmHorarioComercial(empresa) {
    const agora = new Date();
    const diaAtual = agora.getDay().toString(); // 0 (Dom) a 6 (Sáb)
    
    const horariosMap = empresa.horariosSemana || new Map();
    const configDia = horariosMap.get(diaAtual);

    if (!configDia || !configDia.ativo) {
        return false; // Dia inativo/fechado
    }

    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    
    // Assume 09:00 e 18:00 como fallback se as strings forem inválidas
    const [hInicio, mInicio] = (configDia.inicio || '09:00').split(':').map(Number);
    const [hFim, mFim] = (configDia.fim || '18:00').split(':').map(Number);
    
    const minutosAgora = horaAtual * 60 + minutoAtual;
    const minutosInicio = hInicio * 60 + mInicio;
    const minutosFim = hFim * 60 + mFim;

    // Horário normal dentro do mesmo dia
    return minutosAgora >= minutosInicio && minutosAgora < minutosFim;
}


async function iniciarBot(empresa) {
  const pasta = path.join(__dirname, 'bots', empresa.nome, 'auth_info_baileys');
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(pasta);
    const sock = makeWASocket({ auth: state });

    let resolveQRCode;
    const qrCodePromise = new Promise(resolve => { resolveQRCode = resolve; });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodesGerados[empresa.nome] = await qrcode.toDataURL(qr);
            resolveQRCode(qr);
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const loggedOut = statusCode === DisconnectReason.loggedOut;
            const empresaAtualizada = await empresaDB.findById(empresa._id);

            // Limpa o QR Code do cache caso a conexão caia
            if (qrCodesGerados[empresa.nome]) {
                delete qrCodesGerados[empresa.nome];
            }

            if (!loggedOut && empresaAtualizada?.botAtivo) {
                console.log(`[RECONNECT] Reconectando bot de ${empresaAtualizada.nome}...`);
                iniciarBot(empresaAtualizada);

                // O status permanece o último conhecido até reconectar (ESTABILIDADE)
            } else {
                console.log(`[RECONNECT] Não reconectando: loggedOut=${loggedOut}, botAtivo=${empresaAtualizada?.botAtivo}`);

                // Se realmente foi logout, aí sim marca como desconectado permanente
                statusBots[empresa._id] = { conectado: false, ultimaAtualizacao: new Date() };
            }
        }

        if (connection === 'open') {
            statusBots[empresa._id] = { conectado: true, ultimaAtualizacao: new Date() };
            console.log(`🤖 Conectado com sucesso: ${empresa.nome}`);

            // Limpa o QR Code do cache quando a conexão é estabelecida
            if (qrCodesGerados[empresa.nome]) {
                delete qrCodesGerados[empresa.nome];
                console.log(`[QR CODE] QR Code de ${empresa.nome} limpo após conexão.`);
            }
        }
    });

  const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
  const { WritableStreamBuffer } = require('stream-buffers');
  const handleMensagem = require('./handlers/chatbot');
  const { transcreverAudio } = require('./transcreverAudio');

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages?.[0];
      if (!msg || !msg.message) return;

      const sender = msg.key.remoteJid;

      // Extrai texto das mensagens (lógica existente)
      let texto =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        msg.message?.documentMessage?.caption ||
        msg.message?.buttonsResponseMessage?.selectedButtonId ||
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
        '';

      // Tratamento de áudio (voz) (lógica existente)
      if (msg.message?.voiceMessage || msg.message?.audioMessage) {
        const type = msg.message.voiceMessage ? 'voiceMessage' : 'audioMessage';
        const stream = await downloadContentFromMessage(msg.message[type], type.replace('Message', ''));

        const bufferStream = new WritableStreamBuffer();
        for await (const chunk of stream) {
          bufferStream.write(chunk);
        }
        bufferStream.end();

        const audioBuffer = bufferStream.getContents();
        if (audioBuffer) {
          texto = await transcreverAudio(audioBuffer);
        }
      }

      const textoLower = texto.toLowerCase().trim();

      // Lista de comandos que podem ser usados mesmo se vierem de fromMe (lógica existente)
      const comandosPermitidosMesmoFromMe = [
        '#bot', '#sair', '#encerrar', 'bot',
        '#humano', '#atendente', '#manual'
      ];

      if (msg.key.fromMe && !comandosPermitidosMesmoFromMe.some(c => textoLower.includes(c))) {
        return;
      }

      const empresaAtualizada = await empresaDB.findById(empresa._id);
      if (!empresaAtualizada?.botAtivo) return;

      const chaveAtendimento = `${empresaAtualizada._id}_${sender}`;
      if (!atendimentosManuais[chaveAtendimento]) {
        atendimentosManuais[chaveAtendimento] = {
          ativo: false,
          ultimoContato: null,
          iniciado: false,
          nomeEmpresa: empresaAtualizada.nome,
          msgFechadoEnviada: null // NOVO CAMPO DE CONTROLE
        };
      }
      
      const atendimento = atendimentosManuais[chaveAtendimento]; // Referência para facilitar

      // >>> 2. LÓGICA DE HORÁRIO DE ATENDIMENTO COM CONTROLE DE SPAM <<<
      if (!estaEmHorarioComercial(empresaAtualizada)) {
          const agora = new Date();
          const minutosDesdeUltimoFechado = atendimento.msgFechadoEnviada 
              ? (agora - atendimento.msgFechadoEnviada) / 1000 / 60 
              : Infinity;
          
          const TOLERANCIA_MINUTOS = 20; // Reenvia a cada 20 minutos (padrão)

          if (minutosDesdeUltimoFechado > TOLERANCIA_MINUTOS) {
              const diaAtual = agora.getDay().toString();
              const configDia = empresaAtualizada.horariosSemana?.get(diaAtual) || {};

              // Monta a mensagem de fechado, usando os placeholders
              const msg = empresaAtualizada.msgFechado
                  .replace('[HORARIO_INICIO]', configDia.inicio || '00:00')
                  .replace('[HORARIO_FIM]', configDia.fim || '00:00');

              await sock.sendMessage(sender, { text: msg });
              
              // Registra o envio para evitar spam
              atendimento.msgFechadoEnviada = agora;
          }
          
          return; // Sai da função, ignorando o resto do processamento da mensagem
      }
      // >>> FIM DA LÓGICA DE HORÁRIO <<<


      const saudacoes = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite'];
      const comandosEspeciais = ['#sair', '#bot', 'bot'];

      // Comandos especiais (lógica existente)
      if (comandosEspeciais.includes(textoLower)) {
        if (textoLower === '#sair') {
          delete atendimentosManuais[chaveAtendimento];
          await sock.sendMessage(sender, { text: '✅ Conversa reiniciada. Digite "oi" para começar.' });
          return;
        }
        if (textoLower === '#bot' || textoLower === 'bot') {
          atendimentosManuais[chaveAtendimento] = { ativo: false, iniciado: false, nomeEmpresa: empresaAtualizada.nome };
          await sock.sendMessage(sender, { text: '🤖 Atendimento automático ativado.' });
          return;
        }
      }

      // >>> 3. LÓGICA DE ATENDIMENTO HUMANO CORRIGIDA (com feedback para o atendente) <<<
      const palavrasChaveAtendente = [
        'atendente', 'humano', 'pessoa', 'falar com atendente', 'falar com humano',
        'quero atendimento humano', 'quero falar com alguém', 'ajuda de um atendente',
        'quero um atendente', 'preciso de ajuda humana',
        '#humano', '#atendente', '#manual'
      ];

      if (palavrasChaveAtendente.some(p => textoLower.includes(p))) {
        atendimento.ativo = true;
        atendimento.ultimoContato = new Date();

        if (msg.key.fromMe) {
            // Se for o PRÓPRIO ATENDENTE ativando (feedback para ele mesmo)
            await sock.sendMessage(sender, { text: '👤 Você está no modo Atendimento Humano. O bot foi desativado para este chat.' });
        } else {
            // Se for o CLIENTE (mensagem de espera)
            await sock.sendMessage(sender, { text: '📨 Solicitação enviada ao atendente humano. Aguarde um momento.' });
        }
        return;
      }
      
      // Se atendimento humano ativo, apenas atualiza último contato (lógica existente)
      if (atendimento.ativo) {
        atendimento.ultimoContato = new Date();
        console.log(`👤 Atendimento humano ativo para: ${sender}`);
        return;
      }
      // >>> FIM DA LÓGICA DE ATENDIMENTO HUMANO CORRIGIDA <<<

      // Saudação inicial (lógica existente, usando campo msgBoasVindas)
      if (saudacoes.includes(textoLower) && !atendimento.iniciado) {
      atendimento.iniciado = true;
      atendimento.ultimoContato = new Date();

      // 1. Define o texto de saudação: usa o campo do DB ou um fallback
      const textoSaudacao = empresaAtualizada.msgBoasVindas || 
      `Olá! 👋 Bem-vindo(a) à ${empresaAtualizada.nome}! Como posso te ajudar?`;

      // 2. Garante que se o placeholder [Nome da Empresa] for usado no DB, ele seja substituído
      const saudacaoFinal = textoSaudacao.replace('[Nome da Empresa]', empresaAtualizada.nome);

      // 3. O sock.sendMessage permanece, enviando o texto dinâmico.
      await sock.sendMessage(sender, {
          text: saudacaoFinal 
      });
      return;
      }

      // Atualiza último contato
      atendimento.ultimoContato = new Date();

      // Atualiza presença (lógica existente)
      await sock.sendPresenceUpdate('composing', sender);

      // Integração com Gemini (IA) (lógica existente)
      const { gerarRespostaGemini } = require('./gemini');
      const respostaTexto = await gerarRespostaGemini(empresaAtualizada.promptIA, texto);
      await sock.sendMessage(sender, { text: respostaTexto });

    } catch (err) {
      console.error('❌ Erro no processamento da mensagem:', err);
    }
  });

  bots[empresa.nome] = sock;
  const qrCodeBase64 = await qrCodePromise.then(qr => qrcode.toDataURL(qr));
  return qrCodeBase64;
}

function getQRCode(nomeEmpresa) {
  return qrCodesGerados[nomeEmpresa] || null;
}

async function reiniciarBot(empresa) {
  const authPath = path.join(__dirname, 'bots', empresa.nome, 'auth_info_baileys');
  if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });

  if (bots[empresa.nome]) {
    try {
      if (bots[empresa.nome].end) {
        await bots[empresa.nome].end();
      } else if (bots[empresa.nome].logout) {
        await bots[empresa.nome].logout();
      }
    } catch (err) {
      console.error(`Erro ao encerrar bot ${empresa.nome} antes de reiniciar:`, err);
    }
    delete bots[empresa.nome];
  }

  return iniciarBot(empresa);
}

async function toggleBot(empresa) {
  if (!empresa.botAtivo && bots[empresa.nome]) {
    try {
      if (bots[empresa.nome].end) {
        await bots[empresa.nome].end();
      } else if (bots[empresa.nome].logout) {
        await bots[empresa.nome].logout();
      }
      delete bots[empresa.nome];
      console.log(`[TOGGLE] Bot de ${empresa.nome} desligado.`);
    } catch (err) {
      console.error(`[TOGGLE] Erro ao desligar bot de ${empresa.nome}:`, err);
    }
  }

  if (empresa.botAtivo && !bots[empresa.nome]) {
    try {
      await iniciarBot(empresa);
      console.log(`[TOGGLE] Bot de ${empresa.nome} iniciado.`);
    } catch (err) {
      console.error(`[TOGGLE] Erro ao iniciar bot de ${empresa.nome}:`, err);
    }
  }
}

function deletarEmpresa(nomeEmpresa) {
  delete qrCodesGerados[nomeEmpresa];

  if (bots[nomeEmpresa]) {
    try {
      bots[nomeEmpresa].end ? bots[nomeEmpresa].end() : bots[nomeEmpresa].logout();
    } catch (err) {
      console.error(`Erro ao encerrar bot ${nomeEmpresa} durante exclusão:`, err);
    }
    delete bots[nomeEmpresa];
  }
}

// Intervalo para encerrar atendimentos inativos + resetar boas-vindas
setInterval(async () => { 
  const agora = new Date();

  for (const chave in atendimentosManuais) {
    const atendimento = atendimentosManuais[chave];

    // Extrai o ID da empresa da chave (formato: ID_remetente)
    const idEmpresa = chave.split('_')[0]; 

    // Busca as configurações atuais da empresa
    const empresaConfig = await empresaDB.findById(idEmpresa);

    // Define o timeout: usa o valor do DB, com 10 minutos como fallback seguro
    const timeoutMinutos = empresaConfig?.timeoutHumanoMinutos || 10;
    
    // Encerrar atendimento humano após timeout customizado
    if (atendimento.ativo && atendimento.ultimoContato) {
      const diffMinutos = (agora - atendimento.ultimoContato) / 1000 / 60;
      
      if (diffMinutos >= timeoutMinutos) { 
        atendimento.ativo = false;
        atendimento.ultimoContato = null;

        const sender = chave.split('_')[1];
        // Nota: O botSock ainda usa o nome. Recomendado migrar o cache 'bots' para usar o ID.
        const botSock = bots[atendimento.nomeEmpresa]; 

        if (botSock) {
          botSock.sendMessage(sender, {
            text: '🤖 Atendimento humano encerrado por inatividade. Agora você está falando com o assistente virtual novamente.'
          }).catch(console.error);
        }
      }
    }
    

    // Resetar boas-vindas após 2h sem contato
    if (atendimento.iniciado && atendimento.ultimoContato) {
      const diffHoras = (agora - atendimento.ultimoContato) / 1000 / 60 / 60;
      if (diffHoras >= 2) {
        atendimento.iniciado = false;
        atendimento.ultimoContato = null;
        console.log(`🔄 Reset de saudação para ${chave} por inatividade de 2h.`);
      }
    }
  }
}, 60 * 1000);

module.exports = {
  iniciarBot,
  getQRCode,
  reiniciarBot,
  toggleBot,
  deletarEmpresa,
  statusBots
};