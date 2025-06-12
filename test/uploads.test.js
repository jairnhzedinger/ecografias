const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const admin = request.agent(app);
const patient1 = request.agent(app);
const patient2 = request.agent(app);
const ecoFile = path.join(__dirname, '../data/ecografias.json');
const usersFile = path.join(__dirname, '../data/users.json');
let originalEco;
let originalUsers;
let filename;
let examId;

const pdfBuffer = Buffer.from('u');
function createPdf() {
  const file = path.join(__dirname, 'up.pdf');
  fs.writeFileSync(file, pdfBuffer);
  return file;
}

describe('Permissao de acesso a uploads', () => {
  beforeAll(async () => {
    originalEco = JSON.parse(fs.readFileSync(ecoFile));
    originalUsers = JSON.parse(fs.readFileSync(usersFile));
    await admin.post('/login').send({ username: 'admin', password: 'admin' });
    const tmp = createPdf();
    const res = await admin
      .post('/api/ecografias')
      .field('patientName', 'U')
      .field('cpf', '111')
      .field('examDate', '2020-01-01')
      .field('notes', 'n')
      .attach('file', tmp);
    fs.unlinkSync(tmp);
    filename = res.body.filename;
    examId = res.body.id;
    await admin.post('/api/users').send({ username: 'p1', password: '1', role: 'paciente' });
    await admin.post('/api/users').send({ username: 'p2', password: '1', role: 'paciente' });
    await patient1.post('/login').send({ username: 'p1', password: '1' });
    await patient1.post('/api/me/cpf').send({ cpf: '111' });
    await patient2.post('/login').send({ username: 'p2', password: '1' });
    await patient2.post('/api/me/cpf').send({ cpf: '222' });
  });

  afterAll(async () => {
    await admin.delete(`/api/ecografias/${examId}`);
    await admin.delete('/api/users/p1');
    await admin.delete('/api/users/p2');
    fs.writeFileSync(ecoFile, JSON.stringify(originalEco, null, 2));
    fs.writeFileSync(usersFile, JSON.stringify(originalUsers, null, 2));
  });

  test('admin acessa arquivo', async () => {
    const res = await admin.get(`/uploads/${filename}`);
    expect(res.status).toBe(200);
  });

  test('paciente correto acessa arquivo', async () => {
    const res = await patient1.get(`/uploads/${filename}`);
    expect(res.status).toBe(200);
  });

  test('paciente incorreto nao acessa arquivo', async () => {
    const res = await patient2.get(`/uploads/${filename}`);
    expect(res.status).toBe(403);
  });
});
