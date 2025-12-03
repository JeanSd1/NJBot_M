import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListaEmpresas.css';
import api from '../services/api';

export default function ListaEmpresas() {
 const [bots, setBots] = useState([]);
 const [busca, setBusca] = useState('');
 const [qrCodes, setQrCodes] = useState({});
 const [abaAtiva, setAbaAtiva] = useState('todas');
 const navigate = useNavigate();

 useEffect(() => {
	 let mounted = true;
	 async function load() {
		 try {
			 const res = await api.get('/empresas');
			 if (!mounted) return;
			 const empresas = res.data || [];
			 setBots(empresas);

			 // Buscar QR para cada empresa (se disponível)
			 const qrObj = {};
			 await Promise.all(empresas.map(async (e) => {
				 try {
					 const qrRes = await api.get(`/qr/${e._id}`);
					 if (qrRes.status === 200 && qrRes.data && qrRes.data.qrCode) {
						 qrObj[e._id] = qrRes.data.qrCode;
					 }
				 } catch (err) {
					 // 204 ou erros são ignorados (sem QR)
				 }
			 }));
			 if (mounted) setQrCodes(qrObj);
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

 const handleLogout = () => {
	localStorage.removeItem('token');
	navigate('/');
 };

 const handleExcluir = (id) => {
	// chamar backend para excluir
	if (!confirm('Confirmar exclusão do bot?')) return;
	api.delete(`/empresas/${id}`).then(() => {
		const novos = bots.filter(b => b._id !== id);
		setBots(novos);
		alert('Bot excluído com sucesso!');
	}).catch(err => {
		console.error('Erro ao excluir:', err);
		alert('Erro ao excluir empresa');
	});
 };

 const handleGerarQR = async (botId) => {
	try {
		const res = await api.get(`/qr/${botId}`);
		if (res.status === 200 && res.data && res.data.qrCode) {
			// abre em nova aba (pode ser dataURL ou URL)
			const qr = res.data.qrCode;
			window.open(qr, '_blank');
		} else {
			alert('QR não disponível no momento.');
		}
	} catch (err) {
		if (err?.response?.status === 401) {
			localStorage.removeItem('token');
			navigate('/');
		} else {
			console.error('Erro ao buscar QR:', err);
			alert('Erro ao buscar QR');
		}
	}
 };

 const botsComBase = bots.filter(bot => bot.baseData && bot.baseData.length > 0);
 const botsFiltrados = (abaAtiva === 'combase' ? botsComBase : bots).filter(bot => 
	(bot.nome || '').toLowerCase().includes(busca.toLowerCase()) || (bot.telefone || '').includes(busca)
 );

 return (
 <div className="lista-empresas-container">
 <header className="header">
 <h1>Empresas Cadastradas</h1>
 <button className="btn-sair" onClick={handleLogout}>Sair</button>
 </header>

 <div className="tabs-container">
 <button 
 className={`tab ${abaAtiva === 'todas' ? 'active' : ''}`}
 onClick={() => setAbaAtiva('todas')}
 >
 Todas as Empresas ({bots.length})
 </button>
 <button 
 className={`tab ${abaAtiva === 'combase' ? 'active' : ''}`}
 onClick={() => setAbaAtiva('combase')}
 >
 Com Base Criada ({botsComBase.length})
 </button>
 </div>

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
 <div key={bot._id} className="bot-card">
 <div className="card-header">
 <h2>{bot.nome}</h2>
 <span className={`status ${bot.botAtivo ? 'ativo' : 'inativo'}`}>
 <span className="dot"></span>
 {bot.botAtivo ? 'Ativo' : 'Inativo'}
 </span>
 </div>
 <div className="card-body">
 <p><strong>Telefone:</strong> {bot.telefone || '-'}</p>
 <p><strong>Modelo IA:</strong> {bot.iaConfig?.tipo || '-'}</p>
 <p><strong>Data de Criação:</strong> {bot.createdAt ? new Date(bot.createdAt).toLocaleString() : '-'}</p>
 {bot.baseData && bot.baseData.length > 0 && (
 <p><strong>Interações:</strong> {bot.baseData.length}</p>
 )}
 
 <div className="card-content">
 <div className="prompt-section">
 <p><strong>Prompt:</strong></p>
 <p className="prompt-text">{(bot.promptIA || '').substring(0, 100)}...</p>
 </div>
 <div className="qr-section">
 {qrCodes[bot._id] ? (
 <img 
 src={qrCodes[bot._id]} 
 alt="QR Code WhatsApp"
 className="qr-image"
 />
 ) : (
 <div className="qr-placeholder">—</div>
 )}
 <button 
 className="btn-download-qr"
 onClick={() => handleGerarQR(bot._id)}
 title="Gerar QR Code para WhatsApp"
 >
 Gerar QR
 </button>
 </div>
 </div>
 </div>
 <div className="card-footer">
 <button 
 className="btn-excluir"
 onClick={() => handleExcluir(bot._id)}
 >
 Excluir
 </button>
 </div>
 </div>
 ))
 ) : (
 <div className="empty-state">
 <p>Nenhum bot nesta categoria.</p>
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
