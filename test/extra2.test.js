const request = require('supertest');
const app = require('../index');

const agent = request.agent(app);

describe('Outras rotas', () => {
  beforeAll(async () => {
    await app.ready;
    await agent.post('/login').send({ username: 'admin', password: 'admin' });
  });

  test('status do whatsapp responde', async () => {
    const res = await agent.get('/api/whatsapp/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ready');
  });

  test('exportacao csv funciona', async () => {
    const res = await agent.get('/api/ecografias.csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
});
