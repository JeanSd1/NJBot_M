import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('admin@youbot.com');
  const [password, setPassword] = useState('senha');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/api/login', { email, senha: password });
      const { token } = res.data;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(res.data));
        navigate('/empresas');
      } else {
        setMessage('Resposta invalida do servidor');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      const msg = err?.response?.data?.error || 'Erro ao efetuar login';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-box">
          <h1>YouBot</h1>
          <h2>Faca seu login.</h2>
          <p>Acesse o painel de controle do YouBot</p>

          {message && <div className="message">{message}</div>}

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <a href="#">Esqueceu minha senha</a>
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="signup-text">Admin cria login para clientes</p>
        </div>
      </div>

      <div className="login-right">
        <div className="neon-text">YouBot</div>
      </div>
    </div>
  );
}
