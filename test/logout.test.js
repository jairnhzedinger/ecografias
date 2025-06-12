const request = require('supertest');
const app = require('../index');

describe('Logout', () => {
  test('responde sem sessao ativa', async () => {
    const res = await request(app).post('/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('encerra sessao autenticada', async () => {
    const agent = request.agent(app);
    await agent.post('/login').send({ username: 'admin', password: 'admin' });
    await agent.post('/logout').expect(200);
    const res = await agent.get('/api/me');
    expect(res.status).toBe(401);
  });
});
