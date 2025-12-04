// Script simples para testar credenciais direto no banco
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Empresa = require('./models/Empresa');

async function testar() {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado');

    // Buscar primeira empresa
    let empresa = await Empresa.findOne();
    console.log('\n📋 Empresa:', empresa.nome);
    console.log('🔑 ID:', empresa._id);

    // Testar método definirSenha
    console.log('\n🔐 Testando definirSenha com "senha123"...');
    if (!empresa.credenciais) {
      empresa.credenciais = {};
      console.log('  📝 Objeto credenciais criado');
    }
    
    empresa.credenciais.usuario = 'testuser';
    await empresa.definirSenha('senha123');
    await empresa.save();
    console.log('✅ Senha definida e salva no banco');

    // Recarregar do banco
    empresa = await Empresa.findById(empresa._id);
    console.log('\n🔍 Dados recarregados do banco:');
    console.log('  Usuário:', empresa.credenciais?.usuario);
    console.log('  Hash:', empresa.credenciais?.senhaHash?.substring(0, 50) + '...');

    // Testar validação
    console.log('\n🧪 Testando validações:');
    let resultado = await empresa.validarSenha('senha123');
    console.log('  Senha "senha123":', resultado ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    
    resultado = await empresa.validarSenha('wrongpassword');
    console.log('  Senha "wrongpassword":', resultado ? '✅ VÁLIDA' : '❌ INVÁLIDA');

    console.log('\n✅ Teste completo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testar();
