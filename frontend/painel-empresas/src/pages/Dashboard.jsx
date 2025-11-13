import React from 'react';

export default function Dashboard() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>NJBot - Painel de Empresas</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white' }}>
          Logout
        </button>
      </div>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '5px' }}>
        <h2>Bem-vindo ao Dashboard!</h2>
        <p>Você está logado e acessando o painel de empresas.</p>
        <p>Aqui você pode gerenciar suas empresas e operações.</p>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3>Funcionalidades:</h3>
        <ul>
          <li>Gerenciar empresas</li>
          <li>Acompanhar operações</li>
          <li>Visualizar relatórios</li>
        </ul>
      </div>
    </div>
  );
}
