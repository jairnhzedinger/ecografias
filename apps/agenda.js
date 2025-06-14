const express = require('express');

module.exports = (ctx) => {
  const router = express.Router();

  router.get('/api/agendamentos', ctx.requireAuth, (req, res) => {
    let list = ctx.agendamentos;
    if (req.session.user.role === 'paciente') {
      const ucpf = ctx.normalizeCpf(req.session.user.cpf);
      list = list.filter((a) => ctx.normalizeCpf(a.cpf) === ucpf);
    }
    res.json(list);
  });

  router.post('/api/agendamentos', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    const { patientName = '', cpf = '', date = '', time = '', notes = '' } = req.body;
    if (!patientName || !date || !time) {
      return res.status(400).json({ error: 'dados invalidos' });
    }
    const id = ctx.agendamentos.length ? ctx.agendamentos[ctx.agendamentos.length - 1].id + 1 : 1;
    const item = { id, patientName, cpf: ctx.normalizeCpf(cpf), date, time, notes, timestamp: Date.now() };
    ctx.agendamentos.push(item);
    await ctx.fsp.writeFile(ctx.AGENDA_PATH, JSON.stringify(ctx.agendamentos, null, 2));
    await ctx.logAction(`create-agendamento ${req.session.user.username} ${id}`);
    res.status(201).json(item);
  });

  router.put('/api/agendamentos/:id', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    const id = Number(req.params.id);
    const item = ctx.agendamentos.find((a) => a.id === id);
    if (!item) return res.status(404).json({ error: 'nao encontrado' });
    const { patientName, cpf, date, time, notes } = req.body;
    if (patientName !== undefined) item.patientName = patientName;
    if (cpf !== undefined) item.cpf = ctx.normalizeCpf(cpf);
    if (date !== undefined) item.date = date;
    if (time !== undefined) item.time = time;
    if (notes !== undefined) item.notes = notes;
    await ctx.fsp.writeFile(ctx.AGENDA_PATH, JSON.stringify(ctx.agendamentos, null, 2));
    await ctx.logAction(`update-agendamento ${req.session.user.username} ${id}`);
    res.json(item);
  });

  router.delete('/api/agendamentos/:id', ctx.requireRole(['admin', 'medico']), async (req, res) => {
    const id = Number(req.params.id);
    const idx = ctx.agendamentos.findIndex((a) => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'nao encontrado' });
    ctx.agendamentos.splice(idx, 1);
    await ctx.fsp.writeFile(ctx.AGENDA_PATH, JSON.stringify(ctx.agendamentos, null, 2));
    await ctx.logAction(`delete-agendamento ${req.session.user.username} ${id}`);
    res.json({ ok: true });
  });

  return router;
};
