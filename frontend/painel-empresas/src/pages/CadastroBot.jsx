import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CadastroBot.css';
import api from '../services/api';

export default function CadastroBot() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [promptIA, setPromptIA] = useState('');
  const [iaType, setIaType] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [claudeModel, setClaudeModel] = useState('claude-3-5-haiku-20241022');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nome,
        telefone,
        promptIA,
        ativo: true,
        iaConfig: {
          tipo: iaType,
          apiKey: apiKey,
          modelo: iaType === 'claude' ? claudeModel : undefined
        }
      };

      const res = await api.post('/empresas', payload);
      alert('Empresa cadastrada com sucesso!');
      navigate('/empresas');
    } catch (err) {
      console.error('Erro ao cadastrar:', err);
      const msg = err?.response?.data?.error || 'Erro ao cadastrar empresa';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-box">
        <h1>NJBot</h1>
        <h2>Cadastrar Empresa:</h2>
        
        <form onSubmit={handleCadastro}>
          <input
            type="text"
            placeholder="Nome da Empresa"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          
          <input
            type="tel"
            placeholder="Número do WhatsApp: (XX) XXXXX-XXXX"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
          />
          
          <textarea
            placeholder="Prompt da IA (instruções personalizadas para o assistente)"
            value={promptIA}
            onChange={(e) => setPromptIA(e.target.value)}
            rows="5"
            required
          ></textarea>
          
          <h3>Configuração da IA</h3>
          <div className="ia-options">
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
              <select value={claudeModel} onChange={(e) => setClaudeModel(e.target.value)}>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Recomendado - rápido e econômico)</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Mais potente)</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus (Mais avançado)</option>
              </select>
            </div>
          )}

          {iaType !== 'publicai' && (
            <input
              type="password"
              placeholder={`Chave de API ${iaType.toUpperCase()}`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          )}
          
          <button type="submit" className="btn-cadastro" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar Bot'}
          </button>
        </form>
      </div>
    </div>
  );
}
