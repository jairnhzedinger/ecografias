const request = require('supertest');
const app = require('../index');

const agent = request.agent(app);

describe('Imagem de perfil', () => {
  beforeAll(async () => {
    await app.ready;
    await agent.post('/login').send({ username: 'admin', password: 'admin' });
  });

  test('dock exibe placeholder de perfil', async () => {
    const res = await agent.get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('https://placehold.co/32x32');
  });
});
