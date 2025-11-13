import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginFixed() {
  const [email, setEmail] = useState('jeansd@njbot.com');
  const [senha, setSenha] = useState('191427Mmaj@Lock203001');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulando autenticação bem-sucedida
    setTimeout(() => {
      localStorage.setItem('token', 'token_' + Date.now());
      localStorage.setItem('user', email);
      alert('Login bem-sucedido!');
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '100px auto' }}>
      <h1>NJBot - Login</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Senha:</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white' }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
