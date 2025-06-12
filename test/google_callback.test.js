const request = require('supertest');
const fs = require('fs');
const path = require('path');

let infoData = { data: { email: 'guser@test.com', name: 'G User', picture: 'p', id: '123' } };

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        redirectUri: '',
        generateAuthUrl: ({ state, redirect_uri }) =>
          `https://accounts.google.com/o/oauth2/auth?state=${state}&redirect_uri=${encodeURIComponent(redirect_uri)}`,
        getToken: jest.fn().mockResolvedValue({ tokens: {} }),
        setCredentials: jest.fn(),
      })),
    },
    oauth2: jest.fn().mockImplementation(() => ({
      userinfo: { get: jest.fn(() => Promise.resolve(infoData)) },
    })),
  },
}));

delete require.cache[require.resolve('../index')];
const app = require('../index');
const usersFile = path.join(__dirname, '../data/users.json');
const agent = request.agent(app);

afterAll(() => {
  const users = JSON.parse(fs.readFileSync(usersFile));
  delete users['guser@test.com'];
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
});

test('novo usuario google vira paciente', async () => {
  const auth = await agent.get('/auth/google');
  const state = /state=([^&]+)/.exec(auth.headers.location)[1];
  await agent.get('/auth/google/callback').query({ code: 'x', state });
  const me = await agent.get('/api/me');
  expect(me.body).toMatchObject({
    username: 'guser@test.com',
    role: 'paciente',
    name: 'G User',
    picture: 'p',
  });
});
