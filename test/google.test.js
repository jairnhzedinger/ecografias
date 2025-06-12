const request = require('supertest');
const app = require('../index');

describe('Login Google', () => {
  test('rota de auth redireciona para o Google', async () => {
    const res = await request(app).get('/auth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('accounts.google.com');
  });
});
