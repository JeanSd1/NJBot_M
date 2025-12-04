// Script para verificar quais empresas têm credenciais
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Empresa = require('./models/Empresa');

async function verificar() {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado\n');

    // Buscar todas as empresas
    const empresas = await Empresa.find();
    console.log(`📊 Total de empresas: ${empresas.length}\n`);

    empresas.forEach((emp, idx) => {
      console.log(`${idx + 1}. ${emp.nome}`);
      console.log(`   ID: ${emp._id}`);
      console.log(`   Usuário: ${emp.credenciais?.usuario || '❌ NÃO CONFIGURADO'}`);
      console.log(`   Senha Hash: ${emp.credenciais?.senhaHash ? '✅ SIM' : '❌ NÃO'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

verificar();
