import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListaEmpresas.css';

export default function ListaEmpresas() {
  const [bots, setBots] = useState([]);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const botsSalvos = JSON.parse(localStorage.getItem('bots') || '[]');
    setBots(botsSalvos);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleExcluir = (id) => {
    const novosBots = bots.filter(bot => bot.id !== id);
    setBots(novosBots);
    localStorage.setItem('bots', JSON.stringify(novosBots));
    alert('Bot excluído com sucesso!');
  };

  const handleGerarQR = () => {
    alert('QR Code gerado com sucesso!');
  };

  const botsFiltrados = bots.filter(bot => 
    bot.nomeEmpresa.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="lista-empresas-container">
      <header className="header">
        <h1>Empresas Cadastradas;</h1>
        <button className="btn-sair" onClick={handleLogout}>Sair</button>
      </header>

      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="bots-grid">
        {botsFiltrados.length > 0 ? (
          botsFiltrados.map(bot => (
            <div key={bot.id} className="bot-card">
              <div className="card-header">
                <h2>{bot.nomeEmpresa}</h2>
                <span className={`status ${bot.status.toLowerCase()}`}>
                  <span className="dot"></span>
                  {bot.status}
                </span>
              </div>

              <div className="card-body">
                <p><strong>Telefone:</strong> {bot.whatsapp}</p>
                <p><strong>Modelo IA:</strong> {bot.modeloIA}</p>
                <p><strong>Data de Criação:</strong> {bot.dataCriacao}</p>
                
                <div className="card-content">
                  <div className="prompt-section">
                    <p><strong>Prompt:</strong></p>
                    <p className="prompt-text">{bot.promptIA.substring(0, 100)}...</p>
                  </div>

                  <div className="qr-section">
                    <button className="btn-qr" onClick={handleGerarQR}>
                      📋 Gerar QR Code
                    </button>
                    <div className="qr-placeholder">
                      [QR Code]
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button 
                  className="btn-excluir"
                  onClick={() => handleExcluir(bot.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>Nenhum bot cadastrado ainda.</p>
            <button 
              className="btn-novo"
              onClick={() => navigate('/cadastro')}
            >
              Cadastrar Novo Bot
            </button>
          </div>
        )}
      </div>

      <div className="fab">
        <button 
          className="btn-add"
          onClick={() => navigate('/cadastro')}
          title="Adicionar novo bot"
        >
          +
        </button>
      </div>
    </div>
  );
}
