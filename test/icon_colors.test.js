const fs = require('fs');
const path = require('path');

describe('Cores dos ícones', () => {
  test('botões têm ícones invertidos', () => {
    const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
    expect(css).toMatch(/button .icon\s*{[^}]*filter: brightness\(0\) invert\(1\);/);
  });
});
