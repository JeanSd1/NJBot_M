import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ConfiguracaoEmpresa.css';

export default function ConfiguracaoEmpresa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [promptIA, setPromptIA] = useState('');
  const [iaType, setIaType] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [claudeModel, setClaudeModel] = useState('claude-3-5-haiku-20241022');
  const [loading, setLoading] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [credencialEmail, setCredencialEmail] = useState('');
  const [credencialSenha, setCredencialSenha] = useState('');
  const [credencialSenhaConfirm, setCredencialSenhaConfirm] = useState('');

  useEffect(() => {
    carregarEmpresa();
  }, [id]);

  const carregarEmpresa = async () => {
    try {
      setLoadingEmpresa(true);
      const res = await api.get(`/empresas/${id}`);
      setEmpresa(res.data);
      setPromptIA(res.data.promptIA || '');
      setIaType(res.data.iaConfig?.tipo || 'gemini');
      setClaudeModel(res.data.iaConfig?.modelo || 'claude-3-5-haiku-20241022');
      // Carrega credenciais da empresa se existirem
      if (res.data.credenciais && res.data.credenciais.length > 0) {
        setCredencialEmail(res.data.credenciais[0].email || '');
        // Não mostramos a senha por segurança, apenas placeholder
      }
    } catch (err) {
      console.error('Erro ao carregar empresa:', err);
      setErrorMessage('Erro ao carregar dados da empresa');
    } finally {
      setLoadingEmpresa(false);
    }
  };

  const handlePromptSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await api.put(`/empresas/${id}/prompt`, { promptIA });
      setSuccessMessage('✅ Prompt atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar prompt:', err);
      const msg = err?.response?.data?.error || 'Erro ao salvar prompt';
      setErrorMessage(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleIAConfigSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await api.put(`/empresas/${id}/configurar-ia`, {
        tipo: iaType,
        apiKey: apiKey || undefined,
        modelo: iaType === 'claude' ? claudeModel : undefined
      });
      setSuccessMessage('✅ Configuração de IA atualizada com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
      // Limpa o campo de API key após salvar
      setApiKey('');
    } catch (err) {
      console.error('Erro ao salvar configuração de IA:', err);
      const msg = err?.response?.data?.error || 'Erro ao salvar configuração de IA';
      setErrorMessage(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCredencialSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Validações
    if (!credencialEmail || !credencialEmail.includes('@')) {
      setErrorMessage('❌ Email inválido');
      setLoading(false);
      return;
    }

    if (credencialSenha && credencialSenha.length < 6) {
      setErrorMessage('❌ Senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    if (credencialSenha && credencialSenha !== credencialSenhaConfirm) {
      setErrorMessage('❌ As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      await api.put(`/empresas/${id}/credenciais`, {
        email: credencialEmail,
        senha: credencialSenha || undefined
      });
      setSuccessMessage('✅ Credenciais do cliente atualizadas com sucesso!');
      setCredencialSenha('');
      setCredencialSenhaConfirm('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar credenciais:', err);
      const msg = err?.response?.data?.error || 'Erro ao salvar credenciais';
      setErrorMessage(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingEmpresa) {
    return (
      <div className="config-container">
        <div className="config-box">
          <p>Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="config-container">
        <div className="config-box">
          <p>Empresa não encontrada</p>
          <button onClick={() => navigate('/empresas')} className="btn-voltar">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="config-container">
      <button onClick={() => navigate('/empresas')} className="btn-voltar">
        ← Voltar
      </button>

      <div className="config-box">
        <h1>Configurações - {empresa.nome}</h1>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

        {/* Seção de Prompt */}
        <section className="config-section">
          <h2>Editar Prompt da IA</h2>
          <p className="config-description">
            O prompt define o comportamento e personalidade do seu assistente de IA.
          </p>

          <form onSubmit={handlePromptSave}>
            <textarea
              value={promptIA}
              onChange={(e) => setPromptIA(e.target.value)}
              rows="8"
              placeholder="Digite as instruções para sua IA aqui..."
              className="textarea-prompt"
            ></textarea>

            <div className="char-count">
              {promptIA.length} caracteres
            </div>

            <button
              type="submit"
              className="btn-salvar"
              disabled={loading || !promptIA.trim()}
            >
              {loading ? 'Salvando...' : 'Salvar Prompt'}
            </button>
          </form>
        </section>

        {/* Seção de Configuração de IA */}
        <section className="config-section">
          <h2>Configuração da IA</h2>
          <p className="config-description">
            Escolha o provedor de IA e configure suas credenciais.
          </p>

          <form onSubmit={handleIAConfigSave}>
            <div className="ia-options-config">
              <label className={iaType === 'gemini' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="ia"
                  value="gemini"
                  checked={iaType === 'gemini'}
                  onChange={(e) => setIaType(e.target.value)}
                />
                <span>Google Gemini</span>
                <p>Modelo avançado do Google: rápido e preciso</p>
              </label>

              <label className={iaType === 'gpt' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="ia"
                  value="gpt"
                  checked={iaType === 'gpt'}
                  onChange={(e) => setIaType(e.target.value)}
                />
                <span>OpenAI GPT</span>
                <p>Modelo versátil da OpenAI com amplo conhecimento</p>
              </label>

              <label className={iaType === 'claude' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="ia"
                  value="claude"
                  checked={iaType === 'claude'}
                  onChange={(e) => setIaType(e.target.value)}
                />
                <span>Anthropic Claude</span>
                <p>IA especializada em facilitação e respostas detalhadas</p>
              </label>

              <label className={iaType === 'publicai' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="ia"
                  value="publicai"
                  checked={iaType === 'publicai'}
                  onChange={(e) => setIaType(e.target.value)}
                />
                <span>Public AI</span>
                <p>Modelo open source de alta performance</p>
              </label>
            </div>

            {iaType === 'claude' && (
              <div className="claude-model-select">
                <label>Modelo Claude:</label>
                <select
                  value={claudeModel}
                  onChange={(e) => setClaudeModel(e.target.value)}
                >
                  <option value="claude-3-5-haiku-20241022">
                    Claude 3.5 Haiku (Recomendado - rápido e econômico)
                  </option>
                  <option value="claude-3-5-sonnet-20241022">
                    Claude 3.5 Sonnet (Mais potente)
                  </option>
                  <option value="claude-3-opus-20240229">
                    Claude 3 Opus (Mais avançado)
                  </option>
                </select>
              </div>
            )}

            {iaType !== 'publicai' && (
              <div className="api-key-section">
                <label>Chave de API {iaType.toUpperCase()}:</label>
                <input
                  type="password"
                  placeholder={`Digite sua chave de API do ${iaType.toUpperCase()} (deixe em branco para manter a atual)`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <small>
                  Por segurança, as chaves de API não são exibidas. Digite uma nova apenas para atualizar.
                </small>
              </div>
            )}

            <button
              type="submit"
              className="btn-salvar"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Configuração de IA'}
            </button>
          </form>
        </section>

        {/* Seção de Credenciais do Cliente */}
        <section className="config-section">
          <h2>Credenciais do Cliente</h2>
          <p className="config-description">
            Configure o email e senha que o cliente usará para acessar sua empresa.
          </p>

          <form onSubmit={handleCredencialSave}>
            <div className="form-group">
              <label htmlFor="credencialEmail">Email do Cliente:</label>
              <input
                id="credencialEmail"
                type="email"
                value={credencialEmail}
                onChange={(e) => setCredencialEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="credencialSenha">Nova Senha (deixe em branco para manter):</label>
              <input
                id="credencialSenha"
                type="password"
                value={credencialSenha}
                onChange={(e) => setCredencialSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {credencialSenha && (
              <div className="form-group">
                <label htmlFor="credencialSenhaConfirm">Confirmar Senha:</label>
                <input
                  id="credencialSenhaConfirm"
                  type="password"
                  value={credencialSenhaConfirm}
                  onChange={(e) => setCredencialSenhaConfirm(e.target.value)}
                  placeholder="Confirme a senha"
                />
              </div>
            )}

            <button
              type="submit"
              className="btn-salvar"
              disabled={loading || !credencialEmail.trim()}
            >
              {loading ? 'Salvando...' : 'Salvar Credenciais do Cliente'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
