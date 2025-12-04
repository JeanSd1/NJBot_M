/**
 * AIService.js - Multi-provider AI service for YouBot
 * Handles routing to different AI providers (Gemini, OpenAI, OpenRouter, Claude, PublicAI)
 * Uses client-specific API keys for improved security and per-client configuration
 */

const axios = require('axios');

class AIService {
  /**
   * Route AI request to the appropriate provider based on client configuration
   * @param {String} provider - AI provider type (gemini, gpt, claude, openrouter, publicai)
   * @param {String} apiKey - Client's API key for the selected provider
   * @param {String} prompt - The prompt to send to the AI
   * @param {String} clientMessage - User message from WhatsApp
   * @returns {Promise<String>} - AI response
   */
  static async generateResponse(provider, apiKey, prompt, clientMessage) {
    if (!provider || !apiKey) {
      console.error('❌ Provider ou API key ausente:', { provider, apiKey: apiKey ? '***' : 'undefined' });
      throw new Error('Provider and API key are required');
    }

    const providerLower = provider.toLowerCase();
    console.log(`[AIService] Processando com provider: ${providerLower}`);

    try {
      switch (providerLower) {
        case 'gemini':
          console.log('[AIService] Chamando Gemini...');
          return await this.callGemini(apiKey, prompt, clientMessage);
        case 'gpt':
        case 'openai':
          console.log('[AIService] Chamando OpenAI...');
          return await this.callOpenAI(apiKey, prompt, clientMessage);
        case 'claude':
          console.log('[AIService] Chamando Claude...');
          return await this.callClaude(apiKey, prompt, clientMessage);
        case 'openrouter':
          console.log('[AIService] Chamando OpenRouter...');
          return await this.callOpenRouter(apiKey, prompt, clientMessage);
        case 'publicai':
          console.log('[AIService] Chamando PublicAI...');
          return await this.callPublicAI(prompt, clientMessage);
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`❌ Error calling ${providerLower} AI:`, error.message);
      throw error;
    }
  }

  /**
   * Call Google Gemini API
   */
  static async callGemini(apiKey, prompt, clientMessage) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const fullPrompt = `${prompt}\n\nUsuário: ${clientMessage}`;
      console.log(`[Gemini] Enviando prompt de ${fullPrompt.length} caracteres`);
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Gemini retornou texto vazio');
      }
      
      console.log(`[Gemini] ✅ Resposta recebida: ${text.substring(0, 50)}...`);
      return text;
    } catch (error) {
      console.error('❌ Gemini API error:', error.message);
      throw error;
    }
  }

  /**
   * Call OpenAI ChatGPT API
   */
  static async callOpenAI(apiKey, prompt, clientMessage) {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: clientMessage }
      ],
      max_tokens: 500
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Call Anthropic Claude API (supports multiple models including Claude Haiku 4.5)
   */
  static async callClaude(apiKey, prompt, clientMessage, model = 'claude-3-5-haiku-20241022') {
    const url = 'https://api.anthropic.com/v1/messages';
    
    const payload = {
      model: model,
      max_tokens: 500,
      system: prompt,
      messages: [
        { role: 'user', content: clientMessage }
      ]
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      });
      return response.data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Call OpenRouter API (supports multiple models)
   */
  static async callOpenRouter(apiKey, prompt, clientMessage) {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    const payload = {
      model: 'meta-llama/llama-2-70b-chat',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: clientMessage }
      ],
      max_tokens: 500
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.APP_URL || 'https://njbot.com',
          'X-Title': 'YouBot'
        }
      });
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Call Public AI (free/open source alternative)
   */
  static async callPublicAI(prompt, clientMessage) {
    const url = 'https://api-inference.huggingface.co/models/gpt2';
    
    const payload = {
      inputs: `${prompt}\n\nClient: ${clientMessage}\n\nBot:`,
      parameters: {
        max_length: 100,
        num_return_sequences: 1
      }
    };

    try {
      const response = await axios.post(url, payload);
      return response.data[0].generated_text;
    } catch (error) {
      console.error('PublicAI error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = AIService;
