const axios = require('axios');

async function criarCredenciais() {
  try {
    console.log('🔧 Criando credenciais para empresa de teste...\n');
    
    // ID de uma das empresas do banco
    const empresaId = '69309b8170b74ca33528ad9c'; // TESTE
    
    // Criar credenciais sem autenticação usando o endpoint setup
    console.log('📝 Enviando requisição para criar credenciais...');
    const res = await axios.post(
      `http://localhost:3000/api/empresas-setup/${empresaId}/credenciais`,
      {
        usuario: 'admin@teste',
        senha: 'Teste@123'
      }
    );
    
    console.log('✅ Credenciais criadas com sucesso!');
    console.log('\n📋 Dados retornados:');
    console.log('   Empresa ID:', res.data.empresa._id);
    console.log('   Empresa Nome:', res.data.empresa.nome);
    console.log('   Usuário:', res.data.empresa.credenciais.usuario);
    console.log('   Senha Hash: ****');
    console.log('\n✨ Agora você pode fazer login com:');
    console.log('   Usuário: admin@teste');
    console.log('   Senha: Teste@123');
    console.log('   Empresa: TESTE');
    
  } catch (err) {
    console.error('❌ Erro ao criar credenciais:');
    console.error('Status:', err.response?.status);
    console.error('Erro:', err.response?.data?.error || err.response?.data?.message || err.message);
  }
}

criarCredenciais();
