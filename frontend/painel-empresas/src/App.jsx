import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import LoginEmpresa from './pages/LoginEmpresa';
import CadastroBot from './pages/CadastroBot';
import ListaEmpresas from './pages/ListaEmpresas';
import ConfiguracaoEmpresa from './pages/ConfiguracaoEmpresa';
import EmpresaDashboard from './pages/EmpresaDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/empresa-login" element={<LoginEmpresa />} />
        <Route path="/cadastro" element={<ProtectedRoute><CadastroBot /></ProtectedRoute>} />
        <Route path="/empresas" element={<ProtectedRoute><ListaEmpresas /></ProtectedRoute>} />
        <Route path="/empresas/:id/configurar" element={<ProtectedRoute><ConfiguracaoEmpresa /></ProtectedRoute>} />
        <Route path="/empresa/:id" element={<EmpresaDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
