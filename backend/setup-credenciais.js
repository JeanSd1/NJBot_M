require('dotenv').config();
const mongoose = require('mongoose');
const Empresa = require('./models/Empresa');

async function criarCredenciais() {
  try {
    // Conectar ao banco
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://...';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao banco de dados');

    // Buscar a empresa
    const empresa = await Empresa.findById('69309b8170b74ca33528ad9c');
    if (!empresa) {
      console.error('❌ Empresa não encontrada');
      process.exit(1);
    }

    console.log(`📝 Atualizando empresa: ${empresa.nome}`);
    
    // Inicializar credenciais se não existir
    if (!empresa.credenciais) {
      empresa.credenciais = {};
    }

    // Definir usuário
    empresa.credenciais.usuario = 'admin';
    
    // Hash da senha
    console.log('🔐 Hasheando senha...');
    await empresa.definirSenha('Senha@123');

    // Salvar
    await empresa.save();
    console.log('✅ Credenciais criadas com sucesso!');
    console.log(`   Usuário: admin`);
    console.log(`   Senha: Senha@123`);
    console.log(`   Empresa ID: 69309b8170b74ca33528ad9c`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

criarCredenciais();
