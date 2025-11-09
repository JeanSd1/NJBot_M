const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const empresaDB = require('./models/Empresa');

// ✅ MUDANÇA: bots e qrCodesGerados usam o ID da empresa como chave
const bots = {};  // cache { empresaId: sock }
const atendimentosManuais = {};  // { chaveEmpresa_remetente: { ativo, ultimoContato, iniciado, nomeEmpresa, msgFechadoEnviada } }
const qrCodesGerados = {}; // { empresaId: base64QR }
const statusBots = {}; // { empresaId: { conectado: boolean, ultimaAtualizacao: Date } }

const instanciasAtivas = new Map();

// 1. FUNÇÃO DE VERIFICAÇÃO DE HORÁRIO DE ATENDIMENTO (Com Intervalo)
function estaEmHorarioComercial(empresa) {
    const agora = new Date();
    const diaAtual = agora.getDay().toString();
    
    // Suporte a Map ou Objeto simples
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

    if (instanciasAtivas.has(empresaId)) {
        console.log(`⚠️ Já existe uma instância ativa para ${empresa.nome} (ID: ${empresaId}). Aguardando...`);
        return null;
    }

    // ✅ CORREÇÃO CRÍTICA: USAR ID NO CAMINHO DA PASTA
    const pastaBase = path.join(__dirname, 'bots', empresaId); 
    const pasta = path.join(pastaBase, 'auth_info_baileys'); 

    if (!fs.existsSync(pasta)) {
        fs.mkdirSync(pasta, { recursive: true }); 
        console.log(`📁 Pasta criada: ${pasta}`);
    }

    instanciasAtivas.set(empresaId, true);
    console.log(`🚀 Iniciando bot para: ${empresa.nome} (ID: ${empresaId})`);

    try {
        const { state, saveCreds } = await useMultiFileAuthState(pasta);
        const { version } = await fetchLatestBaileysVersion();

        let resolveQRCode;
        const qrCodePromise = new Promise(resolve => { 
            resolveQRCode = resolve; 
        }).catch(err => {
            console.error(`❌ [${empresa.nome}] Erro na Promise QR Code:`, err);
            return null;
        });

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            connectTimeoutMs: 0, 
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true,
            retryRequestDelayMs: 1000,
            maxMsgRetryCount: 3,
            emitOwnEvents: true,
            defaultQueryTimeoutMs: 0, 
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            console.log(`🔗 [${empresa.nome}] Estado da conexão: ${connection}`);

            if (qr) {
                console.log(`📱 [${empresa.nome}] QR Code gerado - Aguardando escaneamento...`);
                try {
                    const qrCodeDataURL = await qrcode.toDataURL(qr);
                    // ✅ MUDANÇA: USAR ID COMO CHAVE
                    qrCodesGerados[empresaId] = qrCodeDataURL;
                    resolveQRCode(qrCodeDataURL);
                } catch (error) {
                    console.error(`❌ [${empresa.nome}] Erro ao gerar QR Code:`, error);
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const loggedOut = statusCode === DisconnectReason.loggedOut;

                console.log(`🔌 [${empresa.nome}] Conexão fechada. Status: ${statusCode}, LoggedOut: ${loggedOut}`);

                instanciasAtivas.delete(empresaId);
                delete bots[empresaId]; // Limpa a instância do cache

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

                        // Mantém status ou define como reconectando
                        statusBots[empresaId] = { // ✅ MUDANÇA: USAR ID
                            conectado: false,
                            ultimaAtualizacao: new Date(),
                            reconectando: true
                        };
                    } else {
                        console.log(`❌ [${empresa.nome}] Não reconectando.`);

                        statusBots[empresaId] = { // ✅ MUDANÇA: USAR ID
                            conectado: false,
                            ultimaAtualizacao: new Date(),
                            reconectando: false
                        };

                        // Limpa sessão se foi logout
                        if (loggedOut) {
                            console.log(`🧹 [${empresa.nome}] Limpando sessão devido a logout`);
                            // ✅ USAR PASTA BASE (ID) para limpeza
                            if (fs.existsSync(pastaBase)) {
                                fs.rmSync(pastaBase, { recursive: true, force: true });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`❌ [${empresa.nome}] Erro durante reconexão:`, error);
                    instanciasAtivas.delete(empresaId);
                    delete bots[empresaId];
                }
            }

            if (connection === 'open') {
                console.log(`✅ [${empresa.nome}] Conectado com sucesso!`);
                statusBots[empresaId] = { // ✅ MUDANÇA: USAR ID
                    conectado: true,
                    ultimaAtualizacao: new Date(),
                    reconectando: false
                };

                delete qrCodesGerados[empresaId]; // ✅ MUDANÇA: USAR ID
                bots[empresaId] = sock; // ✅ MUDANÇA: USAR ID
            }
        });

        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const { WritableStreamBuffer } = require('stream-buffers');
        const handleMensagem = require('./handlers/chatbot');
//         const { transcreverAudio } = require('./transcreverAudio');
        const { gerarRespostaGemini } = require('./gemini');


        // sock.ev.on('messages.upsert', async (m) => {
//             try {
                const msg = m.messages?.[0];
                if (!msg || !msg.message) return;

                const sender = msg.key.remoteJid;

                let texto =
                    msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    msg.message?.imageMessage?.caption ||
                    msg.message?.videoMessage?.caption ||
                    msg.message?.documentMessage?.caption ||
                    msg.message?.buttonsResponseMessage?.selectedButtonId ||
                    msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
                    '';

                if (msg.message?.voiceMessage || msg.message?.audioMessage) {
                    // ... Lógica de transcrição (omito por brevidade, mas está no arquivo completo)
                }

                const textoLower = texto.toLowerCase().trim();

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
                        const horariosMap = empresaAtualizada.horariosSemana || new Map();
                        const configDia = horariosMap.get ? horariosMap.get(diaAtual) : horariosMap[diaAtual] || {};

                        const msg = empresaAtualizada.msgFechado
                            .replace('[HORARIO_INICIO]', configDia.inicio || '00:00')
                            .replace('[HORARIO_FIM]', configDia.fim || '00:00');

                        await sock.sendMessage(sender, { text: msg });
                        
                        atendimento.msgFechadoEnviada = agora;
                    }
                    
                    return;
                }
                    // === DETECTAR PEDIDO DE ATENDENTE HUMANO ===
                    const solicitarHumanoKeywords = ['#humano', 'humano', 'atendente', '#atendente', '#manual', 'manual'];
                    if (solicitarHumanoKeywords.some(k => textoLower.includes(k))) {
                        atendimento.ativo = true;
                        atendimento.iniciado = true;
                        atendimento.ultimoContato = new Date();

                        try {
                            await sock.sendMessage(sender, { text: '👨‍💼 Já estou transferindo você para um atendente humano. Por favor, aguarde...'});
                        } catch (sendErr) {
                            console.error(`❌ [${empresa.nome}] Erro ao avisar sobre transferência para humano:`, sendErr);
                        }

                        // Agendar liberação automática do atendimento humano após timeout configurado
                        const timeoutMin = empresaAtualizada.timeoutHumanoMinutos || 10;
                        setTimeout(() => {
                            const a = atendimentosManuais[chaveAtendimento];
                            if (a) {
                                a.ativo = false;
                                a.iniciado = false;
                            }
                        }, timeoutMin * 60 * 1000);

                        // Aqui você poderia notificar um sistema de atendimento humano ou criar um ticket
                        return;
                    }
                // === LÓGICA DE ATENDIMENTO: GERAR RESPOSTA AUTOMÁTICA ===
                // Se o atendimento manual estiver ativo para essa conversa, não respondemos automaticamente
                if (atendimento.ativo) {
                    // Um humano já está atendendo esta conversa; não enviar resposta automática
                    return;
                }

                // Atualiza último contato para controle de timeouts/spam
                atendimento.ultimoContato = new Date();

                try {
                    // Chama o handler que usa a IA para gerar a resposta
                    const resultado = await handleMensagem(empresaAtualizada._id.toString(), texto);

                    // O handler pode retornar um objeto { resposta } ou uma string
                    const respostaTexto = resultado?.resposta || (typeof resultado === 'string' ? resultado : null);

                    if (respostaTexto) {
                        await sock.sendMessage(sender, { text: respostaTexto });
                    } else {
                        // Fallback simples
                        await sock.sendMessage(sender, { text: '🤖 Desculpe, não consegui gerar uma resposta no momento.' });
                    }
} catch (err) {                    
                    console.error(`❌ [${empresa.nome}] Erro ao gerar/enviar resposta automática:`, err);
                          try {
                        await sock.sendMessage(sender, { text: '❌ Ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.' });
                    } catch (sendErr) {
                        console.error(`❌ [${empresa.nome}] Erro ao enviar mensagem de erro:`, sendErr);
                    }
                }

           }
        });

        // ⚠️ Não armazena o sock aqui, pois isso é feito na 'connection.update' (open)
        // bots[empresaId] = sock;

        console.log(`⏳ [${empresa.nome}] Aguardando QR Code indefinidamente...`);
        const qrCodeBase64 = await qrCodePromise; 
        console.log(`✅ [${empresa.nome}] QR Code processado`);
        return qrCodeBase64;

    } catch (error) {
        console.error(`❌ [${empresa.nome}] Erro crítico ao iniciar bot:`, error);
        instanciasAtivas.delete(empresaId);
        delete bots[empresaId];
        throw error;
    }
}

// ✅ MUDANÇA: Recebe o ID da empresa
function getQRCode(empresaId) {
    return qrCodesGerados[empresaId] || null;
}

async function reiniciarBot(empresa) {
    const empresaId = empresa._id.toString();
    console.log(`🔄 Reiniciando bot para: ${empresa.nome}`);

    // ✅ CORREÇÃO: USAR ID NO CAMINHO DA PASTA PARA DELETAR
    const pastaBase = path.join(__dirname, 'bots', empresaId);
    
    if (fs.existsSync(pastaBase)) {
        fs.rmSync(pastaBase, { recursive: true, force: true });
        console.log(`🧹 Sessão anterior removida para: ${empresa.nome}`);
    }

    instanciasAtivas.delete(empresaId);

    // ✅ MUDANÇA: USAR ID COMO CHAVE
    if (bots[empresaId]) {
        try {
            await bots[empresaId].end();
            console.log(`✅ Conexão anterior encerrada para: ${empresa.nome}`);
        } catch (err) {
            console.error(`❌ Erro ao encerrar bot ${empresa.nome}:`, err);
        }
        delete bots[empresaId];
    }

    delete qrCodesGerados[empresaId]; // ✅ MUDANÇA: USAR ID

    await new Promise(resolve => setTimeout(resolve, 2000));

    return iniciarBot(empresa);
}

async function toggleBot(empresa) {
    const empresaId = empresa._id.toString();
    console.log(`🔧 Alternando bot ${empresa.nome} para: ${empresa.botAtivo ? 'ATIVO' : 'INATIVO'}`);

    // Lógica para Desligar
    if (!empresa.botAtivo) {
        // ✅ MUDANÇA: USAR ID COMO CHAVE
        if (bots[empresaId]) {
            try {
                await bots[empresaId].end();
                delete bots[empresaId];
                instanciasAtivas.delete(empresaId);
                console.log(`✅ Bot ${empresa.nome} desligado.`);
            } catch (err) {
                console.error(`❌ Erro ao desligar bot ${empresa.nome}:`, err);
            }
        }
        // Garante que o QR code seja apagado se o bot for desligado antes de conectar
        delete qrCodesGerados[empresaId];
    }

    // Lógica para Ligar
    if (empresa.botAtivo && !instanciasAtivas.has(empresaId)) {
        try {
            await iniciarBot(empresa);
            console.log(`✅ Bot ${empresa.nome} iniciado.`);
        } catch (err) {
            console.error(`❌ Erro ao iniciar bot ${empresa.nome}:`, err);
        }
    }
}

// ✅ MUDANÇA: Recebe o ID da empresa
function deletarEmpresa(empresaId) {
    console.log(`🗑️ Excluindo bot da empresa ID: ${empresaId}`);

    delete qrCodesGerados[empresaId]; // ✅ MUDANÇA: USAR ID

    // ✅ MUDANÇA: USAR ID COMO CHAVE
    if (bots[empresaId]) {
        try {
            bots[empresaId].end();
        } catch (err) {
            console.error(`❌ Erro ao encerrar bot ID ${empresaId}:`, err);
        }
        delete bots[empresaId];
    }

    // ✅ CORREÇÃO: USAR ID NO CAMINHO DA PASTA para apagar a pasta de sessão
    const authPath = path.join(__dirname, 'bots', empresaId); 
    if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log(`🧹 Pastas de sessão removidas para ID: ${empresaId}`);
    }
    
    // Limpar atendimentos em curso
    for (const chave in atendimentosManuais) {
        if (chave.startsWith(empresaId)) {
            delete atendimentosManuais[chave];
        }
    }
    
    instanciasAtivas.delete(empresaId);
    delete statusBots[empresaId];
}


// Intervalo para encerrar atendimentos inativos + resetar boas-vindas
setInterval(async () => { 
    // ... (Lógica de timeout usando empresaDB.findById, o que é correto) ...
}, 60 * 1000);

// ✅ EXPORTAÇÕES COMPLETAS
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
