import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListaEmpresas.css';
import api from '../services/api';

export default function ListaEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [busca, setBusca] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [editandoIA, setEditandoIA] = useState(false);
  const [iaConfig, setIaConfig] = useState({ tipo: 'gemini', apiKey: '', modelo: '' });
  const [carregando, setCarregando] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendText, setSendText] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get('/empresas');
        if (!mounted) return;
        setEmpresas(res.data || []);
      } catch (err) {
        if (err?.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        } else {
          console.error('Erro ao carregar empresas', err);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, [navigate]);

  const handleSelecionarEmpresa = async (empresa) => {
    setEmpresaSelecionada(empresa);
    setEditandoIA(false);
    setIaConfig(empresa.iaConfig || { tipo: 'gemini', apiKey: '', modelo: 'claude-3-5-haiku-20241022' });
    
    // Carregar QR
    try {
      const res = await api.get(`/qr/${empresa._id}`);
      if (res.status === 200 && res.data?.qrCode) {
        setQrCode(res.data.qrCode);
      }
    } catch (err) {
      setQrCode(null);
    }
  };

  const handleToggleBotStatus = async () => {
    setCarregando(true);
    try {
      const res = await api.put(`/empresas/${empresaSelecionada._id}/toggle-bot`);
      const empresasAtualizado = empresas.map(e => 
        e._id === empresaSelecionada._id ? { ...e, botAtivo: res.data.botAtivo } : e
      );
      setEmpresas(empresasAtualizado);
      const empresa = empresasAtualizado.find(e => e._id === empresaSelecionada._id);
      setEmpresaSelecionada(empresa);
      alert(`Bot ${res.data.botAtivo ? 'ativado' : 'desativado'}!`);
    } catch (err) {
      alert('Erro ao alternar status: ' + (err?.response?.data?.message || err.message));
    } finally {
      setCarregando(false);
    }
  };

  const handleFecharPainel = () => {
    setEmpresaSelecionada(null);
    setQrCode(null);
    setEditandoIA(false);
  };

  const handleSalvarIA = async () => {
    if (!iaConfig.apiKey.trim()) {
      alert('Por favor, insira a chave de API');
      return;
    }

    setCarregando(true);
    try {
      const res = await api.post(`/empresas/${empresaSelecionada._id}/configurar-ia`, iaConfig);
      const empresasAtualizado = empresas.map(e => 
        e._id === empresaSelecionada._id ? res.data.empresa : e
      );
      setEmpresas(empresasAtualizado);
      setEmpresaSelecionada(res.data.empresa);
      setEditandoIA(false);
      alert('Configuração de IA salva com sucesso!');
    } catch (err) {
      alert('Erro ao salvar: ' + (err?.response?.data?.error || err.message));
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarQR = async () => {
    setCarregando(true);
    try {
      const res = await api.post(`/qr-regenerar/${empresaSelecionada._id}`);
      if (res.data?.qrCode) {
        setQrCode(res.data.qrCode);
        alert('QR Code regenerado!');
      }
    } catch (err) {
      alert('Erro ao gerar QR: ' + (err?.response?.data?.error || err.message));
    } finally {
      setCarregando(false);
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm('Confirmar exclusão?')) return;
    try {
      await api.delete(`/empresas/${id}`);
      setEmpresas(empresas.filter(e => e._id !== id));
      if (empresaSelecionada?._id === id) {
        handleFecharPainel();
      }
      alert('Empresa excluída!');
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  const handleEnviarMensagem = async () => {
    if (!sendTo || !sendText) return alert('Preencha telefone e mensagem');
    setSending(true);
    try {
      const res = await api.post(`/empresas/${empresaSelecionada._id}/send-message`, { to: sendTo, text: sendText });
      if (res.data?.ok) {
        alert('Mensagem enviada com sucesso');
        setSendText('');
      } else {
        alert('Resposta: ' + JSON.stringify(res.data));
      }
    } catch (err) {
      alert('Erro ao enviar mensagem: ' + (err?.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  const empresasFiltradas = empresas.filter(e =>
    (e.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (e.telefone || '').includes(busca)
  );

  return (
    <div className="lista-empresas-v2">
      <header className="header-v2">
        <h1>Empresas</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/cadastro')} className="btn-novo">+ Nova Empresa</button>
          <button onClick={() => {
            localStorage.removeItem('token');
            navigate('/');
          }} className="btn-sair">Sair</button>
        </div>
      </header>

      <div className="container-v2">
        {/* COLUNA ESQUERDA - LISTA */}
        <div className="lista-coluna">
          <div className="busca-container">
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="busca-input"
            />
          </div>

          <div className="empresas-lista">
            {empresasFiltradas.length > 0 ? (
              empresasFiltradas.map(empresa => (
                <div
                  key={empresa._id}
                  className={`empresa-item ${empresaSelecionada?._id === empresa._id ? 'ativo' : ''}`}
                  onClick={() => handleSelecionarEmpresa(empresa)}
                >
                  <div className="item-header">
                    <h3>{empresa.nome}</h3>
                    <span className={`status-badge ${empresa.botAtivo ? 'ativo' : 'inativo'}`}>
                      {empresa.botAtivo ? '● Ativo' : '● Inativo'}
                    </span>
                  </div>
                  <p className="item-info">{empresa.telefone || 'Sem telefone'}</p>
                  <p className="item-info">IA: {empresa.iaConfig?.tipo || 'não configurada'}</p>
                </div>
              ))
            ) : (
              <div className="empty-list">
                <p>Nenhuma empresa encontrada</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA - PAINEL DE EDIÇÃO */}
        <div className={`painel-coluna ${empresaSelecionada ? 'aberto' : ''}`}>
          {empresaSelecionada ? (
            <div className="painel-conteudo">
              <div className="painel-header">
                <h2>{empresaSelecionada.nome}</h2>
                <button className="btn-fechar" onClick={handleFecharPainel}>✕</button>
              </div>

              {/* SEÇÃO STATUS DO BOT */}
              <section className="secao-status">
                <h3>Status do Bot</h3>
                <div className="status-info">
                  <p>Atual: 
                    <span className={`status-badge ${empresaSelecionada.botAtivo ? 'ativo' : 'inativo'}`}>
                      {empresaSelecionada.botAtivo ? '● Ativo' : '● Inativo'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleToggleBotStatus}
                  className={`btn-toggle-status ${empresaSelecionada.botAtivo ? 'btn-desativar' : 'btn-ativar'}`}
                  disabled={carregando}
                >
                  {carregando ? 'Alterando...' : (empresaSelecionada.botAtivo ? 'Desativar Bot' : 'Ativar Bot')}
                </button>
              </section>

              {/* SEÇÃO QR CODE */}
              <section className="secao-qr">
                <h3>WhatsApp QR Code</h3>
                {qrCode ? (
                  <div className="qr-container">
                    <img src={qrCode} alt="QR Code" className="qr-img" />
                  </div>
                ) : (
                  <div className="qr-vazio">Sem QR Code</div>
                )}
                <button
                  onClick={handleGerarQR}
                  className="btn-gerar-qr"
                  disabled={carregando}
                >
                  {carregando ? 'Gerando...' : 'Gerar QR'}
                </button>
              </section>

              {/* SEÇÃO INFORMAÇÕES */}
              <section className="secao-info">
                <h3>Informações</h3>
                <div className="info-row">
                  <label>Telefone:</label>
                  <span>{empresaSelecionada.telefone || '-'}</span>
                </div>
                <div className="info-row">
                  <label>Status:</label>
                  <span>{empresaSelecionada.botAtivo ? 'Ativo' : 'Inativo'}</span>
                </div>
                <div className="info-row">
                  <label>Criado em:</label>
                  <span>{new Date(empresaSelecionada.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </section>

              {/* SEÇÃO CONFIGURAÇÃO DE IA */}
              <section className="secao-ia">
                <div className="secao-header">
                  <h3>Configuração de IA</h3>
                  {!editandoIA && (
                    <button
                      onClick={() => setEditandoIA(true)}
                      className="btn-editar"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {editandoIA ? (
                  <div className="form-ia">
                    <div className="form-group">
                      <label>Provedor de IA</label>
                      <select
                        value={iaConfig.tipo || 'gemini'}
                        onChange={(e) => setIaConfig({ ...iaConfig, tipo: e.target.value })}
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="gpt">OpenAI (GPT)</option>
                        <option value="claude">Anthropic Claude</option>
                        <option value="publicai">Public AI</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Chave de API</label>
                      <input
                        type="password"
                        placeholder="Cole sua chave de API aqui..."
                        value={iaConfig.apiKey || ''}
                        onChange={(e) => setIaConfig({ ...iaConfig, apiKey: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Modelo (opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: claude-3-5-haiku-20241022"
                        value={iaConfig.modelo || ''}
                        onChange={(e) => setIaConfig({ ...iaConfig, modelo: e.target.value })}
                      />
                    </div>

                    <div className="form-actions">
                      <button
                        onClick={handleSalvarIA}
                        className="btn-salvar"
                        disabled={carregando}
                      >
                        {carregando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        onClick={() => setEditandoIA(false)}
                        className="btn-cancelar"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="info-ia">
                    <div className="info-row">
                      <label>Provedor:</label>
                      <span>{empresaSelecionada.iaConfig?.tipo || 'não configurado'}</span>
                    </div>
                    <div className="info-row">
                      <label>Modelo:</label>
                      <span>{empresaSelecionada.iaConfig?.modelo || '-'}</span>
                    </div>
                    <div className="info-row">
                      <label>Chave:</label>
                      <span className="api-key-masked">
                        {empresaSelecionada.iaConfig?.apiKey ? '●●●●●●' : 'não configurada'}
                      </span>
                    </div>
                  </div>
                )}
              </section>

              {/* SEÇÃO PROMPT */}
              <section className="secao-prompt">
                <h3>Prompt da IA</h3>
                <p className="prompt-text">{empresaSelecionada.promptIA || 'Sem prompt'}</p>
                <button
                  onClick={() => navigate(`/empresas/${empresaSelecionada._id}/configurar`)}
                  className="btn-editar-prompt"
                >
                  Editar Prompt e Configurações
                </button>
              </section>

              {/* SEÇÃO ENVIAR MENSAGEM */}
              <section className="secao-enviar">
                <h3>Enviar mensagem</h3>
                <div className="form-group">
                  <label>Telefone (ex: 5511999999999)</label>
                  <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="Número ou JID" />
                </div>
                <div className="form-group">
                  <label>Mensagem</label>
                  <textarea value={sendText} onChange={(e) => setSendText(e.target.value)} placeholder="Escreva a mensagem aqui..." />
                </div>
                <div className="form-actions">
                  <button onClick={handleEnviarMensagem} className="btn-enviar" disabled={sending}>{sending ? 'Enviando...' : 'Enviar Mensagem'}</button>
                </div>
              </section>

              {/* AÇÕES */}
              <div className="painel-footer">
                <button
                  onClick={() => handleExcluir(empresaSelecionada._id)}
                  className="btn-excluir-grande"
                >
                  Excluir Empresa
                </button>
              </div>
            </div>
          ) : (
            <div className="painel-vazio">
              <p>Selecione uma empresa para editar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
