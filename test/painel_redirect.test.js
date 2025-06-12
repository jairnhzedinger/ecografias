const request = require('supertest');
const app = require('../index');

const admin = request.agent(app);
const patient = request.agent(app);

beforeAll(async () => {
  await app.ready;
  await admin.post('/login').send({ username: 'admin', password: 'admin' });
  await admin.post('/api/users').send({ username: 'pac', password: '1', role: 'paciente' });
  await patient.post('/login').send({ username: 'pac', password: '1' });
  await patient.post('/api/me/cpf').send({ cpf: '123' });
});

afterAll(async () => {
  await admin.delete('/api/users/pac');
});

test('paciente recebe painel ao acessar root', async () => {
  const res = await patient.get('/');
  expect(res.status).toBe(200);
  expect(res.text).toContain('Meus Exames');
  expect(res.text).not.toContain('Enviar nova ecografia');
});
