async function api(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    location.href = '/login.html';
    return Promise.reject('nao autenticado');
  }
  return res;
}

// Login page
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    const res = await api('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
    if (res && res.ok) {
      location.href = '/index.html';
    } else if (res) {
      document.getElementById('loginError').textContent = 'Falha no login';
    }
  });
}

// Index page
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
  const lista = document.getElementById('lista');
  const searchInput = document.getElementById('searchInput');
  const shareModal = document.getElementById('shareModal');
  const shareLinkEl = document.getElementById('shareLink');
  const shareClose = document.getElementById('shareClose');
  const qrCanvas = document.getElementById('qrCanvas');

  if (shareClose) {
    shareClose.addEventListener('click', () => {
      shareModal.style.display = 'none';
    });
    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) shareModal.style.display = 'none';
    });
  }

  async function carregar(q = '') {
    const res = await api('/api/ecografias' + (q ? `?q=${encodeURIComponent(q)}` : ''));
    const data = await res.json();
    lista.innerHTML = '';
    data.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'card';
      if (item.thumbFilename) {
        const img = document.createElement('img');
        img.src = '/thumbs/' + item.thumbFilename;
        div.appendChild(img);
      } else {
        const span = document.createElement('span');
        span.textContent = 'PDF';
        div.appendChild(span);
      }
      const p = document.createElement('p');
      p.textContent = `${item.patientName} - ${item.examDate}`;
      div.appendChild(p);
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Compartilhar';
      shareBtn.onclick = async () => {
        const r = await api(`/api/ecografias/${item.id}/share`, { method: 'POST' });
        const d = await r.json();
        const link = location.origin + d.url;
        shareLinkEl.textContent = link;
        QRCode.toCanvas(qrCanvas, link, { width: 200 });
        shareModal.style.display = 'flex';
      };
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Excluir';
      delBtn.onclick = async () => {
        await api(`/api/ecografias/${item.id}`, { method: 'DELETE' });
        carregar(searchInput.value);
      };
      div.appendChild(shareBtn);
      div.appendChild(delBtn);
      lista.appendChild(div);
    });
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    await api('/api/ecografias', { method: 'POST', body: formData });
    uploadForm.reset();
    carregar();
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await api('/logout', { method: 'POST' });
    location.href = '/login.html';
  });

  searchInput.addEventListener('input', () => carregar(searchInput.value));
  carregar();
}
