import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import api from '../services/api';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' ou 'register'
  const [email, setEmail] = useState('admin@youbot.com');
  const [password, setPassword] = useState('senha');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nome, setNome] = useState('');
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validacoes
    if (!email || !password || !nome) {
      setMessage('Preencha todos os campos obrigatorios');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('Senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('As senhas nao coincidem');
      setLoading(false);
      return;
    }

    try {
      // Usar o endpoint de criacao de usuario (precisa de token admin)
      // Para primeiro usuario, vamos usar um endpoint de registro publico
      const res = await api.post('/api/registro', {
        nome,
        email,
        senha: password,
        role: 'client'
      });

      if (res.data.message) {
        setMessage('Conta criada com sucesso! Faca login agora.');
        setTimeout(() => {
          setMode('login');
          setNome('');
          setConfirmPassword('');
          setMessage('');
        }, 2000);
      }
    } catch (err) {
      console.error('Erro no registro:', err);
      const msg = err?.response?.data?.error || 'Erro ao criar conta';
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
          <h2>{mode === 'login' ? 'Faca seu login.' : 'Criar nova conta'}</h2>
          <p>{mode === 'login' ? 'Acesse o painel de controle do YouBot' : 'Registre-se para comear'}</p>

          {/* Abas de Login/Registro */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setMessage('');
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setMode('register');
                setMessage('');
              }}
            >
              Registrar
            </button>
          </div>

          {/* Mensagens de erro/sucesso */}
          {message && (
            <div className={`message ${message.includes('sucesso') || message.includes('Sucesso') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {/* Formulario de Login */}
          {mode === 'login' && (
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
          )}

          {/* Formulario de Registro */}
          {mode === 'register' && (
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Criar senha (minimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>
            </form>
          )}

          {mode === 'login' && (
            <p className="signup-text">Ainda nao tenho uma conta</p>
          )}
        </div>
      </div>

      <div className="login-right">
        <div className="neon-text">YouBot</div>
      </div>
    </div>
  );
}
