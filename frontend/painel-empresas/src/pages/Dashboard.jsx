import React, { useState } from 'react';

export default function Dashboard() {
  const [empresas, setEmpresas] = useState([
    { id: 1, nome: 'Empresa 1', cnpj: '12.345.678/0001-00' },
    { id: 2, nome: 'Empresa 2', cnpj: '98.765.432/0001-00' }
  ]);
  const [novaEmpresa, setNovaEmpresa] = useState({ nome: '', cnpj: '' });

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const adicionarEmpresa = () => {
    if (novaEmpresa.nome && novaEmpresa.cnpj) {
      setEmpresas([...empresas, { id: Date.now(), ...novaEmpresa }]);
      setNovaEmpresa({ nome: '', cnpj: '' });
      alert('Empresa adicionada com sucesso!');
    }
  };

  const deletarEmpresa = (id) => {
    setEmpresas(empresas.filter(e => e.id !== id));
    alert('Empresa deletada!');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>NJBot - Painel de Empresas</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Sair
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', marginBottom: '20px' }}>
        <h2>Adicionar Nova Empresa</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Nome da Empresa"
            value={novaEmpresa.nome}
            onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })}
            style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
          />
          <input
            type="text"
            placeholder="CNPJ"
            value={novaEmpresa.cnpj}
            onChange={(e) => setNovaEmpresa({ ...novaEmpresa, cnpj: e.target.value })}
            style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
          />
          <button onClick={adicionarEmpresa} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Adicionar
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px' }}>
        <h2>Minhas Empresas ({empresas.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Nome</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>CNPJ</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((empresa) => (
              <tr key={empresa.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{empresa.id}</td>
                <td style={{ padding: '10px' }}>{empresa.nome}</td>
                <td style={{ padding: '10px' }}>{empresa.cnpj}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button
                    onClick={() => deletarEmpresa(empresa.id)}
                    style={{ padding: '5px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
