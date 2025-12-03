import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('admin@njbot.com');
  const [password, setPassword] = useState('senha');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/login', { email, senha: password });
      const { token } = res.data;
      if (token) {
        localStorage.setItem('token', token);
        navigate('/empresas');
      } else {
        alert('Resposta inválida do servidor');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      const msg = err?.response?.data?.error || 'Erro ao efetuar login';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-box">
          <h1>NJBOT</h1>
          <h2>Faça seu login.</h2>
          <p>Acesse o painel de controle do NJBot</p>

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
            <button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
          </form>
          <p className="signup-text">Ainda não tenho uma conta</p>
        </div>
      </div>

      <div className="login-right">
        <div className="neon-text">NJBOT</div>
      </div>
    </div>
  );
}
