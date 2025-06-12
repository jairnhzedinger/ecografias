const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const agent = request.agent(app);

const pdfBuffer = Buffer.from('dummy');
function createTempPdf() {
  const file = path.join(__dirname, 'tmpdel.pdf');
  fs.writeFileSync(file, pdfBuffer);
  return file;
}

describe('Excluir ecografia sem arquivo', () => {
  let id;
  let filename;
  let thumb;
  beforeAll(async () => {
    await agent.post('/login').send({ username: 'admin', password: 'admin' });
    const tmpPdf = createTempPdf();
    const res = await agent
      .post('/api/ecografias')
      .field('patientName', 'X')
      .field('cpf', '1')
      .field('examDate', '2020-01-01')
      .field('notes', 'n')
      .attach('file', tmpPdf);
    fs.unlinkSync(tmpPdf);
    id = res.body.id;
    filename = res.body.filename;
    thumb = res.body.thumbFilename;
    const up = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(up)) fs.unlinkSync(up);
    if (thumb) {
      const th = path.join(__dirname, '../thumbnails', thumb);
      if (fs.existsSync(th)) fs.unlinkSync(th);
    }
  });

  test('delecao responde ok mesmo sem arquivos', async () => {
    const res = await agent.delete(`/api/ecografias/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });
});
