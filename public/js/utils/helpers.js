export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function escapeAttr(text) {
  return text.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (8 + Math.random() * 12) + 's';
    particle.style.animationDelay = Math.random() * 10 + 's';
    const size = (2 + Math.random() * 3) + 'px';
    particle.style.width = size;
    particle.style.height = size;
    particle.style.background = Math.random() > 0.5 ? 'var(--gold)' : '#ff6b35';
    container.appendChild(particle);
  }
}

export function showToast(icon, title, message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

export function showLevelUp(level) {
  const overlay = document.createElement('div');
  overlay.className = 'level-up-overlay';
  overlay.innerHTML = `
    <div class="level-up-content">
      <h2>\u2694\uFE0F LEVEL UP! \u2694\uFE0F</h2>
      <p>You reached <strong style="color:var(--gold);font-size:1.5rem;">Level ${level}</strong>!</p>
      <p style="margin-top:10px;font-size:1rem;opacity:0.7;">Click to continue</p>
    </div>
  `;
  overlay.onclick = () => overlay.remove();
  document.body.appendChild(overlay);
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 4000);
}