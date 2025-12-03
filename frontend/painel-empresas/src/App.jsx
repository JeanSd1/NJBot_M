import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import CadastroBot from './pages/CadastroBot';
import ListaEmpresas from './pages/ListaEmpresas';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<ProtectedRoute><CadastroBot /></ProtectedRoute>} />
        <Route path="/empresas" element={<ProtectedRoute><ListaEmpresas /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
