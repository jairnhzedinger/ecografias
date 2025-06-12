const request = require('supertest');
const app = require('../index');

describe('Paginas publicas', () => {
  test('politica acessivel', async () => {
    const res = await request(app).get('/politica');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Política de Privacidade');
  });

  test('termos acessiveis', async () => {
    const res = await request(app).get('/termos');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Termos de Serviço');
  });

  test('cpf form aponta para api correta', async () => {
    const res = await request(app).get('/cpf.html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="cpfForm"');
    expect(res.text).toContain('action="/api/me/cpf"');
  });

  test('login form envia para /login', async () => {
    const res = await request(app).get('/login.html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="loginForm"');
    expect(res.text).toContain('action="/login"');
  });

  test('login usa bot\u00e3o oficial do Google', async () => {
    const res = await request(app).get('/login.html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('gsi-material-button');
  });
});
