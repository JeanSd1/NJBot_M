// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Empresa = require('./models/Empresa');
const User = require('./models/User');
const botManager = require('./botManager');
const { statusBots } = require('./botManager');

const { requireAuth, requireRole, isMaster } = require('./middleware/auth');

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

const ADMIN_EMAIL = process.env.LOGIN_FIXO_EMAIL;
const ADMIN_PASSWORD = process.env.LOGIN_FIXO_SENHA;

// --- Rotas de Autenticação (Users) ---

// Login: verifica user no banco (email + senha). Se não existir, tenta credencial fixa (compatibilidade)
// Também verifica credenciais de empresa (cliente acessando sua própria empresa)
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    // 1. Tentar login como usuário do sistema (admin/master)
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (user) {
      const valid = await user.validatePassword(senha);
      if (!valid) return res.status(401).json({ error: 'Email ou senha inválidos' });
      const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token, nome: user.nome || user.email, email: user.email, role: user.role });
    }

    // 2. Tentar login como cliente usando credenciais da empresa (novo modelo)
    const empresa = await Empresa.findOne({ 'credenciais.usuario': email?.toLowerCase() });
    if (empresa && empresa.credenciais && empresa.credenciais.usuario === email?.toLowerCase()) {
      const bcrypt = require('bcrypt');
      const senhaHash = empresa.credenciais.senhaHash;
      if (senhaHash && await bcrypt.compare(senha, senhaHash)) {
        // Cliente encontrado - retornar token com acesso à empresa
        const token = jwt.sign({ 
          empresaId: empresa._id.toString(), 
          email: email?.toLowerCase(), 
          role: 'client',
          empresaNome: empresa.nome
        }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ token, nome: empresa.nome, email: email?.toLowerCase(), role: 'client', empresaId: empresa._id.toString() });
      }
    }

    // 3. Fallback para credenciais fixas em .env (antigo comportamento)
    if (email === ADMIN_EMAIL && senha === ADMIN_PASSWORD) {
      // garante que exista um usuário master correspondente
      let master = await User.findOne({ email: ADMIN_EMAIL });
      if (!master) {
        master = new User({ email: ADMIN_EMAIL, nome: 'Administrador', role: 'master' });
        await master.setPassword(ADMIN_PASSWORD);
        await master.save();
      }
      const token = jwt.sign({ id: master._id.toString(), email: master.email, role: master.role }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token, nome: master.nome || master.email, email: master.email, role: master.role });
    }

    return res.status(401).json({ error: 'Email ou senha inválidos' });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno no login' });
  }
});

// Criar usuário (master-only)
app.post('/api/users', requireAuth, requireRole('master'), async (req, res) => {
  try {
    const { nome, email, senha, role } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'Usuário já existe' });
    const user = new User({ nome, email: email.toLowerCase(), role: role || 'client' });
    await user.setPassword(senha);
    await user.save();
    res.status(201).json({ message: 'Usuário criado', user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Listar usuários (master-only)
app.get('/api/users', requireAuth, requireRole('master'), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Atualizar usuário (master-only)
app.put('/api/users/:id', requireAuth, requireRole('master'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, role, senha } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (nome) user.nome = nome;
    if (role) user.role = role;
    if (senha) await user.setPassword(senha);
    await user.save();
    res.json({ message: 'Usuário atualizado' });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário (master-only)
app.delete('/api/users/:id', requireAuth, requireRole('master'), async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'Usuário deletado' });
  } catch (err) {
    console.error('Erro ao deletar usuário:', err);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// Rota para ver perfil atual
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});


// --- Endpoints de Login e Credenciais da Empresa ---

// Criar ou atualizar credenciais da empresa (durante cadastro)
app.post('/api/empresas/:id/credenciais', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, senha } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    if (!usuario || !senha) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    // Permissão: master ou owner
    const isOwner = empresa.owner && empresa.owner.toString() === req.user.id;
    if (req.user.role !== 'master' && !isOwner) {
      return res.status(403).json({ error: 'Permissão negada' });
    }

    // Garantir que credenciais exista como objeto
    if (!empresa.credenciais) {
      empresa.credenciais = {};
    }

    // Atualizar usuário e senha
    empresa.credenciais.usuario = usuario;
    await empresa.definirSenha(senha);
    await empresa.save();

    console.log(`✅ Credenciais salvas para empresa ${empresa.nome}: usuário=${usuario}`);
    res.json({ message: 'Credenciais atualizadas com sucesso', empresaId: empresa._id });
  } catch (error) {
    console.error('❌ Erro ao atualizar credenciais:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar credenciais.' });
  }
});

// Criar credenciais sem autenticação (para cadastro inicial)
app.post('/api/empresas-setup/:id/credenciais', async (req, res) => {
  try {
    console.log('📥 Requisição recebida em /api/empresas-setup/:id/credenciais');
    const { id } = req.params;
    const { usuario, senha } = req.body;

    console.log(`🔐 Tentando criar credenciais para empresa: ${id}`);
    console.log(`   Usuário recebido: ${usuario}`);
    console.log(`   Senha length: ${senha ? senha.length : 0}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ ID inválido:', id);
      return res.status(400).json({ error: 'ID inválido' });
    }

    if (!usuario || !senha) {
      console.error('❌ Usuário ou senha não fornecidos');
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    if (senha.length < 6) {
      console.error('❌ Senha muito curta');
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    console.log('🔍 Buscando empresa no banco...');
    const empresa = await Empresa.findById(id);
    if (!empresa) {
      console.error('❌ Empresa não encontrada:', id);
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }
    console.log(`✅ Empresa encontrada: ${empresa.nome}`);

    // Garantir que credenciais exista como objeto
    if (!empresa.credenciais) {
      empresa.credenciais = {};
      console.log('📝 Inicializando objeto credenciais');
    }

    // Atualizar usuário e senha
    empresa.credenciais.usuario = usuario;
    console.log('🔐 Chamando definirSenha...');
    await empresa.definirSenha(senha);
    console.log('✅ definirSenha completado');
    
    console.log('💾 Salvando empresa com credenciais...');
    await empresa.save();
    console.log('✅ Empresa salva');

    console.log(`✅ Credenciais criadas com sucesso para empresa ${empresa.nome}: usuário=${usuario}`);
    res.json({ 
      message: 'Credenciais criadas com sucesso',
      empresa: { _id: empresa._id, nome: empresa.nome, credenciais: { usuario: empresa.credenciais.usuario } }
    });
  } catch (error) {
    console.error('❌ Erro ao criar credenciais:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message || 'Erro ao criar credenciais.' });
  }
});

// Login da empresa (sem autenticação de master/owner)
app.post('/api/empresas/login', async (req, res) => {
  try {
    const { usuario, senha, empresaId } = req.body;
    console.log('🔐 Tentativa de login: usuario=' + usuario + ', empresaId=' + empresaId);

    if (!usuario || !senha || !empresaId) {
      console.error('❌ Dados incompletos fornecidos');
      return res.status(400).json({ error: 'Usuário, senha e ID da empresa são obrigatórios' });
    }

    if (!mongoose.Types.ObjectId.isValid(empresaId)) {
      console.error('❌ ID da empresa inválido:', empresaId);
      return res.status(400).json({ error: 'ID da empresa inválido' });
    }

    console.log('📖 Buscando empresa no banco...');
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
      console.error('❌ Empresa não encontrada:', empresaId);
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }
    console.log('✅ Empresa encontrada:', empresa.nome);

    // Verificar credenciais
    console.log('🔍 Verificando credenciais da empresa...');
    if (!empresa.credenciais || !empresa.credenciais.usuario) {
      console.error('❌ Credenciais não configuradas para esta empresa');
      return res.status(400).json({ error: 'Esta empresa não possui credenciais configuradas' });
    }

    console.log('👤 Usuário no BD:', empresa.credenciais.usuario);
    console.log('👤 Usuário fornecido:', usuario);
    if (empresa.credenciais.usuario !== usuario) {
      console.error('❌ Usuário incorreto');
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }
    console.log('✅ Usuário correto');

    console.log('🔐 Validando senha...');
    const senhaValida = await empresa.validarSenha(senha);
    if (!senhaValida) {
      console.error('❌ Senha incorreta para usuário', usuario);
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }
    console.log('✅ Senha válida!');

    // Gerar token JWT para a empresa
    const token = jwt.sign(
      { 
        id: empresa._id.toString(), 
        tipo: 'empresa', 
        usuario: empresa.credenciais.usuario,
        nome: empresa.nome 
      }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    res.json({ 
      token, 
      empresaId: empresa._id.toString(), 
      nome: empresa.nome,
      usuario: empresa.credenciais.usuario 
    });
  } catch (error) {
    console.error('❌ Erro ao fazer login da empresa:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// --- Rotas de Gerenciamento de Empresas (CRUD) ---

app.post('/api/empresas', requireAuth, async (req, res) => {
    const { 
        nome, promptIA, telefone, ativo, 
        msgBoasVindas, timeoutHumanoMinutos, msgFechado, horariosSemana,
        iaConfig  // Aceita configuração de IA (tipo, apiKey, modelo)
    } = req.body;
    
    try {
      const empresaExistente = await Empresa.findOne({ nome });
      if (empresaExistente) return res.status(400).json({ error: 'Empresa já existe.' });

        const ownerId = (req.user && req.user.role === 'master' && req.body.owner) ? req.body.owner : (req.user && req.user.id) || null;
        const novaEmpresa = new Empresa({ 
          nome, promptIA, telefone, botAtivo: ativo,
          msgBoasVindas, timeoutHumanoMinutos, msgFechado, horariosSemana,
          owner: ownerId,
          iaConfig: iaConfig || { tipo: 'gemini', apiKey: null }  // Padrão Gemini se não informado
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

app.get('/api/empresas', requireAuth, async (req, res) => {
  try {
    let empresas;
    if (req.user && req.user.role === 'master') {
      empresas = await Empresa.find();
    } else {
      empresas = await Empresa.find({ owner: req.user.id });
    }
    return res.json(empresas);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao listar empresas.' });
  }
});

// Rota para buscar uma única empresa por ID
app.get('/api/empresas/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
      const empresa = await Empresa.findById(id);
      // Log só após garantir que empresa existe
      if (empresa) {
        console.log('DEBUG empresaId:', empresa._id.toString(), '| req.user:', req.user);
      }
      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada.' });
      }

      // Permissão: master, owner ou client da própria empresa
      const isOwner = empresa.owner && empresa.owner.toString() === req.user.id;
      const isClient = req.user.role === 'client' && req.user.empresaId === empresa._id.toString();
      if (req.user.role !== 'master' && !isOwner && !isClient) {
        return res.status(403).json({ error: 'Permissão negada' });
      }

      return res.json(empresa);
    } catch (error) {
      console.error('❌ Erro ao buscar empresa por ID:', error);
      return res.status(500).json({ error: 'Erro interno ao buscar empresa.' });
    }
});


app.put('/api/empresas/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { 
      nome, promptIA, telefone, botAtivo, 
      msgBoasVindas, timeoutHumanoMinutos, msgFechado, horariosSemana,
      iaConfig  // Permite atualizar configuração de IA
  } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    const empresaAntiga = await Empresa.findById(id);
    if (!empresaAntiga) return res.status(404).json({ error: 'Empresa não encontrada.' });

    // Permissão: master ou owner
    const isOwner = empresaAntiga.owner && empresaAntiga.owner.toString() === req.user.id;
    if (req.user.role !== 'master' && !isOwner) return res.status(403).json({ error: 'Permissão negada' });

    const empresaAtualizada = await Empresa.findByIdAndUpdate(
      id,
      { 
          nome, promptIA, telefone, botAtivo, 
          msgBoasVindas, timeoutHumanoMinutos, msgFechado, horariosSemana,
          iaConfig: iaConfig || empresaAntiga.iaConfig  // Mantém config anterior se não informada
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

app.delete('/api/empresas/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    const empresa = await Empresa.findById(id);
    if (!empresa) return res.status(404).json({ message: 'Empresa não encontrada' });

    const isOwner = empresa.owner && empresa.owner.toString() === req.user.id;
    if (req.user.role !== 'master' && !isOwner) return res.status(403).json({ error: 'Permissão negada' });

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

app.put('/api/empresas/:id/toggle-bot', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[TOGGLE] Requisição para alternar bot id=${id}, body=`, req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    const empresa = await Empresa.findById(id);
    if (!empresa) return res.status(404).json({ message: 'Empresa não encontrada' });

    const isOwner = empresa.owner && empresa.owner.toString() === req.user.id;
    if (req.user.role !== 'master' && !isOwner) return res.status(403).json({ error: 'Permissão negada' });

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
    // Permissão: master ou owner
    if (!req.headers.authorization) return res.status(401).json({ error: 'Token não fornecido' });
    try {
      const token = req.headers.authorization.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      const isOwner = empresa.owner && empresa.owner.toString() === decoded.id;
      if (decoded.role !== 'master' && !isOwner) return res.status(403).json({ error: 'Permissão negada' });
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // ✅ CORREÇÃO: Usar o ID como chave (botManager.js usa o ID)
    const idString = empresa._id.toString();
    const qr = botManager.getQRCode(idString); 
    
    if (qr) return res.json({ qrCode: qr });
    else return res.status(204).json();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar QR code.' });
  }
});

// Rota para GERAR/REGENERAR QR (força reinicialização)
app.post('/api/qr-regenerar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    const empresa = await Empresa.findById(id);
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

    // Permissão: master ou owner
    if (!req.headers.authorization) return res.status(401).json({ error: 'Token não fornecido' });
    try {
      const token = req.headers.authorization.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      const isOwner = empresa.owner && empresa.owner.toString() === decoded.id;
      if (decoded.role !== 'master' && !isOwner) return res.status(403).json({ error: 'Permissão negada' });
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Reinicia o bot para gerar novo QR
    await botManager.reiniciarBot(empresa);

    // Aguarda mais tempo para garantir que o QR foi gerado completamente
    await new Promise(resolve => setTimeout(resolve, 5000));

    const idString = empresa._id.toString();
    const qrCode = botManager.getQRCode(idString);
    
    if (qrCode) {
      return res.json({ qrCode });
    } else {
      return res.status(500).json({ error: 'Erro ao gerar QR code. Tente novamente em alguns segundos.' });
    }

  } catch (error) {
    console.error('Erro ao regenerar QR:', error);
    res.status(500).json({ error: 'Erro ao regenerar QR code.' });
  }
});

app.post('/api/reiniciar-bot/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });

    const empresa = await Empresa.findById(id);
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

    // Permissão: master ou owner
    if (!req.headers.authorization) return res.status(401).json({ error: 'Token não fornecido' });
    try {
      const token = req.headers.authorization.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      const isOwner = empresa.owner && empresa.owner.toString() === decoded.id;
      if (decoded.role !== 'master' && !isOwner) return res.status(403).json({ error: 'Permissão negada' });
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }

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

// Endpoint para enviar mensagem via API (bot envia mensagem para cliente)
app.post('/api/empresas/:id/send-message', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { to, text } = req.body; // 'to' pode ser número ou jid

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });
    if (!to || !text) return res.status(400).json({ error: 'Parâmetros obrigatórios: to, text' });

    const empresa = await Empresa.findById(id);
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

    // Permissão: master ou owner
    const isOwner = empresa.owner && empresa.owner.toString() === req.user.id;
    if (req.user.role !== 'master' && !isOwner) return res.status(403).json({ error: 'Permissão negada' });

    const empresaId = empresa._id.toString();
    const sock = botManager.bots[empresaId];
    if (!sock) return res.status(400).json({ error: 'Bot não conectado para esta empresa. Gere/escaneie o QR e aguarde conexão.' });

    // Normaliza telefone para JID quando necessário
    let jid = to;
    if (!jid.includes('@')) {
      // remove caracteres não-numéricos
      const apenasNums = to.replace(/\D/g, '');
      jid = `${apenasNums}@s.whatsapp.net`;
    }

    try {
      await sock.sendMessage(jid, { text });
      return res.json({ ok: true, message: 'Mensagem enviada' });
    } catch (err) {
      console.error('Erro ao enviar mensagem via bot:', err);
      return res.status(500).json({ error: 'Erro ao enviar mensagem via bot', detail: err.message || err.toString() });
    }

  } catch (error) {
    console.error('Erro no endpoint send-message:', error);
    return res.status(500).json({ error: 'Erro interno ao enviar mensagem.' });
  }
});


app.get('/api/bots/status', (req, res) => {
  res.json(statusBots);
});

app.get('/', (req, res) => {
  res.send('🤖 API do YouBot está rodando!');
});


// --- Inicialização do Servidor ---

// Iniciar Express PRIMEIRO, depois iniciar bots em background
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});

// Iniciar bots em background (não bloqueia o Express)
(async () => {
  try {
    console.log('🔧 Aguardando conexão ao MongoDB antes de iniciar bots...');
    // Aguarda um pouco para garantir conexão MongoDB
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Garantir que o usuário master (do .env) exista
    try {
      if (ADMIN_EMAIL && ADMIN_PASSWORD) {
        let master = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
        if (!master) {
          master = new User({ email: ADMIN_EMAIL.toLowerCase(), nome: 'Administrador', role: 'master' });
          await master.setPassword(ADMIN_PASSWORD);
          await master.save();
          console.log('Usuário master criado a partir do .env');
        }
      }
    } catch (errMaster) {
      console.error('Erro ao garantir usuário master:', errMaster);
    }

    const empresas = await Empresa.find();
    console.log(`📊 ${empresas.length} empresa(s) encontrada(s)`);
    
    // ⏸️  TEMPORARIAMENTE DESABILITADO PARA TESTE
    /*
    for (const empresa of empresas) {
      try {
        console.log(`🚀 Tentando iniciar bot para: ${empresa.nome}`);
        await botManager.iniciarBot(empresa);
      } catch (err) {
        console.error(`❌ Erro ao iniciar bot para ${empresa.nome}:`, err.message);
        // Continua com a próxima empresa ao invés de derrubar o servidor
      }
    }
    */
    console.log('✅ Inicialização de bots pulada (modo teste)');





// Endpoint para editar o prompt da IA
app.put('/api/empresas/:id/prompt', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { promptIA } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    if (!promptIA || promptIA.trim() === '') {
      return res.status(400).json({ error: 'Prompt não pode ser vazio' });
    }

    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    // Permissão: master ou owner
    const isOwner = empresa.owner && empresa.owner.toString() === req.user.id;
    if (req.user.role !== 'master' && !isOwner) {
      return res.status(403).json({ error: 'Permissão negada' });
    }

    // Atualiza o prompt
    empresa.promptIA = promptIA;
    await empresa.save();

    // Atualiza o arquivo de prompt também
    const pasta = path.join(__dirname, 'bots', id);
    if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
    fs.writeFileSync(path.join(pasta, 'prompt.txt'), promptIA);

    res.json({ 
      message: 'Prompt atualizado com sucesso',
      promptIA: empresa.promptIA
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar prompt:', error);
    res.status(500).json({ error: 'Erro ao atualizar prompt.' });
  }
});

// Atualizar credenciais do cliente
app.put('/api/empresas/:id/credenciais', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, senha } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Atualiza credenciais como objeto
    try {
      if (!empresa.credenciais || typeof empresa.credenciais !== 'object' || Array.isArray(empresa.credenciais)) {
        empresa.credenciais = {};
      }
      empresa.credenciais.usuario = email.toLowerCase();
      if (senha) {
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash(senha, 10);
        empresa.credenciais.senhaHash = hash;
      }
      await empresa.save();
    } catch (errInterno) {
      console.error('❌ Erro interno ao salvar credenciais:', errInterno);
      return res.status(500).json({ error: 'Erro interno ao salvar credenciais.', details: errInterno.message });
    }

    res.json({ 
      message: 'Credenciais do cliente atualizadas com sucesso',
      credenciais: { usuario: empresa.credenciais.usuario }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar credenciais:', error);
    res.status(500).json({ error: 'Erro ao atualizar credenciais.' });
  }
});

app.post('/api/empresas/:id/configurar-ia', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, apiKey, modelo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada.' });
    }

    // Permissão: master ou owner
    const isOwner = empresa.owner && empresa.owner.toString() === req.user.id;
    if (req.user.role !== 'master' && !isOwner) {
      return res.status(403).json({ error: 'Permissão negada' });
    }

    // Valida provider
    const provedoresValidos = ['gemini', 'gpt', 'claude', 'publicai'];
    if (tipo && !provedoresValidos.includes(tipo)) {
      return res.status(400).json({ error: `Provider inválido. Use: ${provedoresValidos.join(', ')}` });
    }

    // Atualiza a configuração de IA
    empresa.iaConfig = {
      tipo: tipo || empresa.iaConfig?.tipo || 'gemini',
      apiKey: apiKey || empresa.iaConfig?.apiKey,
      modelo: modelo || empresa.iaConfig?.modelo || 'claude-3-5-haiku-20241022'
    };

    await empresa.save();

    res.json({ 
      message: 'Configuração de IA atualizada com sucesso',
      empresa 
    });
  } catch (error) {
    console.error('❌ Erro ao configurar IA:', error);
    res.status(500).json({ error: 'Erro ao configurar IA.' });
  }
});

// Endpoint de teste: enviar mensagem para testar IA
app.post('/api/test-message', async (req, res) => {
  try {
    const { empresaId, mensagem } = req.body;

    if (!empresaId || !mensagem) {
      return res.status(400).json({ error: 'empresaId e mensagem são obrigatórios' });
    }

    const handleMensagem = require('./handlers/chatbot');
    const resposta = await handleMensagem(empresaId, mensagem);

    res.json({ resposta: resposta.resposta });
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem.' });
  }
});

    console.log('✅ Inicialização de bots completada');
  } catch (err) {
    console.error('❌ Erro durante inicialização de bots:', err);
    console.log('⚠️ Servidor continuando sem inicializar bots');
  }
})();
