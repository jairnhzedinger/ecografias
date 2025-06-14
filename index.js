const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const session = require('express-session');
const helmet = require('helmet');
const archiver = require('archiver');
const { spawnSync } = require('child_process');

function hasConvert() {
  const gmCheck = spawnSync('gm', ['-version'], { stdio: 'ignore' });
  if (gmCheck.status === 0) return true;
  const convCheck = spawnSync('convert', ['-version'], { stdio: 'ignore' });
  return convCheck.status === 0;
}

const GM_AVAILABLE = hasConvert();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const bcrypt = require('bcryptjs');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
const DOWNLOAD_LOG_PATH = path.join(DATA_DIR, 'downloads.json');
const MESSAGE_PATH = path.join(DATA_DIR, 'message.txt');
const AGENDA_PATH = path.join(DATA_DIR, 'agendamentos.json');

function normalizeCpf(cpf) {
  return typeof cpf === 'string' ? cpf.replace(/\D/g, '') : '';
}

async function logAction(msg) {
  await fsp.appendFile(LOG_PATH, `[${new Date().toISOString()}] ${msg}\n`);
}

let waClient = null;
let waReady = false;
if (require.main === module) {
  // Inicialização do WhatsApp Web somente quando o servidor é executado
  waClient = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(DATA_DIR, 'wa-auth') }),
  });
  waClient.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
  });
  waClient.on('ready', () => {
    waReady = true;
    console.log('WhatsApp pronto');
  });
  waClient.initialize();
}

async function ensureWaReady() {
  if (waReady) return;
  if (!waClient) return;
  await new Promise((resolve) => {
    if (waReady) return resolve();
    waClient.once('ready', () => {
      waReady = true;
      resolve();
    });
  });
}

let ecografias = [];
let downloads = [];
let users = {};
let agendamentos = [];

async function loadData() {
  try {
    const data = await fsp.readFile(DB_PATH, 'utf8');
    ecografias = JSON.parse(data);
  } catch (_) {
    ecografias = [];
  }

  try {
    const data = await fsp.readFile(DOWNLOAD_LOG_PATH, 'utf8');
    downloads = JSON.parse(data);
  } catch (_) {
    downloads = [];
  }

  try {
    const data = await fsp.readFile(AGENDA_PATH, 'utf8');
    agendamentos = JSON.parse(data);
  } catch (_) {
    agendamentos = [];
  }

  try {
    const rawData = await fsp.readFile(USERS_PATH, 'utf8');
    const raw = JSON.parse(rawData);
    for (const [u, val] of Object.entries(raw)) {
      if (typeof val === 'string') {
        users[u] = { password: val, role: u === 'admin' ? 'admin' : 'medico' };
      } else {
        users[u] = val;
      }
    }
  } catch (_) {
    const hash = bcrypt.hashSync('admin', 10);
    users = { admin: { password: hash, role: 'admin' } };
    await fsp.writeFile(USERS_PATH, JSON.stringify(users, null, 2));
  }
}

const ready = loadData();

const shares = {};

async function sendExamLink(item, shareUrl) {
  if (!waClient || !item.whatsapp) return;
  await ensureWaReady();
  let phone = item.whatsapp.replace(/\D/g, '');
  if (!phone.startsWith('55')) {
    phone = `55${phone}`;
  }
  let template = 'Olá, seu exame de ecografia está disponível. Acesse: {link}';
  try {
    template = await fsp.readFile(MESSAGE_PATH, 'utf8');
  } catch (_) {
    /* ignore */
  }
  const msg = template.replace('{link}', shareUrl);
  try {
    await waClient.sendMessage(`${phone}@c.us`, msg);
  } catch (err) {
    console.error('Erro ao enviar WhatsApp:', err.message);
  }
}


const SESSION_SECRET =
  process.env.SESSION_SECRET || require('crypto').randomBytes(16).toString('hex');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https:'],
      },
    },
  })
);
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use('/thumbs', express.static(THUMB_DIR));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
const GOOGLE_CALLBACK_PATH =
  process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'dummy',
  process.env.GOOGLE_CLIENT_SECRET || 'dummy'
);

function getCallbackURL(req) {
  let url = GOOGLE_CALLBACK_PATH;
  if (!/^https?:\/\//.test(url)) {
    url = `${req.protocol}://${req.get('host')}${
      url.startsWith('/') ? '' : '/'
    }${url}`;
  }
  return url;
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'não autenticado' });
}

function requireRole(role) {
  return (req, res, next) => {
    if (
      req.session &&
      req.session.user &&
      (req.session.user.role === role ||
        (Array.isArray(role) && role.includes(req.session.user.role)))
    ) {
      return next();
    }
    res.status(403).json({ error: 'forbidden' });
  };
}

const ctx = {
  fs,
  fsp,
  archiver,
  bcrypt,
  GM_AVAILABLE,
  UPLOAD_DIR,
  THUMB_DIR,
  DOWNLOAD_LOG_PATH,
  DB_PATH,
  USERS_PATH,
  LOG_PATH,
  MESSAGE_PATH,
  AGENDA_PATH,
  normalizeCpf,
  logAction,
  ensureWaReady,
  sendExamLink,
  waClient,
  waReady,
  oauth2Client,
  getCallbackURL,
  GOOGLE_CALLBACK_PATH,
  ecografias,
  downloads,
  agendamentos,
  users,
  shares,
  requireAuth,
  requireRole,
};

app.use(require('./apps/auth')(ctx));
app.use(require('./apps/users')(ctx));
app.use(require('./apps/message')(ctx));
app.use(require('./apps/stats')(ctx));
app.use(require('./apps/whatsapp')(ctx));
app.use(require('./apps/ecografias')(ctx));
app.use(require('./apps/agenda')(ctx));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.getGoogleCallbackURL = () => GOOGLE_CALLBACK_PATH;
module.exports._getCallbackURL = getCallbackURL;
module.exports.ready = ready;
