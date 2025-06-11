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
      form.style.display = 'none';
    } else {
      document.getElementById('error').textContent = 'CPF incorreto ou link expirado';
    }
  });
}
