const request = require('supertest');
const app = require('../index');

const agent = request.agent(app);

describe('Permissoes', () => {
  beforeAll(async () => {
    await agent.post('/login').send({ username: 'admin', password: 'admin' });
  });

  test('endpoint me', async () => {
    const res = await agent.get('/api/me');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', 'admin');
    expect(res.body).toHaveProperty('role');
  });

  test('bloqueia usuarios para nao admin', async () => {
    await agent.post('/api/users').send({ username: 'med', password: '1', role: 'medico' });
    const med = request.agent(app);
    await med.post('/login').send({ username: 'med', password: '1' });
    const res = await med.get('/api/users');
    expect(res.status).toBe(403);
  });
});
