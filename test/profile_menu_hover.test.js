/**
 * @jest-environment jsdom
 */

global.fetch = () => Promise.resolve({ ok: true, json: async () => ({}) });

const { initProfileMenu } = require('../public/common.js');

describe('Dropup do perfil', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="profile-menu">
        <img id="profilePic">
        <div id="profileDropdown" class="profile-dropdown"></div>
      </div>`;
  });

  test('abre ao passar o mouse', async () => {
    await initProfileMenu();
    const menu = document.querySelector('.profile-menu');
    const dropdown = document.getElementById('profileDropdown');
    menu.dispatchEvent(new Event('mouseenter'));
    expect(dropdown.classList.contains('show')).toBe(true);
    menu.dispatchEvent(new Event('mouseleave'));
    expect(dropdown.classList.contains('show')).toBe(false);
  });
});
