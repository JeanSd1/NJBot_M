// Script para testar credenciais
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Empresa = require('./models/Empresa');

async function testarCredenciais() {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado ao MongoDB');

    // Buscar a primeira empresa
    const empresa = await Empresa.findOne();
    if (!empresa) {
      console.log('❌ Nenhuma empresa encontrada no banco');
      process.exit(1);
    }

    console.log('\n📋 Empresa encontrada:', empresa.nome);
    console.log('📝 ID:', empresa._id);
    console.log('👤 Usuário no BD:', empresa.credenciais?.usuario);
    console.log('🔐 Hash armazenado:', empresa.credenciais?.senhaHash ? empresa.credenciais.senhaHash.substring(0, 30) + '...' : 'NENHUM');

    // Testar validação de senha
    if (empresa.credenciais?.senhaHash) {
      console.log('\n🔐 Testando validação de senha...');
      const resultado = await empresa.validarSenha('123456');
      console.log('Teste com senha "123456":', resultado);
    }

    console.log('\n✅ Teste de credenciais completo');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testarCredenciais();
