const mongoose = require('mongoose');
const crypto = require('crypto');

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
  iaConfig: {
    tipo: {
      type: String,
      enum: ['gemini', 'gpt', 'claude', 'publicai'],
      default: 'gemini'
    },
    apiKey: {
      type: String,
      required: false // Opcional, usa a key padrão se não fornecida
    }
  },
  promptIA: {
    type: String,
    required: true
  },
  msgBoasVindas: {
    type: String,
    default: "Olá! 👋 Bem-vindo(a)! Como posso te ajudar?" 
  },
  timeoutHumanoMinutos: {
    type: Number,
    default: 10 // Padrão de 10 minutos
  },
  msgFechado: { // MANTIDO e usado quando o dia está fechado
    type: String,
    default: 'Olá! Nosso horário de atendimento é de [HORARIO_INICIO]h às [HORARIO_FIM]h. Retornaremos assim que possível.'
  },
  horariosSemana: {
    type: Map,
    of: new mongoose.Schema({
        inicio: { type: String, default: '09:00' },
        fim: { type: String, default: '18:00' },
        ativo: { type: Boolean, default: true }, // Indica se o bot deve funcionar neste dia
        // >>> NOVOS CAMPOS PARA O INTERVALO <<<
        intervaloInicio: { type: String, default: '12:00' },
        intervaloFim: { type: String, default: '13:00' },
        // <<<
    }),
    default: {
        // Padrão de segunda a sexta (Dias da semana são 0=Dom, 1=Seg... 6=Sab)
        '1': { 
            inicio: '09:00', 
            fim: '18:00', 
            ativo: true,
            intervaloInicio: '12:00', // Padrão de almoço
            intervaloFim: '13:00'      // Padrão de volta
        },
        '2': { 
            inicio: '09:00', 
            fim: '18:00', 
            ativo: true,
            intervaloInicio: '12:00',
            intervaloFim: '13:00'
        },
        '3': { 
            inicio: '09:00', 
            fim: '18:00', 
            ativo: true,
            intervaloInicio: '12:00',
            intervaloFim: '13:00'
        },
        '4': { 
            inicio: '09:00', 
            fim: '18:00', 
            ativo: true,
            intervaloInicio: '12:00',
            intervaloFim: '13:00'
        },
        '5': { 
            inicio: '09:00', 
            fim: '18:00', 
            ativo: true,
            intervaloInicio: '12:00',
            intervaloFim: '13:00'
        },
        '6': { inicio: '00:00', fim: '00:00', ativo: false, intervaloInicio: '00:00', intervaloFim: '00:00' }, // Sábado fechado
        '0': { inicio: '00:00', fim: '00:00', ativo: false, intervaloInicio: '00:00', intervaloFim: '00:00' }  // Domingo fechado
    }
  },
}, { timestamps: true });

// Middleware para auto-detectar o tipo de IA com base na API key
EmpresaSchema.pre('save', function(next) {
  if (this.iaConfig?.apiKey) {
    if (this.iaConfig.apiKey.includes('publicai.co')) {
      this.iaConfig.tipo = 'publicai';
    }
  }
  
  
  // Encryption utilities for API keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

function encryptApiKey(apiKey) {
  if (!apiKey) return apiKey;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8').slice(0, 32), iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptApiKey(encryptedApiKey) {
  if (!encryptedApiKey || !encryptedApiKey.includes(':')) return encryptedApiKey;
  try {
    const parts = encryptedApiKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8').slice(0, 32), iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Error decrypting API key:', err.message);
    return encryptedApiKey;
  }
}

// Middleware to encrypt API key on save
EmpresaSchema.pre('save', function(next) {
  if (this.iaConfig && this.iaConfig.apiKey && !this.iaConfig.apiKey.includes(':')) {
    this.iaConfig.apiKey = encryptApiKey(this.iaConfig.apiKey);
  }
  next();
});

// Middleware to decrypt API key on find/findOne
EmpresaSchema.post('findOne', function(doc) {
  if (doc && doc.iaConfig && doc.iaConfig.apiKey) {
    doc.iaConfig.apiKey = decryptApiKey(doc.iaConfig.apiKey);
  }
});

// Instance method to get decrypted API key
EmpresaSchema.methods.getDecryptedApiKey = function() {
  if (this.iaConfig && this.iaConfig.apiKey) {
    return decryptApiKey(this.iaConfig.apiKey);
  }
  return null;
};

// Static method to encrypt API key
EmpresaSchema.statics.encryptApiKey = function(apiKey) {
  return encryptApiKey(apiKey);
};
next();
});

module.exports = mongoose.model('Empresa', EmpresaSchema);
