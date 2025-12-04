const Empresa = require('../models/Empresa');
const AIService = require('../services/AIService');

async function handleMensagem(empresaId, mensagemUsuario) {
  try {
    // Converte para string se for ObjectId
    const empresaIdString = empresaId.toString ? empresaId.toString() : empresaId;
    
    const empresa = await Empresa.findById(empresaIdString);
    if (!empresa) {
      console.error(`❌ Empresa não encontrada: ${empresaIdString}`);
      return { resposta: '⚠️ Empresa não encontrada.' };
    }

    console.log(`[IA] Processando mensagem para ${empresa.nome}`);
    console.log(`[IA] iaConfig:`, empresa.iaConfig);

    // Validação: verifica se a IA está configurada
    if (!empresa.iaConfig || !empresa.iaConfig.tipo || !empresa.iaConfig.apiKey) {
      console.warn(`❌ Empresa ${empresaIdString} sem configuração de IA completa.`);
      return { resposta: '⚠️ IA não configurada para esta empresa. Por favor, configure uma chave de API.' };
    }

    const provider = empresa.iaConfig.tipo.toLowerCase();
    const apiKey = empresa.iaConfig.apiKey;
    const prompt = empresa.promptIA || 'Você é um assistente útil.';

    console.log(`[IA] Provider: ${provider}, Prompt length: ${prompt.length}`);

    const resposta = await AIService.generateResponse(provider, apiKey, prompt, mensagemUsuario);
    
    if (!resposta) {
      console.warn('⚠️ IA retornou resposta vazia');
      return { resposta: '⚠️ Desculpe, não consegui gerar uma resposta. Tente novamente.' };
    }

    console.log(`✅ Resposta gerada: ${resposta.substring(0, 50)}...`);
    return { resposta };
  } catch (err) {
    console.error(`❌ Erro ao gerar resposta:`, err);
    console.error(`Stack: ${err.stack}`);
    return { resposta: '⚠️ Erro ao gerar resposta com a IA. Verifique suas credenciais.' };
  }
}

module.exports = handleMensagem;
