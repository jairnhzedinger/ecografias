const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do multer para uploads
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// Armazena ecografias em memória
const ecografias = [];

// Servir arquivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/ecografias', (req, res) => {
  res.json(ecografias);
});

app.post('/api/ecografias', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo n\u00e3o enviado' });
  }
  const nova = {
    id: ecografias.length + 1,
    originalName: req.file.originalname,
    filename: req.file.filename,
    timestamp: Date.now()
  };
  ecografias.push(nova);
  res.status(201).json(nova);
});

app.get('/api/ecografias/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = ecografias.find(e => e.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Ecografia n\u00e3o encontrada' });
  }
  res.json(item);
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
