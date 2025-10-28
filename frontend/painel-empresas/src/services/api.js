import axios from 'axios';

// 'https://njbot-multi-15.onrender.com/api' || 
// Use a URL local fixa para desenvolvimento

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor de requisição – insere token de autenticação se existir
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Interceptor de resposta – tratamento global de erros
api.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        console.error('🔒 Erro de autenticação');
        break;
      case 404:
        console.error('🚫 Endpoint não encontrado:', error.config.url);
        break;
      case 500:
        console.error('💥 Erro interno do servidor');
        break;
      default:
        console.error('⚠️ Erro na requisição:', error.message);
    }
  } else if (error.request) {
    console.error('❌ Sem resposta do servidor (backend pode estar offline)');
  } else {
    console.error('⚙️ Erro ao configurar a requisição:', error.message);
  }

  return Promise.reject(error);
});

export default api;
