async function initProfileMenu() {
  const pic = document.getElementById('profilePic');
  const dropdown = document.getElementById('profileDropdown');
  if (!pic) return;
  try {
    const fetchFn = typeof api === 'function' ? api : fetch;
    const res = await fetchFn('/api/me');
    if (res.ok) {
      const me = await res.json();
      if (me.picture) pic.src = me.picture;
    }
  } catch (_) {}
  const container = pic.parentElement;
  container.addEventListener('mouseenter', () => {
    dropdown.classList.add('show');
  });
  container.addEventListener('mouseleave', () => {
    dropdown.classList.remove('show');
  });
  pic.addEventListener('click', () => {
    dropdown.classList.toggle('show');
  });
  document.addEventListener('click', (e) => {
    if (e.target !== pic && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
}

if (typeof module !== 'undefined') {
  module.exports = { initProfileMenu };
}
