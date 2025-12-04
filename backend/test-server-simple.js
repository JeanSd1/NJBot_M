// Teste simples do Express
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Express está funcionando!');
});

app.post('/test/credenciais', (req, res) => {
  console.log('🔐 POST /test/credenciais recebido');
  console.log('Body:', req.body);
  res.json({ message: 'Teste recebido com sucesso', data: req.body });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor teste rodando em http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\n✅ Servidor encerrado');
  process.exit(0);
});
