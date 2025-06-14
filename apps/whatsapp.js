const express = require('express');

module.exports = (ctx) => {
  const router = express.Router();

  router.get('/api/whatsapp/status', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    await ctx.ensureWaReady();
    res.json({ ready: ctx.waReady });
  });

  router.post('/api/whatsapp/reset', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    if (ctx.waClient) {
      await ctx.waClient.destroy();
      ctx.waReady = false;
      ctx.waClient.initialize();
    }
    await ctx.logAction(`wa-reset ${req.session.user.username}`);
    res.json({ ok: true });
  });

  return router;
};
