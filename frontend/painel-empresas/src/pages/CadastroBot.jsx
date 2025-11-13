import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CadastroBot.css';

export default function CadastroBot() {
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [promptIA, setPromptIA] = useState('');
  const [modeloIA, setModeloIA] = useState('GoogleGemini');
  const navigate = useNavigate();

  const handleCadastro = (e) => {
    e.preventDefault();
    const bot = {
      id: Date.now(),
      nomeEmpresa,
      whatsapp,
      promptIA,
      modeloIA,
      status: 'Offline',
      dataCriacao: new Date().toLocaleDateString('pt-BR')
    };
    
    const bots = JSON.parse(localStorage.getItem('bots') || '[]');
    bots.push(bot);
    localStorage.setItem('bots', JSON.stringify(bots));
    
    navigate('/empresas');
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
            value={nomeEmpresa}
            onChange={(e) => setNomeEmpresa(e.target.value)}
            required
          />
          
          <input
            type="tel"
            placeholder="Número do WhatsApp: (XX) XXXXX-XXXX"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
          />
          
          <textarea
            placeholder="Prompt da IA"
            value={promptIA}
            onChange={(e) => setPromptIA(e.target.value)}
            rows="5"
            required
          ></textarea>
          
          <h3>Configuração da IA</h3>
          <div className="ia-options">
            <label className={modeloIA === 'GoogleGemini' ? 'selected' : ''}>
              <input
                type="radio"
                name="ia"
                value="GoogleGemini"
                checked={modeloIA === 'GoogleGemini'}
                onChange={(e) => setModeloIA(e.target.value)}
              />
              <span>Google Gemini</span>
              <p>Modelo avançado do Google: rápido e preciso</p>
            </label>
            
            <label className={modeloIA === 'OpenAI' ? 'selected' : ''}>
              <input
                type="radio"
                name="ia"
                value="OpenAI"
                checked={modeloIA === 'OpenAI'}
                onChange={(e) => setModeloIA(e.target.value)}
              />
              <span>OpenAI GPT</span>
              <p>Modelo versátil da OpenAI com amplo conhecimento</p>
            </label>
            
            <label className={modeloIA === 'Anthropic' ? 'selected' : ''}>
              <input
                type="radio"
                name="ia"
                value="Anthropic"
                checked={modeloIA === 'Anthropic'}
                onChange={(e) => setModeloIA(e.target.value)}
              />
              <span>Anthropic Claude</span>
              <p>IA especializada em facilitação e resolução detalhadas</p>
            </label>
            
            <label className={modeloIA === 'PublicAI' ? 'selected' : ''}>
              <input
                type="radio"
                name="ia"
                value="PublicAI"
                checked={modeloIA === 'PublicAI'}
                onChange={(e) => setModeloIA(e.target.value)}
              />
              <span>Public AI</span>
              <p>Modelo open source de alta performance</p>
            </label>
          </div>
          
          <button type="submit" className="btn-cadastro">Cadastrar Bot</button>
        </form>
      </div>
    </div>
  );
}
