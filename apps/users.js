const express = require('express');

module.exports = (ctx) => {
  const router = express.Router();

  router.get('/api/users', ctx.requireRole('admin'), (req, res) => {
    res.json(Object.keys(ctx.users));
  });

  router.post('/api/users', ctx.requireRole('admin'), async (req, res) => {
    const { username, password, role = 'medico' } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'dados inválidos' });
    }
    if (ctx.users[username]) {
      return res.status(400).json({ error: 'usuário existente' });
    }
    ctx.users[username] = { password: ctx.bcrypt.hashSync(password, 10), role };
    await ctx.fsp.writeFile(ctx.USERS_PATH, JSON.stringify(ctx.users, null, 2));
    await ctx.logAction(`create-user ${req.session.user.username} ${username}`);
    res.json({ ok: true });
  });

  router.delete('/api/users/:username', ctx.requireRole('admin'), async (req, res) => {
    const { username } = req.params;
    if (!ctx.users[username]) {
      return res.status(404).json({ error: 'não encontrado' });
    }
    delete ctx.users[username];
    await ctx.fsp.writeFile(ctx.USERS_PATH, JSON.stringify(ctx.users, null, 2));
    await ctx.logAction(`delete-user ${req.session.user.username} ${username}`);
    res.json({ ok: true });
  });

  router.post('/api/users/:username/password', ctx.requireRole('admin'), async (req, res) => {
    const { username } = req.params;
    const { password } = req.body;
    if (!ctx.users[username]) {
      return res.status(404).json({ error: 'não encontrado' });
    }
    if (typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ error: 'senha inválida' });
    }
    ctx.users[username].password = ctx.bcrypt.hashSync(password, 10);
    await ctx.fsp.writeFile(ctx.USERS_PATH, JSON.stringify(ctx.users, null, 2));
    await ctx.logAction(`update-pass ${req.session.user.username} ${username}`);
    res.json({ ok: true });
  });

  router.post('/api/users/:username/role', ctx.requireRole('admin'), async (req, res) => {
    const { username } = req.params;
    const { role } = req.body;
    if (!ctx.users[username]) {
      return res.status(404).json({ error: 'não encontrado' });
    }
    ctx.users[username].role = role;
    await ctx.fsp.writeFile(ctx.USERS_PATH, JSON.stringify(ctx.users, null, 2));
    await ctx.logAction(`update-role ${req.session.user.username} ${username}`);
    res.json({ ok: true });
  });

  return router;
};
