const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const agent = request.agent(app);

const pdfBuffer = Buffer.from('dummy');
function createTempPdf() {
  const file = path.join(__dirname, 'tmp2.pdf');
  fs.writeFileSync(file, pdfBuffer);
  return file;
}

describe('Novas funcionalidades', () => {
  beforeAll(async () => {
    await agent.post('/login').send({ username: 'admin', password: 'admin' });
  });

  test('mensagem pode ser atualizada', async () => {
    const res = await agent.post('/api/message').send({ message: 'Teste {link}' });
    expect(res.status).toBe(200);
    const get = await agent.get('/api/message');
    expect(get.body.message).toBe('Teste {link}');
  });

  test('stats e downloads funcionam', async () => {
    const tmpPdf = createTempPdf();
    const upload = await agent
      .post('/api/ecografias')
      .field('patientName', 'X')
      .field('cpf', '1')
      .field('examDate', '2020-01-01')
      .field('notes', 'n')
      .attach('file', tmpPdf);
    fs.unlinkSync(tmpPdf);
    const id = upload.body.id;
    const share = await agent.post(`/api/ecografias/${id}/share`);
    const token = share.body.url.split('/').pop();
    await agent.post(`/share/${token}`).send({ cpf: '1' });
    const d = await agent.get('/api/downloads');
    expect(Array.isArray(d.body)).toBe(true);
    const stats = await agent.get('/api/stats');
    expect(stats.body.totalEcografias).toBeGreaterThan(0);
    expect(stats.body.totalDownloads).toBeGreaterThanOrEqual(0);
  });

  test('senha de usuário pode ser alterada', async () => {
    await agent.post('/api/users').send({ username: 'temp', password: '1' }).expect(200);
    await agent
      .post('/api/users/temp/password')
      .send({ password: '2' })
      .expect(200);
    await agent.delete('/api/users/temp').expect(200);
  });
});
