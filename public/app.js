function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
}

async function api(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    location.href = '/login.html';
    return Promise.reject('nao autenticado');
  }
  return res;
}

initTheme();

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
  const tbody = lista.querySelector('tbody');
  const searchInput = document.getElementById('searchInput');
  const shareModal = document.getElementById('shareModal');
  const shareLinkEl = document.getElementById('shareLink');
  const shareClose = document.getElementById('shareClose');
  const qrCanvas = document.getElementById('qrCanvas');
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      contents.forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');
    });
  });

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
    tbody.innerHTML = '';
    data.forEach((item) => {
      const tr = document.createElement('tr');
      const previewTd = document.createElement('td');
      if (item.thumbFilename) {
        const img = document.createElement('img');
        img.src = '/thumbs/' + item.thumbFilename;
        previewTd.appendChild(img);
      } else {
        previewTd.textContent = 'PDF';
      }
      const patientTd = document.createElement('td');
      patientTd.textContent = item.patientName;
      const dateTd = document.createElement('td');
      dateTd.textContent = item.examDate;
      const actionsTd = document.createElement('td');

      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Compartilhar';
      shareBtn.onclick = async () => {
        const r = await api(`/api/ecografias/${item.id}/share`, { method: 'POST' });
        const d = await r.json();
        const link = location.origin + d.url;
        shareLinkEl.textContent = link;
        shareLinkEl.href = link;
        QRCode.toCanvas(qrCanvas, link, { width: 200 });
        shareModal.style.display = 'flex';
      };
      const resendBtn = document.createElement('button');
      resendBtn.textContent = 'Reenviar WhatsApp';
      resendBtn.onclick = async () => {
        await api(`/api/ecografias/${item.id}/resend`, { method: 'POST' });
        alert('Link reenviado via WhatsApp');
      };
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Excluir';
      delBtn.onclick = async () => {
        await api(`/api/ecografias/${item.id}`, { method: 'DELETE' });
        carregar(searchInput.value);
      };
      actionsTd.appendChild(shareBtn);
      actionsTd.appendChild(resendBtn);
      actionsTd.appendChild(delBtn);
      tr.appendChild(previewTd);
      tr.appendChild(patientTd);
      tr.appendChild(dateTd);
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
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
