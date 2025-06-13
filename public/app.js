async function api(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    location.href = '/login.html';
    return Promise.reject('nao autenticado');
  }
  return res;
}


function initScrollEffects() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.scroll-fade').forEach((el) => obs.observe(el));
  window.applyScroll = (el) => obs.observe(el);
}

initScrollEffects();

function openWindow(id) {
  const win = document.getElementById(id + 'Window');
  if (win) {
    win.style.display = 'block';
    win.classList.remove('maximized');
  }
}

function closeWindow(id) {
  const win = document.getElementById(id + 'Window');
  if (win) win.style.display = 'none';
}

function maximizeWindow(id) {
  const win = document.getElementById(id + 'Window');
  if (win) win.classList.toggle('maximized');
}

function makeDraggable(win) {
  const header = win.querySelector('.window-header');
  const resizer = win.querySelector('.window-resizer');
  if (header) {
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-actions')) return;
      const offsetX = e.clientX - win.offsetLeft;
      const offsetY = e.clientY - win.offsetTop;
      function onMove(ev) {
        win.style.left = ev.clientX - offsetX + 'px';
        win.style.top = ev.clientY - offsetY + 'px';
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', onMove);
      }, { once: true });
    });
  }
  if (resizer) {
    resizer.addEventListener('mousedown', (e) => {
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = win.offsetWidth;
      const startH = win.offsetHeight;
      function onMove(ev) {
        win.style.width = startW + ev.clientX - startX + 'px';
        win.style.height = startH + ev.clientY - startY + 'px';
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', onMove);
      }, { once: true });
    });
  }
}

document.querySelectorAll('.window').forEach(makeDraggable);
document.querySelectorAll('.dock-icon').forEach((i) => i.addEventListener('click', () => openWindow(i.dataset.window)));

window.openWindow = openWindow;
window.closeWindow = closeWindow;
window.maximizeWindow = maximizeWindow;
openWindow('upload');

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
      const data = await res.json();
      if (data.needCpf) {
        location.href = '/cpf.html';
      } else if (data.role === 'paciente') {
        location.href = '/painel.html';
      } else {
        location.href = '/';
      }
    } else if (res) {
      document.getElementById('loginError').textContent = 'Falha no login';
    }
  });
}

// Página de CPF
const cpfForm = document.getElementById('cpfForm');
if (cpfForm) {
  initProfileMenu();
  cpfForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cpf = cpfForm.querySelector('input[name="cpf"]').value.trim();
    const res = await api('/api/me/cpf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
    }).catch(() => {});
    if (res && res.ok) {
      location.href = "/painel.html";
    } else if (res) {
      document.getElementById('cpfError').textContent = 'Falha ao salvar CPF';
    }
  });
}

// Index page
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
  (async function initIndex() {
    initProfileMenu();
    let userRole = 'medico';
    try {
      const meRes = await api('/api/me');
      const me = await meRes.json();
      userRole = me.role;
    } catch (_) {}

    if (userRole !== 'admin') {
      document.querySelector('[data-window="usuarios"]').style.display = 'none';
      document.querySelector('[data-window="stats"]').style.display = 'none';
    }
    if (userRole === 'paciente') {
      document.querySelector('[data-window="upload"]').style.display = 'none';
      document.querySelector('[data-window="mensagem"]').style.display = 'none';
    }

  const lista = document.getElementById('lista');
  const tbody = lista.querySelector('tbody');
  const searchInput = document.getElementById('searchInput');
  const shareModal = document.getElementById('shareModal');
  const shareLinkEl = document.getElementById('shareLink');
  const shareClose = document.getElementById('shareClose');
  const qrCanvas = document.getElementById('qrCanvas');
  const icons = document.querySelectorAll('.dock-icon');
  const userForm = document.getElementById('userForm');
  const userList = document.querySelector('#userList tbody');
  const messageTemplate = document.getElementById('messageTemplate');
  const saveMessage = document.getElementById('saveMessage');
  const statsInfo = document.getElementById('statsInfo');
  const refreshStats = document.getElementById('refreshStats');
  const downloadsBody = document.querySelector('#downloadsTable tbody');
  const waStatus = document.getElementById('waStatus');
  const waReset = document.getElementById('waReset');

  icons.forEach((icon) => {
    icon.addEventListener('click', () => openWindow(icon.dataset.window));
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
      const unshareBtn = document.createElement('button');
      unshareBtn.textContent = 'Desativar';
      unshareBtn.onclick = async () => {
        await api(`/api/ecografias/${item.id}/unshare`, { method: 'POST' });
        carregar(searchInput.value);
      };
      const pdfLink = document.createElement('a');
      pdfLink.textContent = 'PDF';
      pdfLink.href = `/api/ecografias/${item.id}/pdf`;
      pdfLink.target = '_blank';
      if (userRole === 'paciente') {
        actionsTd.appendChild(pdfLink);
      } else {
        actionsTd.appendChild(shareBtn);
        actionsTd.appendChild(resendBtn);
        actionsTd.appendChild(delBtn);
        actionsTd.appendChild(unshareBtn);
        actionsTd.appendChild(pdfLink);
      }
      tr.appendChild(previewTd);
      tr.appendChild(patientTd);
      tr.appendChild(dateTd);
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
  if (window.applyScroll) window.applyScroll(tr);
    });
  }

  async function loadUsers() {
    const res = await api('/api/users');
    const list = await res.json();
    userList.innerHTML = '';
    list.forEach((u) => {
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td');
      nameTd.textContent = u;
      const actTd = document.createElement('td');
      const passBtn = document.createElement('button');
      passBtn.textContent = 'Senha';
      passBtn.onclick = async () => {
        const pw = prompt('Nova senha:');
        if (pw) {
          await api(`/api/users/${u}/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pw }),
          });
        }
      };
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Excluir';
      delBtn.onclick = async () => {
        await api(`/api/users/${u}`, { method: 'DELETE' });
        loadUsers();
      };
      const roleBtn = document.createElement('button');
      roleBtn.textContent = 'Papel';
      roleBtn.onclick = async () => {
        const role = prompt('admin, medico ou paciente?');
        if (role) {
          await api(`/api/users/${u}/role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
          });
        }
      };
      actTd.appendChild(passBtn);
      actTd.appendChild(delBtn);
      actTd.appendChild(roleBtn);
      tr.appendChild(nameTd);
      tr.appendChild(actTd);
      userList.appendChild(tr);
  if (window.applyScroll) window.applyScroll(tr);
    });
  }

  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(userForm).entries());
      await api('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      userForm.reset();
      loadUsers();
    });
    loadUsers();
  }

  async function loadMessage() {
    const res = await api('/api/message');
    const data = await res.json();
    messageTemplate.value = data.message;
  }
  if (saveMessage) {
    saveMessage.addEventListener('click', async () => {
      await api('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageTemplate.value }),
      });
    });
    loadMessage();
  }

  async function loadStats() {
    const res = await api('/api/stats');
    const data = await res.json();
    statsInfo.textContent = `Exames: ${data.totalEcografias}, Downloads: ${data.totalDownloads}`;
    const dres = await api('/api/downloads');
    const list = await dres.json();
    downloadsBody.innerHTML = '';
    list.forEach((d) => {
      const tr = document.createElement('tr');
      const idTd = document.createElement('td');
      idTd.textContent = d.id;
      const dateTd = document.createElement('td');
      dateTd.textContent = new Date(d.timestamp).toLocaleString();
      tr.appendChild(idTd);
      tr.appendChild(dateTd);
      downloadsBody.appendChild(tr);
  if (window.applyScroll) window.applyScroll(tr);
    });
  }
  if (refreshStats) {
    refreshStats.addEventListener('click', loadStats);
    loadStats();
  }

  async function checkWa() {
    const res = await api('/api/whatsapp/status');
    const data = await res.json();
    waStatus.textContent = data.ready ? 'WhatsApp conectado' : 'WhatsApp desconectado';
  }
  if (waReset) {
    waReset.addEventListener('click', async () => {
      await api('/api/whatsapp/reset', { method: 'POST' });
      checkWa();
    });
    checkWa();
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
  })();
}

// Painel do paciente
const painel = document.getElementById('painel');
if (painel) {
  (async function initPainel() {
    initProfileMenu();
    const grid = document.getElementById('examGrid');
    const res = await api('/api/ecografias');
    const data = await res.json();
    grid.innerHTML = '';
    data.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'card';
      const link = document.createElement('a');
      link.href = `/api/ecografias/${item.id}/pdf`;
      link.target = '_blank';
      if (item.thumbFilename) {
        const img = document.createElement('img');
        img.src = '/thumbs/' + item.thumbFilename;
        link.appendChild(img);
      } else {
        const div = document.createElement('div');
        div.textContent = 'PDF';
        link.appendChild(div);
      }
      const date = document.createElement('p');
      date.textContent = item.examDate;
      card.appendChild(link);
      card.appendChild(date);
      grid.appendChild(card);
      if (window.applyScroll) window.applyScroll(card);
    });
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await api('/logout', { method: 'POST' });
      location.href = '/login.html';
    });
  })();
}
