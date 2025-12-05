const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'chavejwtsegura';

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach minimal user info
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    // Add empresaId and empresaNome for client users
    if (decoded.empresaId) req.user.empresaId = decoded.empresaId;
    if (decoded.empresaNome) req.user.empresaNome = decoded.empresaNome;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Permissão negada' });
    next();
  };
}

function isMaster(req) {
  return req.user && req.user.role === 'master';
}

module.exports = { requireAuth, requireRole, isMaster, JWT_SECRET };
