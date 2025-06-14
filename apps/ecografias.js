const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const gm = require('gm');

module.exports = (ctx) => {
  const router = express.Router();

  const storage = multer.diskStorage({
    destination: ctx.UPLOAD_DIR,
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });

  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
        cb(new Error('Apenas imagens ou PDF são permitidos'));
      } else {
        cb(null, true);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  router.get('/uploads/:file', ctx.requireAuth, (req, res) => {
    const file = path.basename(req.params.file);
    const filePath = path.join(ctx.UPLOAD_DIR, file);
    if (!ctx.fs.existsSync(filePath)) {
      return res.status(404).send('não encontrado');
    }
    const item = ctx.ecografias.find((e) => e.filename === file);
    if (!item) return res.status(404).send('não encontrado');
    if (req.session.user.role === 'paciente') {
      if (ctx.normalizeCpf(item.cpf) !== ctx.normalizeCpf(req.session.user.cpf)) {
        return res.status(403).send('forbidden');
      }
    } else if (!['admin', 'medico'].includes(req.session.user.role)) {
      return res.status(403).send('forbidden');
    }
    res.sendFile(filePath);
  });

  router.get('/api/ecografias', ctx.requireAuth, (req, res) => {
    let { q, start, end, shared } = req.query;
    let results = ctx.ecografias;
    if (req.session.user.role === 'paciente') {
      const ucpf = ctx.normalizeCpf(req.session.user.cpf);
      results = results.filter(
        (e) => ctx.normalizeCpf(e.cpf) && ucpf && ctx.normalizeCpf(e.cpf) === ucpf
      );
    }
    if (q) {
      const ql = q.toLowerCase();
      const qcpf = ctx.normalizeCpf(q);
      results = results.filter(
        (e) =>
          e.patientName.toLowerCase().includes(ql) ||
          (e.cpf && ctx.normalizeCpf(e.cpf).includes(qcpf)) ||
          (e.notes && e.notes.toLowerCase().includes(ql))
      );
    }
    if (start) {
      results = results.filter((e) => e.examDate && e.examDate >= start);
    }
    if (end) {
      results = results.filter((e) => e.examDate && e.examDate <= end);
    }
    if (shared === 'true') {
      results = results.filter((e) => e.shared);
    } else if (shared === 'false') {
      results = results.filter((e) => !e.shared);
    }
    res.json(results);
  });

  router.post('/api/ecografias', ctx.requireRole(['admin', 'medico']), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
    const {
      patientName = '',
      examDate = '',
      notes = '',
      cpf = '',
      whatsapp = '',
    } = req.body;
    const normCpf = ctx.normalizeCpf(cpf);
    const id = ctx.ecografias.length ? ctx.ecografias[ctx.ecografias.length - 1].id + 1 : 1;
    const filename = req.file.filename;
    let thumbFilename = null;
    if (req.file.mimetype.startsWith('image/')) {
      thumbFilename = 'thumb-' + filename;
      await sharp(req.file.path).resize(200).toFile(path.join(ctx.THUMB_DIR, thumbFilename));
    } else if (req.file.mimetype === 'application/pdf') {
      thumbFilename = 'thumb-' + filename.replace(path.extname(filename), '.png');
      if (ctx.GM_AVAILABLE) {
        try {
          await new Promise((resolve, reject) => {
            gm(req.file.path + '[0]')
              .setFormat('png')
              .resize(200)
              .write(path.join(ctx.THUMB_DIR, thumbFilename), (err) => {
                if (err) reject(err);
                else resolve();
              });
          });
        } catch (err) {
          ctx.fs.appendFileSync('/tmp/gm_error.log', err.message + '\n');
          thumbFilename = null;
        }
      } else {
        console.warn('GraphicsMagick/ImageMagick não encontrado, miniatura não gerada');
        thumbFilename = null;
      }
    }
    const item = {
      id,
      patientName,
      cpf: normCpf,
      examDate,
      notes,
      originalName: req.file.originalname,
      filename,
      thumbFilename,
      whatsapp,
      timestamp: Date.now(),
      shared: true,
    };
    ctx.ecografias.push(item);
    await ctx.fsp.writeFile(ctx.DB_PATH, JSON.stringify(ctx.ecografias, null, 2));
    await ctx.logAction(`upload ${req.session.user.username} ${filename}`);

    const token = Math.random().toString(36).substring(2, 10);
    ctx.shares[token] = { id, expire: Date.now() + 3600 * 1000 };
    const shareUrl = `${req.protocol}://${req.get('host')}/share/${token}`;
    await ctx.sendExamLink(item, shareUrl);

    res.status(201).json({ ...item, shareUrl });
  });

  router.get('/api/ecografias/:id', ctx.requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const item = ctx.ecografias.find((e) => e.id === id);
    if (!item) return res.status(404).json({ error: 'não encontrado' });
    if (
      req.session.user.role === 'paciente' &&
      ctx.normalizeCpf(item.cpf) !== ctx.normalizeCpf(req.session.user.cpf)
    ) {
      return res.status(403).json({ error: 'forbidden' });
    }
    res.json(item);
  });

  router.get('/api/ecografias/:id/pdf', ctx.requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const item = ctx.ecografias.find((e) => e.id === id);
    if (!item) return res.status(404).json({ error: 'não encontrado' });
    if (
      req.session.user.role === 'paciente' &&
      ctx.normalizeCpf(item.cpf) !== ctx.normalizeCpf(req.session.user.cpf)
    ) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const filePath = path.join(ctx.UPLOAD_DIR, item.filename);
    if (!ctx.fs.existsSync(filePath)) return res.status(404).json({ error: 'não encontrado' });
    res.sendFile(filePath);
  });

  router.delete('/api/ecografias/:id', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    const id = Number(req.params.id);
    const idx = ctx.ecografias.findIndex((e) => e.id === id);
    if (idx === -1) return res.status(404).json({ error: 'não encontrado' });
    const [item] = ctx.ecografias.splice(idx, 1);
    const mainFile = path.join(ctx.UPLOAD_DIR, item.filename);
    if (ctx.fs.existsSync(mainFile)) {
      ctx.fs.unlinkSync(mainFile);
    }
    if (item.thumbFilename) {
      const thumbFile = path.join(ctx.THUMB_DIR, item.thumbFilename);
      if (ctx.fs.existsSync(thumbFile)) {
        ctx.fs.unlinkSync(thumbFile);
      }
    }
    for (const [t, data] of Object.entries(ctx.shares)) {
      if (data.id === id) delete ctx.shares[t];
    }
    await ctx.fsp.writeFile(ctx.DB_PATH, JSON.stringify(ctx.ecografias, null, 2));
    await ctx.logAction(`delete ${req.session.user.username} ${item.filename}`);
    res.json({ ok: true });
  });

  router.put('/api/ecografias/:id', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    const id = Number(req.params.id);
    const item = ctx.ecografias.find((e) => e.id === id);
    if (!item) return res.status(404).json({ error: 'não encontrado' });
    const { patientName, examDate, notes, cpf, whatsapp } = req.body;
    if (patientName !== undefined) item.patientName = patientName;
    if (examDate !== undefined) item.examDate = examDate;
    if (notes !== undefined) item.notes = notes;
    if (cpf !== undefined) item.cpf = ctx.normalizeCpf(cpf);
    if (whatsapp !== undefined) item.whatsapp = whatsapp;
    await ctx.fsp.writeFile(ctx.DB_PATH, JSON.stringify(ctx.ecografias, null, 2));
    await ctx.logAction(`update ${req.session.user.username} ${item.filename}`);
    res.json(item);
  });

  router.post('/api/ecografias/:id/share', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    const id = Number(req.params.id);
    const item = ctx.ecografias.find((e) => e.id === id);
    if (!item) return res.status(404).json({ error: 'não encontrado' });
    const expiresIn = Number(req.body && req.body.expiresIn) || 3600 * 1000;
    const token = Math.random().toString(36).substring(2, 10);
    ctx.shares[token] = { id, expire: Date.now() + expiresIn };
    item.shared = true;
    await ctx.fsp.writeFile(ctx.DB_PATH, JSON.stringify(ctx.ecografias, null, 2));
    await ctx.logAction(`share ${req.session.user.username} ${token} for ${item.filename}`);
    res.json({ url: `/share/${token}` });
  });

  router.post('/api/ecografias/:id/resend', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    const id = Number(req.params.id);
    const item = ctx.ecografias.find((e) => e.id === id);
    if (!item) return res.status(404).json({ error: 'não encontrado' });
    const expiresIn = Number(req.body && req.body.expiresIn) || 3600 * 1000;
    const token = Math.random().toString(36).substring(2, 10);
    ctx.shares[token] = { id, expire: Date.now() + expiresIn };
    const shareUrl = `${req.protocol}://${req.get('host')}/share/${token}`;
    await ctx.sendExamLink(item, shareUrl);
    item.shared = true;
    await ctx.fsp.writeFile(ctx.DB_PATH, JSON.stringify(ctx.ecografias, null, 2));
    await ctx.logAction(`resend ${req.session.user.username} ${token} for ${item.filename}`);
    res.json({ url: `/share/${token}` });
  });

  router.post('/api/ecografias/:id/unshare', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    const id = Number(req.params.id);
    const item = ctx.ecografias.find((e) => e.id === id);
    if (!item) return res.status(404).json({ error: 'não encontrado' });
    item.shared = false;
    await ctx.fsp.writeFile(ctx.DB_PATH, JSON.stringify(ctx.ecografias, null, 2));
    await ctx.logAction(`unshare ${req.session.user.username} ${item.filename}`);
    res.json({ ok: true });
  });

  router.get('/share/:token', (req, res) => {
    const data = ctx.shares[req.params.token];
    if (!data || data.expire < Date.now()) return res.status(404).send('Link expirado');
    res.render('share');
  });

  router.post('/share/:token', async (req, res) => {
    const data = ctx.shares[req.params.token];
    if (!data || data.expire < Date.now()) return res.status(404).send('Link expirado');
    const item = ctx.ecografias.find((e) => e.id === data.id);
    if (!item) return res.status(404).send('Não encontrado');
    const { cpf } = req.body;
    if (item.cpf && ctx.normalizeCpf(cpf) === ctx.normalizeCpf(item.cpf)) {
      ctx.downloads.push({ id: item.id, timestamp: Date.now() });
      await ctx.fsp.writeFile(ctx.DOWNLOAD_LOG_PATH, JSON.stringify(ctx.downloads, null, 2));
      return res.sendFile(path.join(ctx.UPLOAD_DIR, item.filename));
    }
    res.status(403).send('CPF incorreto');
  });

  return router;
};
