const mongoose = require('mongoose');

const EmpresaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    unique: true
  },
  telefone: String,
  botAtivo: {
    type: Boolean,
    default: true
  },
  promptIA: {
    type: String,
    required: true
  },
  msgBoasVindas: {
    type: String,
    // Define um valor padrão para empresas existentes ou novas, se necessário.
    default: "Olá! 👋 Bem-vindo(a) à [Nome da Empresa]! Como posso te ajudar?" 
  }
}, { timestamps: true });

module.exports = mongoose.model('Empresa', EmpresaSchema);
