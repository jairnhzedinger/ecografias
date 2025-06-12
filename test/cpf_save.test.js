const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const usersFile = path.join(__dirname, '../data/users.json');
const agent = request.agent(app);

let originalUsers;

beforeAll(() => {
  originalUsers = JSON.parse(fs.readFileSync(usersFile));
});

afterAll(() => {
  fs.writeFileSync(usersFile, JSON.stringify(originalUsers, null, 2));
});

test('usuario salva cpf apos login', async () => {
  await agent.post('/login').send({ username: 'admin', password: 'admin' });
  await agent.post('/api/me/cpf').send({ cpf: '111' }).expect(200);
  const me = await agent.get('/api/me');
  expect(me.body.cpf).toBe('111');
});
