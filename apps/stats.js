const express = require('express');

module.exports = (ctx) => {
  const router = express.Router();

  router.get('/api/logs', ctx.requireRole('admin'), (req, res) => {
    res.download(ctx.LOG_PATH, 'actions.log');
  });

  router.get('/api/backup', ctx.requireRole('admin'), (req, res) => {
    res.attachment('backup.zip');
    const archive = ctx.archiver('zip');
    archive.pipe(res);
    archive.directory(ctx.UPLOAD_DIR, 'uploads');
    archive.file(ctx.DB_PATH, { name: 'ecografias.json' });
    archive.finalize();
  });

  router.get('/api/downloads', ctx.requireRole(['admin', 'medico']), (req, res) => {
    res.json(ctx.downloads);
  });

  router.get('/api/stats', ctx.requireRole(['admin', 'medico']), (req, res) => {
    const totalEcografias = ctx.ecografias.length;
    const totalDownloads = ctx.downloads.length;
    res.json({ totalEcografias, totalDownloads });
  });

  router.get('/api/ecografias.csv', ctx.requireRole(['admin', 'medico']), (req, res) => {
    const header = [
      'id',
      'patientName',
      'cpf',
      'examDate',
      'notes',
      'filename',
      'whatsapp',
      'timestamp',
    ];
    const lines = ctx.ecografias.map((e) =>
      header
        .map((h) => {
          const val = e[h] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    res.type('text/csv');
    res.attachment('ecografias.csv');
    res.send([header.join(','), ...lines].join('\n'));
  });

  return router;
};
