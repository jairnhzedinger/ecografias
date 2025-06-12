const fs = require('fs');
const path = require('path');

describe('Interface do painel', () => {
  test('aba de estatisticas escondida para nao admin', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
    const regex = /userRole !== 'admin'[\s\S]*\[data-tab="stats"\]/;
    expect(regex.test(appJs)).toBe(true);
  });
});
