const axios = require('axios');

// Tentar fazer login com uma empresa que deveria ter credenciais
// Baseado nos testes anteriores, a empresa com ID pode ser testada

async function testarCredenciais() {
  try {
    // Primeiro, vamos tentar fazer um login com "lugane123" e "senha456"
    // que foi criado nos testes anteriores
    
    console.log('🔍 Tentando listar empresas através da API...');
    
    // Fazer requisição para listar empresas (sem autenticação, se houver endpoint)
    // ou fazer login direto
    
    const empresas = [
      { id: '68a4bd7206c4f1639122cfab', nome: 'RHID suporte' },
      { id: '68a5cdf0866a12fdd8acbde4', nome: 'Lugane Salão de Beleza' },
      { id: '68ee7a4165e16c93a9fae453', nome: 'lugane' },
      { id: '68ff6168a839bdef25da23df', nome: 'TestNewCompany' },
      { id: '69010b55ae3a01929fdf43a3', nome: 'Lugane' },
      { id: '690390e8cd0697a552b1b783', nome: 'SejaCool' },
      { id: '69309b8170b74ca33528ad9c', nome: 'TESTE' }
    ];

    console.log('\n📋 TESTANDO LOGIN COM CREDENCIAIS CONHECIDAS:\n');
    
    // Testar com lugane123
    try {
      const res = await axios.post('http://localhost:3000/api/empresas/login', {
        usuario: 'lugane123',
        senha: 'senha456',
        empresaId: '69309b8170b74ca33528ad9c'
      });
      
      console.log('✅ LOGIN SUCESSO COM lugane123!');
      console.log('   Token:', res.data.token.substring(0, 50) + '...');
      console.log('   Empresa ID:', res.data.empresaId);
      console.log('   Empresa Nome:', res.data.empresaNome);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 404) {
        console.log('❌ Credentials for lugane123 not found or invalid');
        console.log('   Erro:', err.response?.data?.error);
      } else {
        console.log('❌ Erro:', err.response?.data || err.message);
      }
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

testarCredenciais();
