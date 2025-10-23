// const fs = require('fs');
// const path = require('path');
// const qrcode = require('qrcode');
// const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
// const empresaDB = require('./models/Empresa');

// const bots = {};  // cache { nomeEmpresa: sock }
// // ATUALIZAÇÃO: Adiciona msgFechadoEnviada para controle de spam no horário fechado
// const atendimentosManuais = {};  // { chaveEmpresa_remetente: { ativo, ultimoContato, iniciado, nomeEmpresa, msgFechadoEnviada } }
// const qrCodesGerados = {}; // { nomeEmpresa: base64QR }
// const statusBots = {}; // { nomeEmpresa: { conectado: boolean, ultimaAtualizacao: Date } }


// function estaEmHorarioComercial(empresa) {
//     const agora = new Date();
//     const diaAtual = agora.getDay().toString();
    
//     const horariosMap = empresa.horariosSemana || new Map();
//     // Acessa as configurações do dia
//     const configDia = horariosMap.get ? horariosMap.get(diaAtual) : horariosMap[diaAtual]; 
    
//     // 1. Checagem de Dia Ativo (Permanente)
//     if (!configDia || !configDia.ativo) {
//         return false; 
//     }

//     // 2. Conversão para Minutos (para facilitar a comparação)
//     const horaAtual = agora.getHours();
//     const minutoAtual = agora.getMinutes();
//     const minutosAgora = horaAtual * 60 + minutoAtual;
    
//     // Turno da Manhã (Início Principal até Início do Intervalo)
//     const [hInicio, mInicio] = (configDia.inicio || '09:00').split(':').map(Number);
//     const [hIntervaloInicio, mIntervaloInicio] = (configDia.intervaloInicio || '12:00').split(':').map(Number);
    
//     const minutosInicio = hInicio * 60 + mInicio;
//     const minutosIntervaloInicio = hIntervaloInicio * 60 + mIntervaloInicio;

//     // Turno da Tarde (Fim do Intervalo até Fim Principal)
//     const [hIntervaloFim, mIntervaloFim] = (configDia.intervaloFim || '13:00').split(':').map(Number);
//     const [hFim, mFim] = (configDia.fim || '18:00').split(':').map(Number);
    
//     const minutosIntervaloFim = hIntervaloFim * 60 + mIntervaloFim;
//     const minutosFim = hFim * 60 + mFim;


//     // 3. Lógica de Verificação de Horário
    
//     // Verifica se está no Turno 1 (Manhã)
//     const estaNoTurnoManha = (
//         minutosAgora >= minutosInicio &&
//         minutosAgora < minutosIntervaloInicio
//     );
    
//     // Verifica se está no Turno 2 (Tarde)
//     const estaNoTurnoTarde = (
//         minutosAgora >= minutosIntervaloFim &&
//         minutosAgora < minutosFim
//     );

//     // O bot está ativo se estiver no Turno 1 OU no Turno 2
//     return estaNoTurnoManha || estaNoTurnoTarde;
// }


// async function iniciarBot(empresa) {
//   const pasta = path.join(__dirname, 'bots', empresa.nome, 'auth_info_baileys');
//   if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });

//     const { state, saveCreds } = await useMultiFileAuthState(pasta);
//     const sock = makeWASocket({ auth: state });

//     let resolveQRCode;
//     const qrCodePromise = new Promise(resolve => { resolveQRCode = resolve; });

//     sock.ev.on('creds.update', saveCreds);

//     sock.ev.on('connection.update', async (update) => {
//         const { connection, lastDisconnect, qr } = update;

//         if (qr) {
//             qrCodesGerados[empresa.nome] = await qrcode.toDataURL(qr);
//             resolveQRCode(qr);
//         }

//         if (connection === 'close') {
//             const statusCode = lastDisconnect?.error?.output?.statusCode;
//             const loggedOut = statusCode === DisconnectReason.loggedOut;
//             const empresaAtualizada = await empresaDB.findById(empresa._id);

//             // Limpa o QR Code do cache caso a conexão caia
//             if (qrCodesGerados[empresa.nome]) {
//                 delete qrCodesGerados[empresa.nome];
//             }

//             if (!loggedOut && empresaAtualizada?.botAtivo) {
//                 console.log(`[RECONNECT] Reconectando bot de ${empresaAtualizada.nome}...`);
//                 iniciarBot(empresaAtualizada);

//                 // O status permanece o último conhecido até reconectar (ESTABILIDADE)
//             } else {
//                 console.log(`[RECONNECT] Não reconectando: loggedOut=${loggedOut}, botAtivo=${empresaAtualizada?.botAtivo}`);

//                 // Se realmente foi logout, aí sim marca como desconectado permanente
//                 statusBots[empresa._id] = { conectado: false, ultimaAtualizacao: new Date() };
//             }
//         }

//         if (connection === 'open') {
//             statusBots[empresa._id] = { conectado: true, ultimaAtualizacao: new Date() };
//             console.log(`🤖 Conectado com sucesso: ${empresa.nome}`);

//             // Limpa o QR Code do cache quando a conexão é estabelecida
//             if (qrCodesGerados[empresa.nome]) {
//                 delete qrCodesGerados[empresa.nome];
//                 console.log(`[QR CODE] QR Code de ${empresa.nome} limpo após conexão.`);
//             }
//         }
//     });

//   const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
//   const { WritableStreamBuffer } = require('stream-buffers');
//   const handleMensagem = require('./handlers/chatbot');
//   const { transcreverAudio } = require('./transcreverAudio');

//   sock.ev.on('messages.upsert', async (m) => {
//     try {
//       const msg = m.messages?.[0];
//       if (!msg || !msg.message) return;

//       const sender = msg.key.remoteJid;

//       // Extrai texto das mensagens (lógica existente)
//       let texto =
//         msg.message?.conversation ||
//         msg.message?.extendedTextMessage?.text ||
//         msg.message?.imageMessage?.caption ||
//         msg.message?.videoMessage?.caption ||
//         msg.message?.documentMessage?.caption ||
//         msg.message?.buttonsResponseMessage?.selectedButtonId ||
//         msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
//         '';

//       // Tratamento de áudio (voz) (lógica existente)
//       if (msg.message?.voiceMessage || msg.message?.audioMessage) {
//         const type = msg.message.voiceMessage ? 'voiceMessage' : 'audioMessage';
//         const stream = await downloadContentFromMessage(msg.message[type], type.replace('Message', ''));

//         const bufferStream = new WritableStreamBuffer();
//         for await (const chunk of stream) {
//           bufferStream.write(chunk);
//         }
//         bufferStream.end();

//         const audioBuffer = bufferStream.getContents();
//         if (audioBuffer) {
//           texto = await transcreverAudio(audioBuffer);
//         }
//       }

//       const textoLower = texto.toLowerCase().trim();

//       // Lista de comandos que podem ser usados mesmo se vierem de fromMe (lógica existente)
//       const comandosPermitidosMesmoFromMe = [
//         '#bot', '#sair', '#encerrar', 'bot',
//         '#humano', '#atendente', '#manual'
//       ];

//       if (msg.key.fromMe && !comandosPermitidosMesmoFromMe.some(c => textoLower.includes(c))) {
//         return;
//       }

//       const empresaAtualizada = await empresaDB.findById(empresa._id);
//       if (!empresaAtualizada?.botAtivo) return;

//       const chaveAtendimento = `${empresaAtualizada._id}_${sender}`;
//       if (!atendimentosManuais[chaveAtendimento]) {
//         atendimentosManuais[chaveAtendimento] = {
//           ativo: false,
//           ultimoContato: null,
//           iniciado: false,
//           nomeEmpresa: empresaAtualizada.nome,
//           msgFechadoEnviada: null // NOVO CAMPO DE CONTROLE
//         };
//       }
      
//       const atendimento = atendimentosManuais[chaveAtendimento]; // Referência para facilitar

//       // >>> 2. LÓGICA DE HORÁRIO DE ATENDIMENTO COM CONTROLE DE SPAM <<<
//       if (!estaEmHorarioComercial(empresaAtualizada)) {
//           const agora = new Date();
//           const minutosDesdeUltimoFechado = atendimento.msgFechadoEnviada 
//               ? (agora - atendimento.msgFechadoEnviada) / 1000 / 60 
//               : Infinity;
          
//           const TOLERANCIA_MINUTOS = 20; // Reenvia a cada 20 minutos (padrão)

//           if (minutosDesdeUltimoFechado > TOLERANCIA_MINUTOS) {
//               const diaAtual = agora.getDay().toString();
//               const configDia = empresaAtualizada.horariosSemana?.get(diaAtual) || {};

//               // Monta a mensagem de fechado, usando os placeholders
//               const msg = empresaAtualizada.msgFechado
//                   .replace('[HORARIO_INICIO]', configDia.inicio || '00:00')
//                   .replace('[HORARIO_FIM]', configDia.fim || '00:00');

//               await sock.sendMessage(sender, { text: msg });
              
//               // Registra o envio para evitar spam
//               atendimento.msgFechadoEnviada = agora;
//           }
          
//           return; // Sai da função, ignorando o resto do processamento da mensagem
//       }
//       // >>> FIM DA LÓGICA DE HORÁRIO <<<


//       const saudacoes = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite'];
//       const comandosEspeciais = ['#sair', '#bot', 'bot'];

//       // Comandos especiais (lógica existente)
//       if (comandosEspeciais.includes(textoLower)) {
//         if (textoLower === '#sair') {
//           delete atendimentosManuais[chaveAtendimento];
//           await sock.sendMessage(sender, { text: '✅ Conversa reiniciada. Digite "oi" para começar.' });
//           return;
//         }
//         if (textoLower === '#bot' || textoLower === 'bot') {
//           atendimentosManuais[chaveAtendimento] = { ativo: false, iniciado: false, nomeEmpresa: empresaAtualizada.nome };
//           await sock.sendMessage(sender, { text: '🤖 Atendimento automático ativado.' });
//           return;
//         }
//       }

//       // >>> 3. LÓGICA DE ATENDIMENTO HUMANO CORRIGIDA (com feedback para o atendente) <<<
//       const palavrasChaveAtendente = [
//         'atendente', 'humano', 'pessoa', 'falar com atendente', 'falar com humano',
//         'quero atendimento humano', 'quero falar com alguém', 'ajuda de um atendente',
//         'quero um atendente', 'preciso de ajuda humana',
//         '#humano', '#atendente', '#manual'
//       ];

//       if (palavrasChaveAtendente.some(p => textoLower.includes(p))) {
//         atendimento.ativo = true;
//         atendimento.ultimoContato = new Date();

//         if (msg.key.fromMe) {
//             // Se for o PRÓPRIO ATENDENTE ativando (feedback para ele mesmo)
//             await sock.sendMessage(sender, { text: '👤 Você está no modo Atendimento Humano. O bot foi desativado para este chat.' });
//         } else {
//             // Se for o CLIENTE (mensagem de espera)
//             await sock.sendMessage(sender, { text: '📨 Solicitação enviada ao atendente humano. Aguarde um momento.' });
//         }
//         return;
//       }
      
//       // Se atendimento humano ativo, apenas atualiza último contato (lógica existente)
//       if (atendimento.ativo) {
//         atendimento.ultimoContato = new Date();
//         console.log(`👤 Atendimento humano ativo para: ${sender}`);
//         return;
//       }
//       // >>> FIM DA LÓGICA DE ATENDIMENTO HUMANO CORRIGIDA <<<

//       // Saudação inicial (lógica existente, usando campo msgBoasVindas)
//       if (saudacoes.includes(textoLower) && !atendimento.iniciado) {
//       atendimento.iniciado = true;
//       atendimento.ultimoContato = new Date();

//       // 1. Define o texto de saudação: usa o campo do DB ou um fallback
//       const textoSaudacao = empresaAtualizada.msgBoasVindas || 
//       `Olá! 👋 Bem-vindo(a) à ${empresaAtualizada.nome}! Como posso te ajudar?`;

//       // 2. Garante que se o placeholder [Nome da Empresa] for usado no DB, ele seja substituído
//       const saudacaoFinal = textoSaudacao.replace('[Nome da Empresa]', empresaAtualizada.nome);

//       // 3. O sock.sendMessage permanece, enviando o texto dinâmico.
//       await sock.sendMessage(sender, {
//           text: saudacaoFinal 
//       });
//       return;
//       }

//       // Atualiza último contato
//       atendimento.ultimoContato = new Date();

//       // Atualiza presença (lógica existente)
//       await sock.sendPresenceUpdate('composing', sender);

//       // Integração com Gemini (IA) (lógica existente)
//       const { gerarRespostaGemini } = require('./gemini');
//       const respostaTexto = await gerarRespostaGemini(empresaAtualizada.promptIA, texto);
//       await sock.sendMessage(sender, { text: respostaTexto });

//     } catch (err) {
//       console.error('❌ Erro no processamento da mensagem:', err);
//     }
//   });

//   bots[empresa.nome] = sock;
//   const qrCodeBase64 = await qrCodePromise.then(qr => qrcode.toDataURL(qr));
//   return qrCodeBase64;
// }

// function getQRCode(nomeEmpresa) {
//   return qrCodesGerados[nomeEmpresa] || null;
// }

// async function reiniciarBot(empresa) {
//   const authPath = path.join(__dirname, 'bots', empresa.nome, 'auth_info_baileys');
//   if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });

//   if (bots[empresa.nome]) {
//     try {
//       if (bots[empresa.nome].end) {
//         await bots[empresa.nome].end();
//       } else if (bots[empresa.nome].logout) {
//         await bots[empresa.nome].logout();
//       }
//     } catch (err) {
//       console.error(`Erro ao encerrar bot ${empresa.nome} antes de reiniciar:`, err);
//     }
//     delete bots[empresa.nome];
//   }

//   return iniciarBot(empresa);
// }

// async function toggleBot(empresa) {
//   if (!empresa.botAtivo && bots[empresa.nome]) {
//     try {
//       if (bots[empresa.nome].end) {
//         await bots[empresa.nome].end();
//       } else if (bots[empresa.nome].logout) {
//         await bots[empresa.nome].logout();
//       }
//       delete bots[empresa.nome];
//       console.log(`[TOGGLE] Bot de ${empresa.nome} desligado.`);
//     } catch (err) {
//       console.error(`[TOGGLE] Erro ao desligar bot de ${empresa.nome}:`, err);
//     }
//   }

//   if (empresa.botAtivo && !bots[empresa.nome]) {
//     try {
//       await iniciarBot(empresa);
//       console.log(`[TOGGLE] Bot de ${empresa.nome} iniciado.`);
//     } catch (err) {
//       console.error(`[TOGGLE] Erro ao iniciar bot de ${empresa.nome}:`, err);
//     }
//   }
// }

// function deletarEmpresa(nomeEmpresa) {
//   delete qrCodesGerados[nomeEmpresa];

//   if (bots[nomeEmpresa]) {
//     try {
//       bots[nomeEmpresa].end ? bots[nomeEmpresa].end() : bots[nomeEmpresa].logout();
//     } catch (err) {
//       console.error(`Erro ao encerrar bot ${nomeEmpresa} durante exclusão:`, err);
//     }
//     delete bots[nomeEmpresa];
//   }
// }

// // Intervalo para encerrar atendimentos inativos + resetar boas-vindas
// setInterval(async () => { 
//   const agora = new Date();

//   for (const chave in atendimentosManuais) {
//     const atendimento = atendimentosManuais[chave];

//     // Extrai o ID da empresa da chave (formato: ID_remetente)
//     const idEmpresa = chave.split('_')[0]; 

//     // Busca as configurações atuais da empresa
//     const empresaConfig = await empresaDB.findById(idEmpresa);

//     // Define o timeout: usa o valor do DB, com 10 minutos como fallback seguro
//     const timeoutMinutos = empresaConfig?.timeoutHumanoMinutos || 10;
//     
//     // Encerrar atendimento humano após timeout customizado
//     if (atendimento.ativo && atendimento.ultimoContato) {
//       const diffMinutos = (agora - atendimento.ultimoContato) / 1000 / 60;
//       
//       if (diffMinutos >= timeoutMinutos) { 
//         atendimento.ativo = false;
//         atendimento.ultimoContato = null;

//         const sender = chave.split('_')[1];
//         // Nota: O botSock ainda usa o nome. Recomendado migrar o cache 'bots' para usar o ID.
//         const botSock = bots[atendimento.nomeEmpresa]; 

//         if (botSock) {
//           botSock.sendMessage(sender, {
//             text: '🤖 Atendimento humano encerrado por inatividade. Agora você está falando com o assistente virtual novamente.'
//           }).catch(console.error);
//         }
//       }
//     }
//     

//     // Resetar boas-vindas após 2h sem contato
//     if (atendimento.iniciado && atendimento.ultimoContato) {
//       const diffHoras = (agora - atendimento.ultimoContato) / 1000 / 60 / 60;
//       if (diffHoras >= 2) {
//         atendimento.iniciado = false;
//         atendimento.ultimoContato = null;
//         console.log(`🔄 Reset de saudação para ${chave} por inatividade de 2h.`);
//       }
//     }
//   }
// }, 60 * 1000);

// module.exports = {
//   iniciarBot,
//   getQRCode,
//   reiniciarBot,
//   toggleBot,
//   deletarEmpresa,
//   statusBots
// };

const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const empresaDB = require('./models/Empresa');

const bots = {};  // cache { nomeEmpresa: sock }
const atendimentosManuais = {};  // { chaveEmpresa_remetente: { ativo, ultimoContato, iniciado, nomeEmpresa, msgFechadoEnviada } }
const qrCodesGerados = {}; // { nomeEmpresa: base64QR }
const statusBots = {}; // { nomeEmpresa: { conectado: boolean, ultimaAtualizacao: Date } }

// ✅ CONTROLE DE INSTÂNCIAS PARA EVITAR DUPLICAÇÃO
const instanciasAtivas = new Map();

function estaEmHorarioComercial(empresa) {
    const agora = new Date();
    const diaAtual = agora.getDay().toString();
    
    const horariosMap = empresa.horariosSemana || new Map();
    const configDia = horariosMap.get ? horariosMap.get(diaAtual) : horariosMap[diaAtual]; 
    
    if (!configDia || !configDia.ativo) {
        return false; 
    }

    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    const minutosAgora = horaAtual * 60 + minutoAtual;
    
    const [hInicio, mInicio] = (configDia.inicio || '09:00').split(':').map(Number);
    const [hIntervaloInicio, mIntervaloInicio] = (configDia.intervaloInicio || '12:00').split(':').map(Number);
    
    const minutosInicio = hInicio * 60 + mInicio;
    const minutosIntervaloInicio = hIntervaloInicio * 60 + mIntervaloInicio;

    const [hIntervaloFim, mIntervaloFim] = (configDia.intervaloFim || '13:00').split(':').map(Number);
    const [hFim, mFim] = (configDia.fim || '18:00').split(':').map(Number);
    
    const minutosIntervaloFim = hIntervaloFim * 60 + mIntervaloFim;
    const minutosFim = hFim * 60 + mFim;

    const estaNoTurnoManha = (
        minutosAgora >= minutosInicio &&
        minutosAgora < minutosIntervaloInicio
    );
    
    const estaNoTurnoTarde = (
        minutosAgora >= minutosIntervaloFim &&
        minutosAgora < minutosFim
    );

    return estaNoTurnoManha || estaNoTurnoTarde;
}

async function iniciarBot(empresa) {
    const empresaId = empresa._id.toString();

    // ✅ VERIFICA SE JÁ EXISTE UMA INSTÂNCIA ATIVA
    if (instanciasAtivas.has(empresaId)) {
        console.log(`⚠️ Já existe uma instância ativa para ${empresa.nome}. Aguardando...`);
        return null;
    }

    // ✅ MARCA INSTÂNCIA COMO ATIVA
    instanciasAtivas.set(empresaId, true);
    console.log(`🚀 Iniciando bot para: ${empresa.nome} (ID: ${empresaId})`);

    const pasta = path.join(__dirname, 'bots', empresa.nome, 'auth_info_baileys');
    if (!fs.existsSync(pasta)) {
        fs.mkdirSync(pasta, { recursive: true });
        console.log(`📁 Pasta criada: ${pasta}`);
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState(pasta);
        const { version } = await fetchLatestBaileysVersion();

        let resolveQRCode;
        const qrCodePromise = new Promise(resolve => { 
            resolveQRCode = resolve; 
        });

        // ✅ CONFIGURAÇÃO MELHORADA DO SOCKET
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            connectTimeoutMs: 0, // ✅ SEM TIMEOUT DE CONEXÃO
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true,
            retryRequestDelayMs: 1000,
            maxMsgRetryCount: 3,
            emitOwnEvents: true,
            defaultQueryTimeoutMs: 0, // ✅ SEM TIMEOUT PARA QUERIES
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            console.log(`🔗 [${empresa.nome}] Estado da conexão: ${connection}`);

            if (qr) {
                console.log(`📱 [${empresa.nome}] QR Code gerado - Aguardando escaneamento...`);
                try {
                    const qrCodeDataURL = await qrcode.toDataURL(qr);
                    qrCodesGerados[empresa.nome] = qrCodeDataURL;
                    resolveQRCode(qrCodeDataURL);
                } catch (error) {
                    console.error(`❌ [${empresa.nome}] Erro ao gerar QR Code:`, error);
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const loggedOut = statusCode === DisconnectReason.loggedOut;

                console.log(`🔌 [${empresa.nome}] Conexão fechada. Status: ${statusCode}, LoggedOut: ${loggedOut}`);

                // ✅ LIMPA INSTÂNCIA ATIVA
                instanciasAtivas.delete(empresaId);

                try {
                    const empresaAtualizada = await empresaDB.findById(empresa._id);

                    if (!loggedOut && empresaAtualizada?.botAtivo) {
                        console.log(`🔄 [${empresa.nome}] Tentando reconexão em 10 segundos...`);
                        setTimeout(() => {
                            if (empresaAtualizada?.botAtivo && !instanciasAtivas.has(empresaId)) {
                                console.log(`🔄 [${empresa.nome}] Iniciando reconexão...`);
                                iniciarBot(empresaAtualizada);
                            }
                        }, 10000);

                        statusBots[empresa._id] = {
                            conectado: false,
                            ultimaAtualizacao: new Date(),
                            reconectando: true
                        };
                    } else {
                        console.log(`❌ [${empresa.nome}] Não reconectando.`);

                        statusBots[empresa._id] = {
                            conectado: false,
                            ultimaAtualizacao: new Date(),
                            reconectando: false
                        };

                        // Limpa sessão se foi logout
                        if (loggedOut) {
                            console.log(`🧹 [${empresa.nome}] Limpando sessão devido a logout`);
                            if (fs.existsSync(pasta)) {
                                fs.rmSync(pasta, { recursive: true, force: true });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`❌ [${empresa.nome}] Erro durante reconexão:`, error);
                    instanciasAtivas.delete(empresaId);
                }
            }

            if (connection === 'open') {
                console.log(`✅ [${empresa.nome}] Conectado com sucesso!`);
                statusBots[empresa._id] = {
                    conectado: true,
                    ultimaAtualizacao: new Date(),
                    reconectando: false
                };

                // Limpa QR code após conexão bem-sucedida
                delete qrCodesGerados[empresa.nome];
            }
        });

        // ✅ MANTÉM A LÓGICA ORIGINAL DE MENSAGENS
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
                        msgFechadoEnviada: null
                    };
                }
                
                const atendimento = atendimentosManuais[chaveAtendimento];

                // >>> LÓGICA DE HORÁRIO DE ATENDIMENTO COM CONTROLE DE SPAM <<<
                if (!estaEmHorarioComercial(empresaAtualizada)) {
                    const agora = new Date();
                    const minutosDesdeUltimoFechado = atendimento.msgFechadoEnviada 
                        ? (agora - atendimento.msgFechadoEnviada) / 1000 / 60 
                        : Infinity;
                    
                    const TOLERANCIA_MINUTOS = 20;

                    if (minutosDesdeUltimoFechado > TOLERANCIA_MINUTOS) {
                        const diaAtual = agora.getDay().toString();
                        const configDia = empresaAtualizada.horariosSemana?.get(diaAtual) || {};

                        const msg = empresaAtualizada.msgFechado
                            .replace('[HORARIO_INICIO]', configDia.inicio || '00:00')
                            .replace('[HORARIO_FIM]', configDia.fim || '00:00');

                        await sock.sendMessage(sender, { text: msg });
                        
                        atendimento.msgFechadoEnviada = agora;
                    }
                    
                    return;
                }

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

                // >>> LÓGICA DE ATENDIMENTO HUMANO CORRIGIDA <<<
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
                        await sock.sendMessage(sender, { text: '👤 Você está no modo Atendimento Humano. O bot foi desativado para este chat.' });
                    } else {
                        await sock.sendMessage(sender, { text: '📨 Solicitação enviada ao atendente humano. Aguarde um momento.' });
                    }
                    return;
                }
                
                if (atendimento.ativo) {
                    atendimento.ultimoContato = new Date();
                    console.log(`👤 Atendimento humano ativo para: ${sender}`);
                    return;
                }

                // Saudação inicial (lógica existente)
                if (saudacoes.includes(textoLower) && !atendimento.iniciado) {
                    atendimento.iniciado = true;
                    atendimento.ultimoContato = new Date();

                    const textoSaudacao = empresaAtualizada.msgBoasVindas || 
                    `Olá! 👋 Bem-vindo(a) à ${empresaAtualizada.nome}! Como posso te ajudar?`;

                    const saudacaoFinal = textoSaudacao.replace('[Nome da Empresa]', empresaAtualizada.nome);

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

        // ✅ AGUARDA QR CODE INDEFINIDAMENTE - SEM TIMEOUT
        console.log(`⏳ [${empresa.nome}] Aguardando QR Code indefinidamente...`);
        const qrCodeBase64 = await qrCodePromise;
        console.log(`✅ [${empresa.nome}] QR Code processado`);
        return qrCodeBase64;

    } catch (error) {
        console.error(`❌ [${empresa.nome}] Erro crítico ao iniciar bot:`, error);
        instanciasAtivas.delete(empresaId);
        throw error;
    }
}

function getQRCode(nomeEmpresa) {
    return qrCodesGerados[nomeEmpresa] || null;
}

async function reiniciarBot(empresa) {
    const empresaId = empresa._id.toString();
    console.log(`🔄 Reiniciando bot para: ${empresa.nome}`);

    const authPath = path.join(__dirname, 'bots', empresa.nome, 'auth_info_baileys');
    if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log(`🧹 Sessão anterior removida para: ${empresa.nome}`);
    }

    instanciasAtivas.delete(empresaId);

    if (bots[empresa.nome]) {
        try {
            await bots[empresa.nome].end();
            console.log(`✅ Conexão anterior encerrada para: ${empresa.nome}`);
        } catch (err) {
            console.error(`❌ Erro ao encerrar bot ${empresa.nome}:`, err);
        }
        delete bots[empresa.nome];
    }

    delete qrCodesGerados[empresa.nome];

    await new Promise(resolve => setTimeout(resolve, 2000));

    return iniciarBot(empresa);
}

async function toggleBot(empresa) {
    const empresaId = empresa._id.toString();
    console.log(`🔧 Alternando bot ${empresa.nome} para: ${empresa.botAtivo ? 'ATIVO' : 'INATIVO'}`);

    if (!empresa.botAtivo && bots[empresa.nome]) {
        try {
            await bots[empresa.nome].end();
            delete bots[empresa.nome];
            instanciasAtivas.delete(empresaId);
            console.log(`✅ Bot ${empresa.nome} desligado.`);
        } catch (err) {
            console.error(`❌ Erro ao desligar bot ${empresa.nome}:`, err);
        }
    }

    if (empresa.botAtivo && !bots[empresa.nome]) {
        try {
            if (!instanciasAtivas.has(empresaId)) {
                await iniciarBot(empresa);
                console.log(`✅ Bot ${empresa.nome} iniciado.`);
            } else {
                console.log(`⚠️ Bot ${empresa.nome} já está em processo de inicialização.`);
            }
        } catch (err) {
            console.error(`❌ Erro ao iniciar bot ${empresa.nome}:`, err);
        }
    }
}

function deletarEmpresa(nomeEmpresa) {
    console.log(`🗑️ Excluindo bot da empresa: ${nomeEmpresa}`);

    delete qrCodesGerados[nomeEmpresa];

    if (bots[nomeEmpresa]) {
        try {
            bots[nomeEmpresa].end();
        } catch (err) {
            console.error(`❌ Erro ao encerrar bot ${nomeEmpresa}:`, err);
        }
        delete bots[nomeEmpresa];
    }

    const authPath = path.join(__dirname, 'bots', nomeEmpresa);
    if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log(`🧹 Pastas de sessão removidas para: ${nomeEmpresa}`);
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
                // Encerrar atendimento humano após timeout customizado
        if (atendimento.ativo && atendimento.ultimoContato) {
            const diffMinutos = (agora - atendimento.ultimoContato) / 1000 / 60;
            
            if (diffMinutos >= timeoutMinutos) { 
                atendimento.ativo = false;
                atendimento.ultimoContato = null;

                const sender = chave.split('_')[1];
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

// ✅ FUNÇÃO AUXILIAR PARA ENVIAR MENSAGENS MANUAIS
function enviarMensagemParaContato(nomeEmpresa, destinatario, mensagem) {
    const sock = bots[nomeEmpresa];

    if (!sock) {
        console.error(`❌ Bot não encontrado para empresa: ${nomeEmpresa}`);
        return false;
    }

    try {
        return sock.sendMessage(destinatario, {
            text: mensagem
        });
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        return false;
    }
}

// ✅ FUNÇÃO PARA VERIFICAR STATUS DE CONEXÃO
function getStatusConexao(empresaId) {
    return statusBots[empresaId] || { 
        conectado: false, 
        ultimaAtualizacao: new Date(),
        reconectando: false 
    };
}

// ✅ FUNÇÃO PARA LISTAR TODOS OS BOTS ATIVOS
function listarBotsAtivos() {
    const botsAtivos = [];
    
    for (const [nomeEmpresa, sock] of Object.entries(bots)) {
        const empresaId = Object.keys(statusBots).find(id => 
            statusBots[id] && statusBots[id].nomeEmpresa === nomeEmpresa
        );
        
        botsAtivos.push({
            nomeEmpresa,
            conectado: statusBots[empresaId]?.conectado || false,
            ultimaAtualizacao: statusBots[empresaId]?.ultimaAtualizacao || new Date(),
            reconectando: statusBots[empresaId]?.reconectando || false
        });
    }
    
    return botsAtivos;
}

// ✅ FUNÇÃO PARA LIMPAR CACHE DE EMPRESA ESPECÍFICA
function limparCacheEmpresa(nomeEmpresa) {
    // Limpa QR Code
    delete qrCodesGerados[nomeEmpresa];
    
    // Limpa status
    const empresaId = Object.keys(statusBots).find(id => 
        statusBots[id] && statusBots[id].nomeEmpresa === nomeEmpresa
    );
    if (empresaId) {
        delete statusBots[empresaId];
    }
    
    // Limpa atendimentos manuais
    for (const chave in atendimentosManuais) {
        if (chave.includes(nomeEmpresa)) {
            delete atendimentosManuais[chave];
        }
    }
    
    console.log(`🧹 Cache limpo para empresa: ${nomeEmpresa}`);
}

// ✅ INICIALIZAÇÃO AUTOMÁTICA DOS BOTS ATIVOS AO INICIAR O SERVIDOR
async function inicializarBotsAtivos() {
    try {
        console.log('🚀 Inicializando bots ativos...');
        const empresasAtivas = await empresaDB.find({ botAtivo: true });
        
        for (const empresa of empresasAtivas) {
            if (!instanciasAtivas.has(empresa._id.toString())) {
                console.log(`⏳ Iniciando bot para: ${empresa.nome}`);
                iniciarBot(empresa).catch(err => {
                    console.error(`❌ Erro ao iniciar bot ${empresa.nome}:`, err);
                });
                
                // Aguarda um pouco entre cada inicialização para evitar concorrência
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log(`✅ ${empresasAtivas.length} bots em processo de inicialização`);
    } catch (error) {
        console.error('❌ Erro na inicialização automática dos bots:', error);
    }
}

// ✅ EXPORTAÇÕES COMPLETAS
module.exports = {
    iniciarBot,
    getQRCode,
    reiniciarBot,
    toggleBot,
    deletarEmpresa,
    statusBots,
    enviarMensagemParaContato,
    getStatusConexao,
    listarBotsAtivos,
    limparCacheEmpresa,
    inicializarBotsAtivos,
    // Exporta para uso em outros módulos se necessário
    instanciasAtivas,
    bots,
    atendimentosManuais
};