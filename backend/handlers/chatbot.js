const Empresa = require('../models/Empresa');
const AIService = require('../services/AIService');

async function handleMensagem(empresaId, mensagemUsuario) {
  const empresa = await Empresa.findById(empresaId);
  if (!empresa) return { resposta: '⚠️ Empresa não encontrada.' };

  const provider = empresa.iaConfig?.tipo || 'gemini';
  // tenta obter a chave descriptografada via método do model, se existir
  const apiKey = (typeof empresa.getDecryptedApiKey === 'function') ? empresa.getDecryptedApiKey() : (empresa.iaConfig?.apiKey || null);
  const prompt = empresa.promptIA || '';

  try {
    const resposta = await AIService.generateResponse(provider, apiKey, prompt, mensagemUsuario);
    return { resposta };
  } catch (err) {
    console.error('Erro ao gerar resposta (AIService):', err);
    return { resposta: '⚠️ Erro ao gerar resposta com a IA.' };
  }
}

module.exports = handleMensagem;
