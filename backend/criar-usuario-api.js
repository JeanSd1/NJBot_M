/**
 * Criar usuário teste via API
 * Use isso enquanto o backend está rodando
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function criarUsuarioTeste() {
  try {
    console.log('📝 Criando usuário teste via API...\n');

    // Primeiro, fazer login como admin
    console.log('🔐 Fazendo login como admin...');
    const loginRes = await axios.post(`${API_URL}/api/login`, {
      email: 'jeansd@njbot.com',
      senha: 'Lock203001@191427MMaj@'
    });

    const token = loginRes.data.token;
    console.log('✅ Login bem-sucedido\n');

    // Criar novo usuário
    console.log('👤 Criando usuário teste...');
    const createRes = await axios.post(
      `${API_URL}/api/users`,
      {
        nome: 'Usuário Teste',
        email: 'teste@teste.com',
        senha: 'teste123',
        role: 'client'
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('📋 Dados de acesso:');
    console.log('  Email: teste@teste.com');
    console.log('  Senha: teste123');
    console.log('  Role: client');
    console.log('\n💡 Agora faça login com essas credenciais na tela inicial');

  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.error?.includes('já existe')) {
      console.log('⚠️  Usuário teste@teste.com já existe!');
      console.log('\n📋 Dados de acesso:');
      console.log('  Email: teste@teste.com');
      console.log('  Senha: teste123');
    } else {
      console.error('❌ Erro:', err.response?.data?.error || err.message);
      console.log('\n💡 Certifique-se de que:');
      console.log('  1. Backend está rodando em http://localhost:3000');
      console.log('  2. MongoDB está conectado');
      console.log('  3. As credenciais de admin estão corretas');
    }
  }
}

criarUsuarioTeste();
