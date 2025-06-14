const fs = require('fs');
const path = require('path');

describe('Estilos do dropup do perfil', () => {
  const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

  test('largura e cor padrao', () => {
    expect(css).toMatch(/\.profile-dropdown\s*{[^}]*width: max-content;[^}]*color: var\(--text-light\);/s);
  });

  test('icones sem filtro inicial', () => {
    expect(css).toMatch(/\.profile-dropdown .icon\s*{[^}]*filter: none;[^}]*}/);
  });
});
