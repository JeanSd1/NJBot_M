const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const EmpresaSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  telefone: String,
  botAtivo: { type: Boolean, default: true },
  iaConfig: {
    tipo: { type: String, enum: ['gemini','gpt','claude','publicai'], default: 'gemini' },
    apiKey: { type: String, required: false },
    modelo: { type: String, default: 'claude-3-5-haiku-20241022' }
  },
  promptIA: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  msgBoasVindas: { type: String, default: 'Olá! Bem-vindo(a)! Como posso te ajudar?' },
  timeoutHumanoMinutos: { type: Number, default: 10 },
  msgFechado: { type: String, default: 'Olá! Nosso horário de atendimento é de [HORARIO_INICIO]h às [HORARIO_FIM]h. Retornaremos assim que possível.' },
  horariosSemana: {
    type: Map,
    of: new mongoose.Schema({
      inicio: { type: String, default: '09:00' },
      fim: { type: String, default: '18:00' },
      ativo: { type: Boolean, default: true },
      intervaloInicio: { type: String, default: '12:00' },
      intervaloFim: { type: String, default: '13:00' }
    }),
    default: {
      '1': { inicio: '09:00', fim: '18:00', ativo: true, intervaloInicio: '12:00', intervaloFim: '13:00' },
      '2': { inicio: '09:00', fim: '18:00', ativo: true, intervaloInicio: '12:00', intervaloFim: '13:00' },
      '3': { inicio: '09:00', fim: '18:00', ativo: true, intervaloInicio: '12:00', intervaloFim: '13:00' },
      '4': { inicio: '09:00', fim: '18:00', ativo: true, intervaloInicio: '12:00', intervaloFim: '13:00' },
      '5': { inicio: '09:00', fim: '18:00', ativo: true, intervaloInicio: '12:00', intervaloFim: '13:00' },
      '6': { inicio: '00:00', fim: '00:00', ativo: false, intervaloInicio: '00:00', intervaloFim: '00:00' },
      '0': { inicio: '00:00', fim: '00:00', ativo: false, intervaloInicio: '00:00', intervaloFim: '00:00' }
    }
  },
  // Credenciais da empresa para acesso ao painel
  credenciais: {
    usuario: { type: String, unique: true, sparse: true },
    senhaHash: { type: String },
    criadoEm: { type: Date, default: Date.now }
  }
}, { timestamps: true });

EmpresaSchema.pre('save', function(next) {
  if (this.iaConfig?.apiKey && this.iaConfig.apiKey.includes('publicai.co')) {
    this.iaConfig.tipo = 'publicai';
  }
  next();
});

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

function encryptApiKey(apiKey) {
  if (!apiKey) return apiKey;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8').slice(0,32), iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptApiKey(encryptedApiKey) {
  if (!encryptedApiKey || !encryptedApiKey.includes(':')) return encryptedApiKey;
  try {
    const parts = encryptedApiKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8').slice(0,32), iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Error decrypting API key:', err.message);
    return encryptedApiKey;
  }
}

EmpresaSchema.pre('save', function(next) {
  if (this.iaConfig && this.iaConfig.apiKey && !this.iaConfig.apiKey.includes(':')) {
    this.iaConfig.apiKey = encryptApiKey(this.iaConfig.apiKey);
  }
  next();
});

EmpresaSchema.post('findOne', function(doc) {
  if (doc && doc.iaConfig && doc.iaConfig.apiKey) {
    doc.iaConfig.apiKey = decryptApiKey(doc.iaConfig.apiKey);
  }
});

EmpresaSchema.methods.getDecryptedApiKey = function() {
  if (this.iaConfig && this.iaConfig.apiKey) return decryptApiKey(this.iaConfig.apiKey);
  return null;
};

EmpresaSchema.statics.encryptApiKey = function(apiKey) { return encryptApiKey(apiKey); };

// Método para definir senha
EmpresaSchema.methods.definirSenha = async function(senha) {
  if (!senha || senha.trim().length < 6) {
    throw new Error('Senha deve ter pelo menos 6 caracteres');
  }
  console.log('🔐 Iniciando hash da senha com bcrypt...');
  this.credenciais.senhaHash = await bcrypt.hash(senha, 10);
  console.log('✅ Senha hasheada com sucesso');
};

// Método para validar senha
EmpresaSchema.methods.validarSenha = async function(senha) {
  console.log('🔍 Validando senha...');
  if (!this.credenciais.senhaHash) {
    console.error('❌ Nenhum hash de senha encontrado');
    return false;
  }
  console.log('📝 Hash armazenado:', this.credenciais.senhaHash.substring(0, 20) + '...');
  const resultado = await bcrypt.compare(senha, this.credenciais.senhaHash);
  console.log('✅ Comparação completada:', resultado);
  return resultado;
};

module.exports = mongoose.model('Empresa', EmpresaSchema);
