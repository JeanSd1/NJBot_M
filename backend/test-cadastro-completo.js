// Script para testar o fluxo completo de cadastro com credenciais
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:3000/api';

async function testarFluxoCompleto() {
  try {
    console.log('🚀 Iniciando teste completo de cadastro com credenciais\n');

    // 1. Criar uma nova empresa
    console.log('1️⃣ Criando empresa...');
    const empresaRes = await axios.post(API_BASE + '/empresas', {
      nome: `Empresa Teste ${Date.now()}`,
      telefone: '11987654321',
      promptIA: 'Você é um assistente virtual amigável',
      ativo: true,
      iaConfig: {
        tipo: 'gemini',
        apiKey: process.env.GEMINI_API_KEY || 'fake-key-for-test',
        modelo: 'gemini-2.5-flash'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'no-token'}`
      }
    });

    const empresaId = empresaRes.data.empresa._id;
    console.log('✅ Empresa criada:', empresaId);
    console.log('   Nome:', empresaRes.data.empresa.nome);

    // 2. Criar credenciais via novo endpoint
    console.log('\n2️⃣ Criando credenciais da empresa...');
    const credRes = await axios.post(API_BASE + `/empresas-setup/${empresaId}/credenciais`, {
      usuario: 'testuser',
      senha: 'senha123'
    });
    console.log('✅ Credenciais criadas');
    console.log('   Resposta:', credRes.data);

    // 3. Tentar fazer login
    console.log('\n3️⃣ Tentando fazer login com as credenciais criadas...');
    const loginRes = await axios.post(API_BASE + '/empresas/login', {
      empresaId: empresaId,
      usuario: 'testuser',
      senha: 'senha123'
    });
    console.log('✅ Login bem-sucedido!');
    console.log('   Token:', loginRes.data.token?.substring(0, 30) + '...');
    console.log('   Empresa:', loginRes.data.nome);

    // 4. Verificar dados no banco
    console.log('\n4️⃣ Verificando dados no banco...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const Empresa = require('./models/Empresa');
    const empresaDb = await Empresa.findById(empresaId);
    console.log('✅ Empresa no banco:');
    console.log('   Nome:', empresaDb.nome);
    console.log('   Usuário:', empresaDb.credenciais?.usuario);
    console.log('   Hash:', empresaDb.credenciais?.senhaHash?.substring(0, 30) + '...');

    console.log('\n✅ TESTE COMPLETO COM SUCESSO! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    console.error('Detalhes completos:', error);
    process.exit(1);
  }
}

testarFluxoCompleto();
