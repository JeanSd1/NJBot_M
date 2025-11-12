import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/LoginFixed';
import Dashboard from './pages/Dashboard';
import  { createGlobalStyle } from 'styled-components';

 const GlobalStyle = createGlobalStyle`
    /* import web fonts for better match with mockup */
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Poppins:wght@400;600&display=swap');

    html, body, #root {
      margin: 0;
      padding: 0;
      min-height: 100%;
      background-color: rgba(13, 27, 42, 0.77);
      font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
    }

    body {
      background-color: #0d0d0d; /* darker base like the mockup */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
`;

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
}

function App() {
  return (
    <><GlobalStyle /><Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute>
          <Dashboard />
        </PrivateRoute>} />
        <Route path="/painel-empresas" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      </Routes>
    </Router></>
  );
}

export default App;
