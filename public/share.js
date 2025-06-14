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
}

initScrollEffects();
initProfileMenu();

const form = document.getElementById('cpfForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cpf = document.getElementById('cpfInput').value.trim();
    const res = await fetch(location.pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      document.getElementById('pdfEmbed').src = url;
      document.getElementById('pdfContainer').style.display = 'block';
      const link = document.getElementById('downloadLink');
      link.href = url;
      link.style.display = 'inline-block';
      form.style.display = 'none';
    } else {
      document.getElementById('error').textContent = 'CPF incorreto ou link expirado';
    }
  });
}
