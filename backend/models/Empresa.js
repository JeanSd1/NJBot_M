// const mongoose = require('mongoose');

// const EmpresaSchema = new mongoose.Schema({
//   nome: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   telefone: String,
//   botAtivo: {
//     type: Boolean,
//     default: true
//   },
//   promptIA: {
//     type: String,
//     required: true
//   },
//   msgBoasVindas: {
//     type: String,
//     // Define um valor padrão para empresas existentes ou novas, se necessário.
//     default: "Olá! 👋 Bem-vindo(a)! Como posso te ajudar?" 
//   },
//   timeoutHumanoMinutos: {
//     type: Number,
//     default: 10 // Padrão de 10 minutos
//   },
//   msgFechado: { // MANTIDO e usado quando o dia está fechado
//         type: String,
//         default: 'Olá! Nosso horário de atendimento é de [HORARIO_INICIO]h às [HORARIO_FIM]h. Retornaremos assim que possível.'
//   },
//   horariosSemana: {
//         type: Map, // Usa um Map para { "domingo": { inicio: "HH:MM", fim: "HH:MM", ativo: boolean } }
//         of: new mongoose.Schema({
//             inicio: { type: String, default: '09:00' },
//             fim: { type: String, default: '18:00' },
//             ativo: { type: Boolean, default: true } // Indica se o bot deve funcionar neste dia
//         }),
//         default: {
//             // Padrão de segunda a sexta (Dias da semana são 0=Dom, 1=Seg... 6=Sab)
//             '1': { inicio: '09:00', fim: '18:00', ativo: true },
//             '2': { inicio: '09:00', fim: '18:00', ativo: true },
//             '3': { inicio: '09:00', fim: '18:00', ativo: true },
//             '4': { inicio: '09:00', fim: '18:00', ativo: true },
//             '5': { inicio: '09:00', fim: '18:00', ativo: true },
//             '6': { inicio: '00:00', fim: '00:00', ativo: false }, // Sábado fechado
//             '0': { inicio: '00:00', fim: '00:00', ativo: false }  // Domingo fechado
//         }
//     },
// }, { timestamps: true });

// module.exports = mongoose.model('Empresa', EmpresaSchema);


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

module.exports = mongoose.model('Empresa', EmpresaSchema);
