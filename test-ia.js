const axios = require('axios');

const API_URL = 'http://localhost:3000';
let token = '';
let empresaId = '';

// Cria uma instância axios com timeout maior
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,  // 30 segundos de timeout
  validateStatus: () => true  // Não lança erro em qualquer status HTTP
});

async function testar() {
  try {
    // Aguarda um pouco para o servidor estar pronto
    console.log('⏳ Aguardando servidor...');
    await new Promise(r => setTimeout(r, 3000));

    // 1. Login
    console.log('🔐 Fazendo login...');
    const loginRes = await api.post('/api/login', {
      email: 'master@njbot.com',
      senha: 'master123'
    });
    
    if (!loginRes.data || !loginRes.data.token) {
      console.error('❌ Login falhou:', loginRes.data);
      return;
    }

    token = loginRes.data.token;
    console.log('✅ Login bem-sucedido');

    // 2. Listar empresas
    console.log('\n📋 Listando empresas...');
    const empresasRes = await api.get('/api/empresas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!empresasRes.data || empresasRes.data.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
      console.log('Resposta:', empresasRes.data);
      return;
    }

    empresaId = empresasRes.data[0]._id;
    console.log(`✅ Empresa encontrada: ${empresasRes.data[0].nome} (${empresaId})`);
    console.log(`   iaConfig:`, empresasRes.data[0].iaConfig);

    // 3. Configurar IA (Gemini com chave de teste)
    console.log('\n⚙️  Configurando IA...');
    const configRes = await api.post(
      `/api/empresas/${empresaId}/configurar-ia`,
      {
        tipo: 'gemini',
        apiKey: process.env.GEMINI_API_KEY || 'AIzaSyDx-hNaPJmVEQLLXMu0p0VqALQjQz1iLdk',  // Chave de teste
        modelo: 'gemini-pro'
      },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (!configRes.data || !configRes.data.message) {
      console.error('❌ Configuração falhou:', configRes.data);
      return;
    }

    console.log('✅ IA configurada:', configRes.data.message);

    // 4. Testar mensagem
    console.log('\n💬 Testando mensagem...');
    const msgRes = await api.post('/api/test-message', {
      empresaId: empresaId,
      mensagem: 'Olá! Como você está?'
    });

    if (!msgRes.data) {
      console.error('❌ Erro ao processar mensagem:', msgRes.statusText);
      return;
    }

    console.log('✅ Resposta:', msgRes.data.resposta);

  } catch (error) {
    if (error.response) {
      console.error('❌ Erro HTTP:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ Erro de conexão:', error.message);
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
}

testar();
