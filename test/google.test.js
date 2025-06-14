const request = require('supertest');
let app = require('../index');

beforeAll(async () => {
  await app.ready;
});

describe('Login Google', () => {
  test('rota de auth redireciona para o Google', async () => {
    const res = await request(app).get('/auth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('accounts.google.com');
  });

  test('callback respeita variavel de ambiente', async () => {
    process.env.GOOGLE_CALLBACK_URL = '/cbtest';
    jest.resetModules();
    app = require('../index');
    const res = await request(app).get('/auth/google');
    expect(decodeURIComponent(res.headers.location)).toContain('/cbtest');
    delete process.env.GOOGLE_CALLBACK_URL;
  });
});
