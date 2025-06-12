const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const agent = request.agent(app);

const pdfBuffer = Buffer.from('dummy');

function createTempPdf() {
  const file = path.join(__dirname, 'tmp.pdf');
  fs.writeFileSync(file, pdfBuffer);
  return file;
}

describe('Compartilhamento', () => {
  let id;
  let token;
  const cpf = '12345678900';
  beforeAll(async () => {
    await agent
      .post('/login')
      .send({ username: 'admin', password: 'admin' })
      .expect(200);

    const tmpPdf = createTempPdf();
    const res = await agent
      .post('/api/ecografias')
      .field('patientName', 'Teste')
      .field('cpf', cpf)
      .field('examDate', '2020-01-01')
      .field('notes', 'teste')
      .attach('file', tmpPdf);

    fs.unlinkSync(tmpPdf);

    id = res.body.id;

    const shareRes = await agent.post(`/api/ecografias/${id}/share`).expect(200);
    token = shareRes.body.url.split('/').pop();
  });

  test('pagina de compartilhamento deve conter botao de download', async () => {
    const res = await agent.get(`/share/${token}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="downloadLink"');
  });

  test('deve aceitar CPF correto e retornar PDF', async () => {
    const res = await agent
      .post(`/share/${token}`)
      .send({ cpf });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  test('deve rejeitar CPF incorreto', async () => {
    const res = await agent
      .post(`/share/${token}`)
      .send({ cpf: '000' });
    expect(res.status).toBe(403);
  });
});
