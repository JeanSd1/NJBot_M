import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './EmpresaDashboard.css';

export default function EmpresaDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [promptIA, setPromptIA] = useState('');
  const [editandoPrompt, setEditandoPrompt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editandoCredenciais, setEditandoCredenciais] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => {
    carregarEmpresa();
  }, [id]);

  const carregarEmpresa = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('empresaToken');
      
      // Usar o header de autorização com o token da empresa
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await api.get(`/empresas/${id}`, config);
      
      setEmpresa(res.data);
      setPromptIA(res.data.promptIA || '');
      setUsuario(res.data.credenciais?.usuario || '');
    } catch (err) {
      console.error('Erro ao carregar empresa:', err);
      if (err?.response?.status === 401) {
        localStorage.removeItem('empresaToken');
        navigate('/empresa-login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarPrompt = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('empresaToken');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await api.put(`/empresas/${id}/prompt`, { promptIA }, config);
      
      setMessage('✅ Prompt atualizado com sucesso!');
      setEditandoPrompt(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar prompt:', err);
      setMessage('❌ Erro ao salvar prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleSalvarCredenciais = async () => {
    if (novaSenha && novaSenha !== confirmarSenha) {
      alert('As senhas não conferem');
      return;
    }

    if (novaSenha && novaSenha.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      const payload = { usuario };
      if (novaSenha) {
        payload.senha = novaSenha;
      }

      const token = localStorage.getItem('empresaToken');
      await api.post(`/empresas/${id}/credenciais`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('✅ Credenciais atualizadas com sucesso!');
      setEditandoCredenciais(false);
      setNovaSenha('');
      setConfirmarSenha('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      setMessage('❌ Erro ao salvar credenciais: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('empresaToken');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('empresaNome');
    navigate('/empresa-login');
  };

  if (loading) {
    return (
      <div className="empresa-dashboard">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="empresa-dashboard">
        <div className="error">
          <p>Empresa não encontrada</p>
          <button onClick={() => navigate('/empresa-login')}>Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="empresa-dashboard">
      <header className="empresa-header">
        <div className="header-content">
          <h1>YouBot - {empresa.nome}</h1>
          <button className="btn-logout" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <div className="empresa-container">
        <nav className="empresa-nav">
          <button
            className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Informações
          </button>
          <button
            className={`nav-item ${activeTab === 'credenciais' ? 'active' : ''}`}
            onClick={() => setActiveTab('credenciais')}
          >
            Credenciais
          </button>
          <button
            className={`nav-item ${activeTab === 'prompt' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompt')}
          >
            Prompt da IA
          </button>
          <button
            className={`nav-item ${activeTab === 'ia' ? 'active' : ''}`}
            onClick={() => setActiveTab('ia')}
          >
            Config. IA
          </button>
        </nav>

        <div className="empresa-content">
          {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

          {activeTab === 'info' && (
            <section className="tab-section">
              <h2>Informações da Empresa</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Nome</label>
                  <p>{empresa.nome}</p>
                </div>
                <div className="info-item">
                  <label>Telefone</label>
                  <p>{empresa.telefone || 'Não configurado'}</p>
                </div>
                <div className="info-item">
                  <label>Status do Bot</label>
                  <p className={`status ${empresa.botAtivo ? 'ativo' : 'inativo'}`}>
                    {empresa.botAtivo ? '● Ativo' : '● Inativo'}
                  </p>
                </div>
                <div className="info-item">
                  <label>Provedor IA</label>
                  <p>{empresa.iaConfig?.tipo || 'Não configurado'}</p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'credenciais' && (
            <section className="tab-section">
              <h2>Credenciais de Acesso</h2>
              <p className="description">
                Gerencie as credenciais de login do seu painel de controle.
              </p>

              {!editandoCredenciais ? (
                <div className="credenciais-view">
                  <div className="credenciais-display">
                    <div className="credencial-item">
                      <label>Usuário</label>
                      <p>{usuario || 'Não configurado'}</p>
                    </div>
                    <div className="credencial-item">
                      <label>Senha</label>
                      <p>••••••••</p>
                    </div>
                  </div>
                  <button
                    className="btn-editar-credenciais"
                    onClick={() => setEditandoCredenciais(true)}
                  >
                    Editar Credenciais
                  </button>
                </div>
              ) : (
                <div className="credenciais-edit">
                  <div className="form-group">
                    <label>Usuário</label>
                    <input
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="Digite o novo usuário"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nova Senha</label>
                    <input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Deixe em branco para não alterar"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar Senha</label>
                    <input
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                  <div className="button-group">
                    <button
                      className="btn-salvar"
                      onClick={handleSalvarCredenciais}
                      disabled={saving}
                    >
                      {saving ? 'Salvando...' : 'Salvar Credenciais'}
                    </button>
                    <button
                      className="btn-cancelar"
                      onClick={() => {
                        setEditandoCredenciais(false);
                        setNovaSenha('');
                        setConfirmarSenha('');
                      }}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'prompt' && (
            <section className="tab-section">
              <h2>Prompt da IA</h2>
              <p className="description">
                O prompt define como seu assistente de IA se comporta e responde aos clientes.
              </p>

              {!editandoPrompt ? (
                <div className="prompt-view">
                  <div className="prompt-text">
                    {promptIA || 'Nenhum prompt definido'}
                  </div>
                  <button
                    className="btn-editar-prompt"
                    onClick={() => setEditandoPrompt(true)}
                  >
                    Editar Prompt
                  </button>
                </div>
              ) : (
                <div className="prompt-edit">
                  <textarea
                    value={promptIA}
                    onChange={(e) => setPromptIA(e.target.value)}
                    rows="10"
                    placeholder="Digite o prompt para sua IA..."
                  ></textarea>
                  <div className="char-count">{promptIA.length} caracteres</div>
                  <div className="button-group">
                    <button
                      className="btn-salvar"
                      onClick={handleSalvarPrompt}
                      disabled={saving}
                    >
                      {saving ? 'Salvando...' : 'Salvar Prompt'}
                    </button>
                    <button
                      className="btn-cancelar"
                      onClick={() => {
                        setEditandoPrompt(false);
                        setPromptIA(empresa.promptIA);
                      }}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'ia' && (
            <section className="tab-section">
              <h2>Configuração de IA</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Provedor</label>
                  <p>{empresa.iaConfig?.tipo || 'Não configurado'}</p>
                </div>
                <div className="info-item">
                  <label>Modelo</label>
                  <p>{empresa.iaConfig?.modelo || 'Padrão'}</p>
                </div>
                <div className="info-item">
                  <label>Status da API</label>
                  <p className={empresa.iaConfig?.apiKey ? 'ok' : 'warning'}>
                    {empresa.iaConfig?.apiKey ? 'Configurada ✓' : 'Não configurada'}
                  </p>
                </div>
              </div>
              <p className="notice">
                ⚠️ Para alterar a configuração de IA, entre em contato com o administrador.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
