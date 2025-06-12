const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const admin = request.agent(app);
const patient = request.agent(app);
const ecoFile = path.join(__dirname, '../data/ecografias.json');
let originalEco;
const usersFile = path.join(__dirname, '../data/users.json');
let originalUsers;

const pdfBuffer = Buffer.from('test');
function createTempPdf() {
  const file = path.join(__dirname, 'tempf.pdf');
  fs.writeFileSync(file, pdfBuffer);
  return file;
}

describe('Filtro de CPF', () => {
  let examId;
  beforeAll(async () => {
    originalEco = JSON.parse(fs.readFileSync(ecoFile));
    originalUsers = JSON.parse(fs.readFileSync(usersFile));
    await admin.post('/login').send({ username: 'admin', password: 'admin' });
    const tmp = createTempPdf();
    const upload = await admin
      .post('/api/ecografias')
      .field('patientName', 'CPF Teste')
      .field('cpf', '123.456.789-00')
      .field('examDate', '2020-01-01')
      .field('notes', 'n')
      .attach('file', tmp);
    fs.unlinkSync(tmp);
    examId = upload.body.id;
    await admin.post('/api/users').send({ username: 'cfp', password: '1', role: 'paciente' });
    await patient.post('/login').send({ username: 'cfp', password: '1' });
    await patient.post('/api/me/cpf').send({ cpf: '12345678900' });
  });

  afterAll(async () => {
    await admin.delete(`/api/ecografias/${examId}`);
    await admin.delete('/api/users/cfp');
    fs.writeFileSync(ecoFile, JSON.stringify(originalEco, null, 2));
    fs.writeFileSync(usersFile, JSON.stringify(originalUsers, null, 2));
  });

  test('exame aparece para o paciente independente de formatacao', async () => {
    const res = await patient.get('/api/ecografias');
    const ids = res.body.map((e) => e.id);
    expect(ids).toContain(examId);
  });
});
