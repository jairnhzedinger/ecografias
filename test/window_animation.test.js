/**
 * @jest-environment jsdom
 */

global.requestAnimationFrame = (fn) => fn();
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
};

const { openWindow, closeWindow } = require('../public/app.js');

describe('Animacao de janelas', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="testeWindow" class="window"></div>';
  });

  test('openWindow aplica classe visible', () => {
    openWindow('teste');
    const win = document.getElementById('testeWindow');
    expect(win.classList.contains('visible')).toBe(true);
    expect(win.style.display).toBe('block');
  });

  test('closeWindow remove classe e esconde apos transicao', () => {
    const win = document.getElementById('testeWindow');
    openWindow('teste');
    closeWindow('teste');
    expect(win.classList.contains('visible')).toBe(false);
    win.dispatchEvent(new Event('transitionend'));
    expect(win.style.display).toBe('none');
  });
});
