import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';
import api from '../services/api';

export default function LoginEmpresa() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('empresa'); // 'empresa' ou 'credenciais'
  const navigate = useNavigate();

  const handleSelecionarEmpresa = (e) => {
    e.preventDefault();
    if (empresaId.trim()) {
      setStep('credenciais');
      setError('');
    } else {
      setError('Por favor, insira o ID da empresa');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/empresas/login', {
        usuario,
        senha,
        empresaId
      });

      // Salvar token da empresa no localStorage
      localStorage.setItem('empresaToken', res.data.token);
      localStorage.setItem('empresaId', res.data.empresaId);
      localStorage.setItem('empresaNome', res.data.nome);

      // Redirecionar para painel da empresa
      navigate(`/empresa/${res.data.empresaId}`);
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      const msg = err?.response?.data?.error || 'Erro ao fazer login';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>YouBot</h1>
        <h2>Acesso da Empresa</h2>

        {error && <div className="error-message">{error}</div>}

        {step === 'empresa' ? (
          <form onSubmit={handleSelecionarEmpresa}>
            <input
              type="text"
              placeholder="ID da Empresa"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              required
              autoFocus
            />
            <button type="submit" className="btn-login">
              Próximo
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="empresa-info">
              <p>ID: {empresaId}</p>
              <button
                type="button"
                className="btn-voltar"
                onClick={() => {
                  setStep('empresa');
                  setUsuario('');
                  setSenha('');
                  setError('');
                }}
              >
                ← Alterar ID
              </button>
            </div>

            <input
              type="text"
              placeholder="Usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              autoFocus
            />

            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />

            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <a href="/">← Voltar ao login principal</a>
        </div>
      </div>
    </div>
  );
}
