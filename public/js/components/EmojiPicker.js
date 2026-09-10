import { EMOJI_LIBRARY } from '../utils/emojiLibrary.js';

export function renderEmojiGrid(containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  let html = '';
  for (const [category, emojis] of Object.entries(EMOJI_LIBRARY)) {
    html += `<div class="emoji-category-label">${category}</div>`;
    for (const emoji of emojis) {
      html += `<div class="emoji-cell" onclick="window.handleEmojiSelect('${emoji}', '${containerId}', this)">${emoji}</div>`;
    }
  }
  grid.innerHTML = html;
}

window.handleEmojiSelect = (emoji, containerId, element) => {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  grid.querySelectorAll('.emoji-cell').forEach(c => c.classList.remove('selected'));
  if (element) element.classList.add('selected');

  if (containerId === 'avatar-grid-create') {
    window.selectedCreateAvatar = emoji;
    const preview = document.getElementById('avatar-preview-create');
    if (preview) preview.textContent = emoji;
  } else if (containerId === 'avatar-grid-edit') {
    window.selectedEditAvatar = emoji;
    const preview = document.getElementById('avatar-preview-edit');
    if (preview) preview.textContent = emoji;
  }
};