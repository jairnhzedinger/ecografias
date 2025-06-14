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

  test('abre ao clicar', async () => {
    await initProfileMenu();
    const pic = document.getElementById('profilePic');
    const dropdown = document.getElementById('profileDropdown');
    pic.dispatchEvent(new Event('click'));
    expect(dropdown.classList.contains('show')).toBe(true);
    document.dispatchEvent(new Event('click'));
    expect(dropdown.classList.contains('show')).toBe(false);
  });
});
