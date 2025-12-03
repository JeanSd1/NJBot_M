require('dotenv').config();
const Empresa = require('../models/Empresa');
const AIService = require('../services/AIService');
const handleMensagem = require('../handlers/chatbot');

(async () => {
  try {
    // Stub do Banco de Dados: retorna uma empresa falsa
    Empresa.findById = async (id) => {
      return {
        _id: id,
        promptIA: 'Você é um assistente que responde de forma objetiva e curta.',
        iaConfig: { tipo: 'publicai', apiKey: null },
        getDecryptedApiKey: function() { return null; }
      };
    };

    // Stub do AIService para evitar chamadas externas
    AIService.generateResponse = async (provider, apiKey, prompt, clientMessage) => {
      console.log(`[TEST] AIService.generateResponse chamado com provider=${provider} apiKey=${apiKey}`);
      console.log(`[TEST] prompt: ${prompt}`);
      console.log(`[TEST] mensagem do cliente: ${clientMessage}`);
      // Simula processamento e retorna uma resposta
      return `Resposta simulada para: ${clientMessage}`;
    };

    // Executa o handler como se uma mensagem tivesse sido recebida
    const resultado = await handleMensagem('fake-company-id', 'Olá, vocês têm promoção?');
    console.log('=== Resultado do handleMensagem ===');
    console.log(resultado);
  } catch (err) {
    console.error('Erro no teste controlado:', err);
    process.exitCode = 1;
  }
})();
