/**
 * Script para criar usuário de teste
 * Uso: node criar-usuario-teste.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function criarUsuarioTeste() {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Verificar se o usuário já existe
    const usuarioExistente = await User.findOne({ email: 'teste@teste.com' });
    if (usuarioExistente) {
      console.log('⚠️  Usuário teste@teste.com já existe!');
      console.log('\n📋 Dados do usuário:');
      console.log(`  Email: ${usuarioExistente.email}`);
      console.log(`  Role: ${usuarioExistente.role}`);
      console.log(`  Criado em: ${usuarioExistente.createdAt}`);
      await mongoose.disconnect();
      return;
    }

    // Criar novo usuário
    const usuario = new User({
      nome: 'Usuário Teste',
      email: 'teste@teste.com',
      role: 'client'
    });

    await usuario.setPassword('teste123');
    await usuario.save();

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('📋 Dados de acesso:');
    console.log('  Email: teste@teste.com');
    console.log('  Senha: teste123');
    console.log('  Role: client');
    console.log('\n💡 Use essas credenciais para fazer login na tela inicial');

    await mongoose.disconnect();
    console.log('\n✅ Script finalizado');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

criarUsuarioTeste();
