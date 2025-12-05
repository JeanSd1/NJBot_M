import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './GerenciarUsuarios.css';
import './GerenciarUsuarios.css';

export default function GerenciarUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsuarios(res.data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setMessage('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCriarUsuario = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validacoes
    if (!formData.nome || !formData.email || !formData.senha) {
      setMessage('Preencha todos os campos');
      return;
    }

    if (formData.senha.length < 6) {
      setMessage('Senha deve ter minimo 6 caracteres');
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setMessage('As senhas nao coincidem');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/users', {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        role: 'admin'
      });

      setMessage('Usuario criado com sucesso!');
      setFormData({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: ''
      });
      setShowForm(false);
      carregarUsuarios();

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao criar usuario:', err);
      const msg = err?.response?.data?.error || 'Erro ao criar usuario';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletarUsuario = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuario?')) return;

    try {
      await api.delete(`/users/${id}`);
      setMessage('Usuario deletado com sucesso!');
      carregarUsuarios();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao deletar usuario:', err);
      setMessage('Erro ao deletar usuario');
    }
  };

  return (
    <div className="gerenciar-usuarios-container">
      <div className="header">
        <h1>Gerenciar Usuarios</h1>
        <button 
          className="btn-voltar"
          onClick={() => navigate('/empresas')}
        >
          ← Voltar
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="content">
        {/* Secao de criar usuario */}
        {!showForm ? (
          <button 
            className="btn-criar"
            onClick={() => setShowForm(true)}
          >
            + Criar Novo Usuario
          </button>
        ) : (
          <div className="form-card">
            <h2>Criar Novo Usuario</h2>
            <form onSubmit={handleCriarUsuario}>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  name="senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  placeholder="Minimo 6 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirmar Senha</label>
                <input
                  type="password"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  placeholder="Confirme a senha"
                  required
                />
              </div>

              <div className="form-buttons">
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Criando...' : 'Criar Usuario'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de usuarios */}
        <div className="usuarios-list">
          <h2>Usuarios Cadastrados ({usuarios.length})</h2>

          {loading && !usuarios.length ? (
            <p className="loading">Carregando usuarios...</p>
          ) : usuarios.length === 0 ? (
            <p className="empty">Nenhum usuario cadastrado</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Tipo</th>
                    <th>Criado em</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(user => (
                    <tr key={user._id}>
                      <td>{user.nome || '-'}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge badge-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeletarUsuario(user._id)}
                          title="Deletar usuario"
                        >
                          🗑️ Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
