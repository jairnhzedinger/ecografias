/**
 * @jest-environment jsdom
 */

global.requestAnimationFrame = (fn) => fn();
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
};

const { showList, showSection } = require('../public/app.js');

describe('Animacao menu gestao', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="gestao-body">
        <div class="gestao-menu"></div>
        <div class="gestao-content">
          <div id="gestaoBack"></div>
          <div id="s1" class="gestao-section"></div>
          <div id="s2" class="gestao-section"></div>
        </div>
      </div>`;
  });

  test('showSection exibe secao e aplica classe', () => {
    showSection('s1');
    const body = document.querySelector('.gestao-body');
    expect(body.classList.contains('show-section')).toBe(true);
    expect(document.getElementById('gestaoBack').style.display).toBe('block');
    expect(document.getElementById('s1').style.display).toBe('block');
    expect(document.getElementById('s2').style.display).toBe('none');
  });

  test('showList volta para o menu', () => {
    showSection('s1');
    showList();
    const body = document.querySelector('.gestao-body');
    expect(body.classList.contains('show-section')).toBe(false);
    expect(document.getElementById('gestaoBack').style.display).toBe('none');
    expect(document.getElementById('s1').style.display).toBe('none');
  });
});
