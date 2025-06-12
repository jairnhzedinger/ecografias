const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const agent = request.agent(app);
const pdfBuffer = Buffer.from('cleanup');

function tempPdf() {
  const file = path.join(__dirname, 'cleanup.pdf');
  fs.writeFileSync(file, pdfBuffer);
  return file;
}

describe('Remocao de tokens ao deletar exame', () => {
  let token;

  beforeAll(async () => {
    await app.ready;
    await agent.post('/login').send({ username: 'admin', password: 'admin' });
    const tmp = tempPdf();
    const upload = await agent
      .post('/api/ecografias')
      .field('patientName', 'Del')
      .field('cpf', '1')
      .field('examDate', '2020-01-01')
      .field('notes', 'n')
      .attach('file', tmp);
    fs.unlinkSync(tmp);
    const id = upload.body.id;
    const share = await agent.post(`/api/ecografias/${id}/share`);
    token = share.body.url.split('/').pop();
    await agent.delete(`/api/ecografias/${id}`).expect(200);
  });

  test('token fica invalido apos exclusao', async () => {
    const res = await agent.get(`/share/${token}`);
    expect(res.status).toBe(404);
  });
});
