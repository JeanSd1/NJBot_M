import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import CadastroBot from './pages/CadastroBot';
import ListaEmpresas from './pages/ListaEmpresas';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<CadastroBot />} />
        <Route path="/empresas" element={<ListaEmpresas />} />
      </Routes>
    </Router>
  );
}

export default App;
