const express = require('express');

module.exports = (ctx) => {
  const router = express.Router();

  router.get('/', (req, res) => {
    let view = 'login';
    if (req.session.user) {
      if (req.session.needCpf) {
        view = 'cpf';
      } else if (req.session.user.role === 'paciente') {
        view = 'painel';
      } else {
        view = 'index';
      }
    }
    res.render(view);
  });

  router.get('/login.html', (req, res) => {
    res.render('login');
  });

  router.get('/cpf.html', (req, res) => {
    res.render('cpf');
  });

  router.get('/painel.html', (req, res) => {
    res.render('painel');
  });

  router.get('/politica', (req, res) => {
    res.render('politica');
  });

  router.get('/termos', (req, res) => {
    res.render('termos');
  });

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const stored = ctx.users[username];
    if (stored) {
      const hash = stored.password;
      if (hash && ctx.bcrypt.compareSync(password, hash)) {
        req.session.user = {
          username,
          role: stored.role,
          cpf: stored.cpf,
          name: stored.name,
          picture: stored.picture,
        };
        req.session.needCpf = !stored.cpf;
        await ctx.logAction(`login ${username}`);
        return res.json({ ok: true, role: stored.role, needCpf: req.session.needCpf });
      }
    }
    res.status(401).json({ error: 'credenciais inválidas' });
  });

  router.post('/logout', async (req, res) => {
    if (req.session.user && req.session.user.username) {
      await ctx.logAction(`logout ${req.session.user.username}`);
    } else {
      await ctx.logAction('logout');
    }
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  router.get('/api/me', ctx.requireAuth, (req, res) => {
    res.json(req.session.user);
  });

  router.post('/api/me/cpf', ctx.requireAuth, async (req, res) => {
    const { cpf } = req.body;
    if (typeof cpf !== 'string' || !cpf.trim()) {
      return res.status(400).json({ error: 'cpf inválido' });
    }
    const user = ctx.users[req.session.user.username];
    if (!user) return res.status(404).json({ error: 'não encontrado' });
    user.cpf = ctx.normalizeCpf(cpf.trim());
    await ctx.fsp.writeFile(ctx.USERS_PATH, JSON.stringify(ctx.users, null, 2));
    req.session.user.cpf = user.cpf;
    req.session.needCpf = false;
    res.json({ ok: true });
  });

  router.get('/auth/google', (req, res) => {
    const state = Math.random().toString(36).substring(2);
    req.session.state = state;
    const callback = ctx.getCallbackURL(req);
    ctx.oauth2Client.redirectUri = callback;
    const url = ctx.oauth2Client.generateAuthUrl({
      access_type: 'online',
      scope: ['profile', 'email'],
      state,
      redirect_uri: callback,
    });
    res.redirect(url);
  });

  router.get('/auth/google/callback', async (req, res) => {
    const { code, state, error } = req.query;
    if (error || state !== req.session.state) {
      return res.redirect('/login.html');
    }
    try {
      const callback = ctx.getCallbackURL(req);
      const { tokens } = await ctx.oauth2Client.getToken({
        code,
        redirect_uri: callback,
      });
      ctx.oauth2Client.redirectUri = callback;
      ctx.oauth2Client.setCredentials(tokens);
      const oauth2 = require('googleapis').google.oauth2({ version: 'v2', auth: ctx.oauth2Client });
      const info = await oauth2.userinfo.get();
      const email = info.data.email || info.data.id;
      if (!ctx.users[email]) {
        ctx.users[email] = {
          role: 'paciente',
          name: info.data.name,
          picture: info.data.picture,
        };
      } else {
        ctx.users[email].name = info.data.name;
        ctx.users[email].picture = info.data.picture;
      }
      await ctx.fsp.writeFile(ctx.USERS_PATH, JSON.stringify(ctx.users, null, 2));
      req.session.user = {
        username: email,
        role: ctx.users[email].role,
        name: ctx.users[email].name,
        picture: ctx.users[email].picture,
        cpf: ctx.users[email].cpf,
      };
      req.session.needCpf = !ctx.users[email].cpf;
      await ctx.logAction(`login ${email} google`);
      res.redirect('/');
    } catch (err) {
      console.error('Erro login google:', err.message);
      res.redirect('/login.html');
    }
  });

  return router;
};
