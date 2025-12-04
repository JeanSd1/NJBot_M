// Teste do fluxo completo via API
const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Empresa = require('./models/Empresa');
const API_BASE = 'http://localhost:3000/api';

async function testar() {
  try {
    console.log('🚀 Iniciando teste completo de credenciais\n');

    // Conectar ao MongoDB para obter uma empresa existente
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado ao MongoDB\n');

    // Buscar primeira empresa
    const empresa = await Empresa.findOne();
    console.log('📋 Usando empresa:', empresa.nome);
    console.log('   ID:', empresa._id);

    // Passo 1: Criar credenciais via endpoint
    console.log('\n1️⃣ Criando credenciais via endpoint /empresas-setup/:id/credenciais');
    try {
      const credRes = await axios.post(`${API_BASE}/empresas-setup/${empresa._id}/credenciais`, {
        usuario: 'testuser123',
        senha: 'minhaSenha456'
      });
      console.log('✅ Resposta:', credRes.data);
    } catch (err) {
      console.error('❌ Erro ao criar credenciais:');
      console.error('   Status:', err.response?.status);
      console.error('   Erro:', err.response?.data);
      console.error('   Mensagem:', err.message);
      throw err;
    }

    // Passo 2: Recarregar empresa do banco para verificar
    console.log('\n2️⃣ Recarregando empresa do banco...');
    const empresaAtualizada = await Empresa.findById(empresa._id);
    console.log('✅ Empresa recarregada');
    console.log('   Usuário:', empresaAtualizada.credenciais?.usuario);
    console.log('   Hash:', empresaAtualizada.credenciais?.senhaHash?.substring(0, 50) + '...');

    // Passo 3: Fazer login
    console.log('\n3️⃣ Tentando fazer login...');
    try {
      const loginRes = await axios.post(`${API_BASE}/empresas/login`, {
        empresaId: empresa._id,
        usuario: 'testuser123',
        senha: 'minhaSenha456'
      });
      console.log('✅ LOGIN BEM-SUCEDIDO!');
      console.log('   Token:', loginRes.data.token?.substring(0, 50) + '...');
      console.log('   Empresa:', loginRes.data.nome);
    } catch (err) {
      console.error('❌ Erro ao fazer login:');
      console.error('   Status:', err.response?.status);
      console.error('   Erro:', err.response?.data?.error);
      throw err;
    }

    console.log('\n✅ TESTE COMPLETO COM SUCESSO! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error.message);
    process.exit(1);
  }
}

testar();
