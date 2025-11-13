import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListaEmpresas.css';

export default function ListaEmpresas() {
  const [bots, setBots] = useState([]);
  const [busca, setBusca] = useState('');
  const [qrCodes, setQrCodes] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const botsSalvos = JSON.parse(localStorage.getItem('bots') || '[]');
    setBots(botsSalvos);
    
    // Gerar QR Code com link do WhatsApp para cada bot
    const qrObj = {};
    botsSalvos.forEach(bot => {
      // Limpar número do WhatsApp (remover caracteres especiais)
      const numberClean = bot.whatsapp.replace(/\D/g, '');
      // URL do WhatsApp para conversar com o bot
      const waUrl = `https://wa.me/${numberClean}`;
      // Gerar QR Code com essa URL
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waUrl)}`;
      qrObj[bot.id] = qrUrl;
    });
    setQrCodes(qrObj);
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

  const handleGerarQR = (botId) => {
    const numberClean = bots.find(b => b.id === botId).whatsapp.replace(/\D/g, '');
    const waUrl = `https://wa.me/${numberClean}`;
    // Abrir WhatsApp diretamente
    window.open(waUrl, '_blank');
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
                    <img 
                      src={qrCodes[bot.id]} 
                      alt="QR Code WhatsApp"
                      className="qr-image"
                    />
                    <button 
                      className="btn-download-qr"
                      onClick={() => handleGerarQR(bot.id)}
                      title="Gerar QR Code para WhatsApp"
                    >
                      📋 Gerar QR
                    </button>
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
