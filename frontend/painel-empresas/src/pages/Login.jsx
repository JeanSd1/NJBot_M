import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('admin@njbot.com');
  const [password, setPassword] = useState('senha');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('token', 'njbot_token_' + Date.now());
    navigate('/cadastro');
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
            <button type="submit">Entrar</button>
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
