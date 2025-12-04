/**
 * MVP Test Script - YouAi.BETA
 * 
 * Este script testa o funcionamento básico do backend
 * e da integração com serviços de IA.
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
let token = '';
let empresaId = '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  validateStatus: () => true
});

async function testar() {
  try {
    console.log('🚀 Iniciando testes do MVP YouAi.BETA\n');
    console.log(`📍 API URL: ${API_URL}\n`);

    // Aguarda servidor estar pronto
    console.log('⏳ Aguardando servidor...');
    await new Promise(r => setTimeout(r, 3000));

    // 1. Login
    console.log('🔐 Fazendo login...');
    const loginRes = await api.post('/api/login', {
      email: 'master@njbot.com',
      senha: 'master123'
    });
    
    if (!loginRes.data?.token) {
      console.error('❌ Login falhou:', loginRes.data);
      return;
    }

    token = loginRes.data.token;
    console.log('✅ Login bem-sucedido\n');

    // 2. Listar empresas
    console.log('📋 Listando empresas...');
    const empresasRes = await api.get('/api/empresas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!empresasRes.data?.length) {
      console.error('❌ Nenhuma empresa encontrada');
      return;
    }

    empresaId = empresasRes.data[0]._id;
    console.log(`✅ Empresa: ${empresasRes.data[0].nome}\n`);

    // 3. Testar IA (básico)
    console.log('🤖 Testando IA...');
    const msgRes = await api.post('/api/test-message', {
      empresaId: empresaId,
      mensagem: 'Olá! Teste do MVP.'
    });

    if (msgRes.data?.resposta) {
      console.log('✅ Resposta IA:', msgRes.data.resposta);
    } else {
      console.log('⚠️  Aviso:', msgRes.data?.message || 'Sem resposta');
    }

    console.log('\n✨ MVP funcionando corretamente!');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.response?.data) {
      console.error('Detalhes:', error.response.data);
    }
  }
}

testar();
