const request = require('supertest');
const app = require('../index');

const agent = request.agent(app);

describe('Gerenciamento de usuários', () => {
  beforeAll(async () => {
    await app.ready;
    await agent.post('/login').send({ username: 'admin', password: 'admin' });
  });

  test('criar e remover usuário', async () => {
    await agent.delete('/api/users/novo');
    await agent
      .post('/api/users')
      .send({ username: 'novo', password: '123' })
      .expect(200);

    const list = await agent.get('/api/users').expect(200);
    expect(list.body).toContain('novo');

    await agent.delete('/api/users/novo').expect(200);
    const list2 = await agent.get('/api/users').expect(200);
    expect(list2.body).not.toContain('novo');
  });
});
