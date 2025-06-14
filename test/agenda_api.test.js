const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const agent = request.agent(app);
const file = path.join(__dirname, '../data/agendamentos.json');
let original;

describe('API de agendamentos', () => {
  let agId;
  beforeAll(async () => {
    await app.ready;
    original = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : null;
    await agent.post('/login').send({ username: 'admin', password: 'admin' });
  });

  afterAll(() => {
    if (original === null) fs.unlinkSync(file);
    else fs.writeFileSync(file, JSON.stringify(original, null, 2));
  });

  test('criar agendamento', async () => {
    const res = await agent.post('/api/agendamentos').send({
      patientName: 'Teste',
      cpf: '1',
      date: '2025-01-01',
      time: '10:00',
      notes: ''
    });
    expect(res.status).toBe(201);
    agId = res.body.id;
  });

  test('listar contem agendamento', async () => {
    const res = await agent.get('/api/agendamentos');
    expect(res.body.some((a) => a.id === agId)).toBe(true);
  });

  test('excluir agendamento', async () => {
    await agent.delete(`/api/agendamentos/${agId}`).expect(200);
  });
});
