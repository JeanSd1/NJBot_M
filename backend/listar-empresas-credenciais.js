const mongoose = require('mongoose');
const Empresa = require('./models/Empresa');

// Conectar ao MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/njbot';
mongoose.connect(mongoUri).then(() => {
  console.log('✅ Conectado ao MongoDB');
  listarEmpresas();
}).catch(err => {
  console.error('❌ Erro ao conectar:', err);
  process.exit(1);
});

async function listarEmpresas() {
  try {
    const empresas = await Empresa.find({}, 'nome credenciais');
    console.log('\n📋 EMPRESAS COM CREDENCIAIS:');
    console.log('═'.repeat(80));
    
    empresas.forEach((empresa, idx) => {
      console.log(`\n${idx + 1}. ${empresa.nome}`);
      console.log(`   ID: ${empresa._id}`);
      if (empresa.credenciais && empresa.credenciais.usuario) {
        console.log(`   Usuário: ${empresa.credenciais.usuario}`);
        console.log(`   Senha: Configurada ✅`);
      } else {
        console.log(`   ❌ Sem credenciais configuradas`);
      }
    });
    
    console.log('\n' + '═'.repeat(80));
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}
