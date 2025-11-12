// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Empresa = require('./models/Empresa');
const botManager = require('./botManager');

const { statusBots } = require('./botManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Conectado ao MongoDB Atlas'))
  .catch(err => console.error('❌ Erro ao conectar no MongoDB:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'chavejwtsegura';

const ADMIN_EMAIL = process.env.LOGIN_FIXO_EMAIL
const ADMIN_PASSWORD = process.env.LOGIN_FIXO_SENHA

const USUARIO_FIXO = {
  email: ADMIN_EMAIL,
  senha: ADMIN_PASSWORD,
  nome: 'Administrador'
};

// --- Rotas de Autenticação ---

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  if (email !== USUARIO_FIXO.email || senha !== USUARIO_FIXO.senha) {
    return res.status(401).json({ erro: 'Email ou senha inválidos' });
  }

  const token = jwt.sign({ email: USUARIO_FIXO.email, nome: USUARIO_FIXO.nome }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, nome: USUARIO_FIXO.nome, email: USUARIO_FIXO.email });
});


// --- Rotas de Gerenciamento de Empresas (CRUD) ---

app.post('/api/empresas', async (req, res) => {
    const { 
        nome, promptIA, telefone, ativo, 
        msgBoasVindas, timeoutHumanoMinutos, msgFechado, horariosSemana
    } = req.body;
    
    try {
      const empresaExistente = await Empresa.findOne({ nome });
      if (empresaExistente) return res.status(400).json({ error: 'Empresa já existe.' });

      const novaEmpresa = new Empresa({ 
          nome, promptIA, telefone, botAtivo: ativo,
          msgBoasVindas, timeoutHumanoMinutos, msgFechado, horariosSemana
      });
      await novaEmpresa.save(); // Salva para ter o _id

      // ✅ CORREÇÃO CRÍTICA: USAR ID NO CAMINHO DA PASTA (Resolve ENOENT)
      const empresaId = novaEmpresa._id.toString();
      const pasta = path.join(__dirname, 'bots', empresaId); 
      if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
      fs.writeFileSync(path.join(pasta, 'prompt.txt'), promptIA);

      // Inicia o bot via botManager
      const qrCode = await botManager.iniciarBot(novaEmpresa);

      return res.json({ qrCode, empresa: novaEmpresa });

  } catch (err) {
    console.error('❌ Erro ao cadastrar empresa:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar empresa.' });
  }
});

app.get('/api/empresas', async (req, res) => {
  try {
    const empresas = await Empresa.find();
    return res.json(empresas);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao listar empresas.' });
  }
});

// Rota para buscar uma única empresa por ID
app.get('/api/empresas/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
  
      const empresa = await Empresa.findById(id);
      
      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada.' });
      }
  
      return res.json(empresa);
    } catch (error) {
      console.error('❌ Erro ao buscar empresa por ID:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar empresa.' });
    }
});


app.put('/api/empresas/:id', async (req, res) => {
  const { id } = req.params;
  const { 
      nome, promptIA, telefone, botAtivo, 
      msgBoasVindas, timeoutHumanoMinutos, msgFechado, horariosSemana 
  } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    const empresaAntiga = await Empresa.findById(id);
    if (!empresaAntiga) return res.status(404).json({ error: 'Empresa não encontrada.' });

    const empresaAtualizada = await Empresa.findByIdAndUpdate(
      id,
      { 
          nome, promptIA, telefone, botAtivo, 
          msgBoasVindas, timeoutHumanoMinutos, msgFechado, horariosSemana 
      },
      { new: true, runValidators: true }
    );

    // ⚠️ REMOVIDO: Lógica de renomear pasta. A pasta usa o ID fixo.

    // ✅ CORREÇÃO: USAR ID NO CAMINHO (O ID é o parâmetro 'id')
    const pasta = path.join(__dirname, 'bots', id);
    if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
    fs.writeFileSync(path.join(pasta, 'prompt.txt'), promptIA);

    res.json(empresaAtualizada);
  } catch (error) {
    console.error('❌ Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro ao atualizar empresa.' });
  }
});

app.delete('/api/empresas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    const empresa = await Empresa.findById(id);
    if (!empresa) return res.status(404).json({ message: 'Empresa não encontrada' });

    await Empresa.findByIdAndDelete(id);

    // ✅ CORREÇÃO: USAR ID NO CAMINHO DA PASTA
    const pastaEmpresa = path.join(__dirname, 'bots', id);
    if (fs.existsSync(pastaEmpresa)) fs.rmSync(pastaEmpresa, { recursive: true, force: true });

    // ✅ CORREÇÃO: Passar o ID para deletar
    botManager.deletarEmpresa(id);

    res.status(200).json({ message: 'Empresa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    res.status(500).json({ message: 'Erro ao deletar empresa' });
  }
});

app.put('/api/empresas/:id/toggle-bot', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[TOGGLE] Requisição para alternar bot id=${id}, body=`, req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    const empresa = await Empresa.findById(id);
    if (!empresa) return res.status(404).json({ message: 'Empresa não encontrada' });

    const previous = empresa.botAtivo;
    empresa.botAtivo = !empresa.botAtivo;
    await empresa.save();
    console.log(`[TOGGLE] Empresa ${id}: botAtivo changed ${previous} -> ${empresa.botAtivo}`);

    // Ligar/desligar bot via botManager
    try {
      await botManager.toggleBot(empresa);
      console.log(`[TOGGLE] botManager.toggleBot completed for ${id}`);
    } catch (bmErr) {
      console.error(`[TOGGLE] Erro em botManager.toggleBot para ${id}:`, bmErr);
      return res.status(500).json({ message: 'Erro ao alternar bot (botManager)', detail: bmErr.message || bmErr.toString() });
    }

    res.status(200).json({ botAtivo: empresa.botAtivo });

  } catch (error) {
    console.error('Erro ao alternar bot:', error);
    res.status(500).json({ message: 'Erro ao alternar bot', detail: error.message || error.toString() });
  }
});


// --- Rotas de Controle do Bot (QR Code / Reiniciar) ---

app.get('/api/qr/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    const empresa = await Empresa.findById(id);
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

    // Lógica de Status: Se conectado, retorna 204 (No Content)
    const idString = empresa._id.toString();
    if (statusBots[idString]?.conectado) {
      return res.status(204).json(); 
    }

    // ✅ CORREÇÃO: Usar o ID como chave (botManager.js usa o ID)
    const qr = botManager.getQRCode(idString); 
    
    if (qr) return res.json({ qrCode: qr });
    else return res.status(204).json();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar QR code.' });
  }
});

app.post('/api/reiniciar-bot/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    const empresa = await Empresa.findById(id);
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

    await botManager.reiniciarBot(empresa);

    // ✅ CORREÇÃO: Usar o ID como chave
    const qrCode = botManager.getQRCode(empresa._id.toString());
    res.json({ qrCode });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao reiniciar bot.' });
  }
});


// --- Rotas de Status/Health Check ---

app.get('/api/bots/status', (req, res) => {
  res.json(statusBots);
});

app.get('/', (req, res) => {
  res.send('🤖 API do NJBot está rodando!');
});


// --- Inicialização do Servidor ---

// Iniciar todos bots ao subir servidor
// Iniciar todos bots ao subir servidor (com tratamento de erro)
(async () => {
  try {
    console.log('🔧 Aguardando conexão ao MongoDB antes de iniciar bots...');
    // Aguarda um pouco para garantir conexão MongoDB
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const empresas = await Empresa.find();
    console.log(`📊 ${empresas.length} empresa(s) encontrada(s)`);
    
    for (const empresa of empresas) {
      try {
        console.log(`🚀 Tentando iniciar bot para: ${empresa.nome}`);
        await botManager.iniciarBot(empresa);
      } catch (err) {
        console.error(`❌ Erro ao iniciar bot para ${empresa.nome}:`, err.message);
        // Continua com a próxima empresa ao invés de derrubar o servidor
      }
    }
    console.log('✅ Inicialização de bots completada');
  } catch (err) {
    console.error('❌ Erro durante inicialização de bots:', err);
    console.log('⚠️ Servidor continuando sem inicializar bots');
  }
})();
  app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
