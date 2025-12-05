require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Usar a mesma string de conexão do server.js
const mongoUri = 'mongodb+srv://nickolasamaral:uw0tfg8QvBD4fNIE@cluster0.xhgh1sg.mongodb.net/chatbots?retryWrites=true&w=majority&appName=Cluster0';
const EmpresaSchema = new mongoose.Schema({
  nome: String,
  credenciais: {
    usuario: String,
    senhaHash: String,
    criadoEm: { type: Date, default: Date.now }
  }
}, { strict: false });

EmpresaSchema.methods.definirSenha = async function(senha) {
  this.credenciais.senhaHash = await bcrypt.hash(senha, 10);
};

const Empresa = mongoose.model('Empresa', EmpresaSchema);

async function main() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao banco');

    const empresa = await Empresa.findById('69309b8170b74ca33528ad9c');
    if (!empresa) {
      console.log('❌ Empresa não encontrada');
      process.exit(1);
    }

    // Criar credenciais
    if (!empresa.credenciais) empresa.credenciais = {};
    empresa.credenciais.usuario = 'admin';
    await empresa.definirSenha('Senha@123');
    await empresa.save();

    console.log('✅ Credenciais criadas:');
    console.log('   Usuário: admin');
    console.log('   Senha: Senha@123');
    console.log('   Empresa ID: 69309b8170b74ca33528ad9c');

    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

main();
