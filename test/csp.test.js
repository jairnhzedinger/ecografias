const request = require('supertest');
const app = require('../index');

const agent = request.agent(app);

beforeAll(async () => {
  await app.ready;
  await agent.post('/login').send({ username: 'admin', password: 'admin' });
});

describe('Content Security Policy', () => {
  test('permite imagens externas', async () => {
    const res = await request(app).get('/login.html');
    expect(res.status).toBe(200);
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toMatch(/img-src[^;]*https:/);
  });

  test('pagina inicial nao usa onclick', async () => {
    const res = await agent.get('/');
    expect(res.status).toBe(200);
    expect(res.text).not.toContain('onclick=');
  });
});
