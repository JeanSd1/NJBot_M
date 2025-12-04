// Teste de criação de credenciais via API
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testar() {
  try {
    console.log('🚀 Testando criação de credenciais\n');

    // ID da empresa "Lugane Salão de Beleza" que não tem credenciais
    const empresaId = '68a5cdf0866a12fdd8acbde4';
    
    console.log('1️⃣ Criando credenciais...');
    const credRes = await axios.post(`${API_BASE}/empresas-setup/${empresaId}/credenciais`, {
      usuario: 'lugane123',
      senha: 'senha456'
    });
    console.log('✅ Resposta:', JSON.stringify(credRes.data, null, 2));

    console.log('\n2️⃣ Tentando fazer login...');
    const loginRes = await axios.post(`${API_BASE}/empresas/login`, {
      empresaId: empresaId,
      usuario: 'lugane123',
      senha: 'senha456'
    });
    console.log('✅ LOGIN SUCESSO!');
    console.log('   Token:', loginRes.data.token?.substring(0, 50) + '...');
    console.log('   Empresa:', loginRes.data.nome);

    console.log('\n✅ Teste completo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:');
    console.error('   Status:', error.response?.status);
    console.error('   Erro:', error.response?.data?.error);
    console.error('   Mensagem:', error.message);
    process.exit(1);
  }
}

testar();
