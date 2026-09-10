export function createModal(content, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.onclick = (e) => e.stopPropagation();
  
  const inner = document.createElement('div');
  inner.className = 'modal-inner';
  inner.innerHTML = content;
  
  modal.appendChild(inner);
  overlay.appendChild(modal);
  
  overlay.onclick = (e) => {
    if (e.target === overlay && onClose) onClose();
  };
  
  document.body.appendChild(overlay);
  return overlay;
}

export function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

// New function to close only the topmost modal
export function closeTopModal() {
  const modals = document.querySelectorAll('.modal-overlay');
  if (modals.length > 0) {
    modals[modals.length - 1].remove();
  }
}