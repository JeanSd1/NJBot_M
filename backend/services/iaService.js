const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
let Anthropic;
try {
    Anthropic = require('@anthropic-ai/sdk');
} catch (err) {
    // pacote pode não estar instalado em alguns ambientes; trataremos isso mais abaixo
    Anthropic = null;
    console.warn("Aviso: pacote '@anthropic-ai/sdk' não encontrado — suporte a Claude ficará desabilitado até instalar.");
}
require('dotenv').config();

// Função auxiliar para criar instância de IA com a chave correta
function createIAInstance(tipo, apiKey) {
    switch (tipo) {
        case 'gemini':
            return new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY);
        case 'gpt':
            return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
        case 'claude':
            if (!Anthropic) throw new Error("Dependência '@anthropic-ai/sdk' não instalada. Rode 'npm install @anthropic-ai/sdk' no backend para habilitar Claude.");
            return new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
        case 'publicai':
            // Configura a instância para PublicAI
            return {
                async generateContent(prompt) {
                    const axios = require('axios');
                    const API_URL = "https://router.huggingface.co/v1/chat/completions";
                    const payload = {
                        messages: [{ role: "user", content: prompt }],
                        model: "swiss-ai/Apertus-8B-Instruct-2509:publicai"
                    };
                    
                    try {
                        const response = await axios.post(API_URL, payload, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${apiKey || process.env.HUGGINGFACE_TOKEN}`
                            }
                        });
                        return { response: { text: () => response.data.choices[0].message.content } };
                    } catch (error) {
                        throw new Error(`Erro na PublicAI: ${error.message}`);
                    }
                }
            };
        default:
            throw new Error(`Tipo de IA não suportado: ${tipo}`);
    }
}

// Função para gerar resposta usando a IA específica
async function gerarResposta(empresa, perguntaUsuario) {
    const { promptIA, iaConfig } = empresa;
    const promptCompleto = `${promptIA}\nUsuário: ${perguntaUsuario}`;
    const tipo = iaConfig?.tipo || 'gemini';
    const apiKey = iaConfig?.apiKey;

    try {
        const ia = createIAInstance(tipo, apiKey);

        switch (tipo) {
            case 'gemini':
                const model = ia.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const result = await model.generateContent(promptCompleto);
                return result.response.text();

            case 'gpt':
                const completion = await ia.chat.completions.create({
                    messages: [{ role: "user", content: promptCompleto }],
                    model: "gpt-4-turbo-preview",
                });
                return completion.choices[0].message.content;

            case 'claude':
                const message = await ia.messages.create({
                    model: "claude-3-opus-20240229",
                    max_tokens: 1024,
                    messages: [{ role: "user", content: promptCompleto }],
                });
                return message.content[0].text;
        }
    } catch (err) {
        console.error(`❌ Erro na IA ${tipo}:`, err);
        return `⚠️ Erro ao gerar resposta com a IA ${tipo}.`;
    }
}

module.exports = { gerarResposta };