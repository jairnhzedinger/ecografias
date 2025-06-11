const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Diretórios
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const THUMB_DIR = path.join(__dirname, 'thumbnails');
const DATA_DIR = path.join(__dirname, 'data');
const LOG_DIR = path.join(__dirname, 'logs');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(THUMB_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'ecografias.json');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const LOG_PATH = path.join(LOG_DIR, 'actions.log');

function logAction(msg) {
  fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${msg}\n`);
}

let ecografias = [];
try {
  ecografias = JSON.parse(fs.readFileSync(DB_PATH));
} catch (_) {
  ecografias = [];
}

let users = {};
try {
  users = JSON.parse(fs.readFileSync(USERS_PATH));
} catch (_) {
  users = { admin: 'admin' };
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

// Configuração do multer
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Apenas imagens são permitidas'));
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/thumbs', express.static(THUMB_DIR));
app.use(express.json());
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  })
);

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'não autenticado' });
}

app.get('/', (req, res) => {
  const page = req.session.user ? 'index.html' : 'login.html';
  res.sendFile(path.join(__dirname, 'public', page));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    req.session.user = username;
    logAction(`login ${username}`);
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'credenciais inválidas' });
});

app.post('/logout', (req, res) => {
  logAction(`logout ${req.session.user}`);
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/ecografias', requireAuth, (req, res) => {
  let { q } = req.query;
  let results = ecografias;
  if (q) {
    q = q.toLowerCase();
    results = results.filter(
      (e) =>
        e.patientName.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q))
    );
  }
  res.json(results);
});

app.post('/api/ecografias', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
  const { patientName = '', examDate = '', notes = '' } = req.body;
  const id = ecografias.length ? ecografias[ecografias.length - 1].id + 1 : 1;
  const filename = req.file.filename;
  const thumbFilename = 'thumb-' + filename;
  await sharp(req.file.path).resize(200).toFile(path.join(THUMB_DIR, thumbFilename));
  const item = {
    id,
    patientName,
    examDate,
    notes,
    originalName: req.file.originalname,
    filename,
    thumbFilename,
    timestamp: Date.now(),
  };
  ecografias.push(item);
  fs.writeFileSync(DB_PATH, JSON.stringify(ecografias, null, 2));
  logAction(`upload ${req.session.user} ${filename}`);
  res.status(201).json(item);
});

app.get('/api/ecografias/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const item = ecografias.find((e) => e.id === id);
  if (!item) return res.status(404).json({ error: 'não encontrado' });
  res.json(item);
});

app.delete('/api/ecografias/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const idx = ecografias.findIndex((e) => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'não encontrado' });
  const [item] = ecografias.splice(idx, 1);
  fs.unlinkSync(path.join(UPLOAD_DIR, item.filename));
  fs.unlinkSync(path.join(THUMB_DIR, item.thumbFilename));
  fs.writeFileSync(DB_PATH, JSON.stringify(ecografias, null, 2));
  logAction(`delete ${req.session.user} ${item.filename}`);
  res.json({ ok: true });
});

app.put('/api/ecografias/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const item = ecografias.find((e) => e.id === id);
  if (!item) return res.status(404).json({ error: 'não encontrado' });
  const { patientName, examDate, notes } = req.body;
  if (patientName !== undefined) item.patientName = patientName;
  if (examDate !== undefined) item.examDate = examDate;
  if (notes !== undefined) item.notes = notes;
  fs.writeFileSync(DB_PATH, JSON.stringify(ecografias, null, 2));
  logAction(`update ${req.session.user} ${item.filename}`);
  res.json(item);
});

const shares = {};
app.post('/api/ecografias/:id/share', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const item = ecografias.find((e) => e.id === id);
  if (!item) return res.status(404).json({ error: 'não encontrado' });
  const token = Math.random().toString(36).substring(2, 10);
  shares[token] = { id, expire: Date.now() + 3600 * 1000 };
  logAction(`share ${req.session.user} ${token} for ${item.filename}`);
  res.json({ url: `/share/${token}` });
});

app.get('/share/:token', (req, res) => {
  const data = shares[req.params.token];
  if (!data || data.expire < Date.now()) return res.status(404).send('Link expirado');
  const item = ecografias.find((e) => e.id === data.id);
  if (!item) return res.status(404).send('Não encontrado');
  res.sendFile(path.join(UPLOAD_DIR, item.filename));
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
