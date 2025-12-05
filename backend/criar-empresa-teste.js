/**
 * Script para criar empresa "teste" associada ao usuário teste
 * Uso: node criar-empresa-teste.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Empresa = require('./models/Empresa');

async function criarEmpresaTeste() {
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Encontrar o usuário teste
    const usuario = await User.findOne({ email: 'teste@teste.com' });
    if (!usuario) {
      console.log('❌ Usuário teste@teste.com não encontrado!');
      console.log('💡 Execute "node criar-usuario-teste.js" primeiro');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Usuário encontrado: ${usuario.nome}\n`);

    // Verificar se empresa já existe
    const empresaExistente = await Empresa.findOne({ nome: 'Empresa Teste' });
    if (empresaExistente) {
      console.log('⚠️  Empresa "Empresa Teste" já existe!');
      console.log('\n📋 Dados da empresa:');
      console.log(`  Nome: ${empresaExistente.nome}`);
      console.log(`  Usuário: ${empresaExistente.usuario}`);
      console.log(`  Criada em: ${empresaExistente.criadoEm}`);
      await mongoose.disconnect();
      return;
    }

    // Criar empresa
    const empresa = new Empresa({
      nome: 'Empresa Teste',
      usuario: usuario._id,
      descricao: 'Empresa de teste para demonstração',
      telefone: '(11) 99999-9999',
      email: 'contato@empresateste.com',
      website: 'https://empresateste.com',
      iaConfig: {
        tipo: 'gemini',
        modelo: 'gemini-pro'
      },
      promptIA: 'Você é um assistente de IA útil e amigável. Responda em português.'
    });

    await empresa.save();

    console.log('✅ Empresa criada com sucesso!\n');
    console.log('📋 Dados da empresa:');
    console.log(`  ID: ${empresa._id}`);
    console.log(`  Nome: ${empresa.nome}`);
    console.log(`  Email: ${empresa.email}`);
    console.log(`  Usuário: ${usuario.email}`);
    console.log('\n💡 Esta empresa agora pertence ao usuário teste@teste.com');

    await mongoose.disconnect();
    console.log('\n✅ Script finalizado');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

criarEmpresaTeste();
