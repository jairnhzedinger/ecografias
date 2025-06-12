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
});
