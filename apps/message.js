const express = require('express');

module.exports = (ctx) => {
  const router = express.Router();

  router.get('/api/message', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    let msg = '';
    try {
      msg = await ctx.fsp.readFile(ctx.MESSAGE_PATH, 'utf8');
    } catch (_) {
      msg = 'Olá, seu exame de ecografia está disponível. Acesse: {link}';
    }
    res.json({ message: msg });
  });

  router.post('/api/message', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    const { message } = req.body;
    await ctx.fsp.writeFile(ctx.MESSAGE_PATH, message || '');
    await ctx.logAction(`update-message ${req.session.user.username}`);
    res.json({ ok: true });
  });

  return router;
};
