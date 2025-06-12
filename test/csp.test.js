const request = require('supertest');
const app = require('../index');

beforeAll(async () => {
  await app.ready;
});

describe('Content Security Policy', () => {
  test('permite imagens externas', async () => {
    const res = await request(app).get('/login.html');
    expect(res.status).toBe(200);
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toMatch(/img-src[^;]*https:/);
  });
});
