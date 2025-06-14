const fs = require('fs');
const path = require('path');

describe('Visual de Usuarios', () => {
  test('tabela listrada e formulario estilizado', () => {
    const html = fs.readFileSync(path.join(__dirname, '../views/index.ejs'), 'utf8');
    expect(html).toMatch(/<table id="userList" class="table table-striped">/);
    expect(html).toMatch(/<form id="userForm" class="gestao-form">/);
  });
});
