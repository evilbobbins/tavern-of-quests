import { createUser } from '../services/api.js';
import { renderEmojiGrid } from './EmojiPicker.js';
import { createModal, closeModal } from './Modal.js';
import { showToast } from '../utils/helpers.js';

window.selectedCreateAvatar = '\u{1F9D1}';

export function openCreateCharModal() {
  window.selectedCreateAvatar = '\u{1F9D1}';

  const content = `
    <div class="modal-header">
      <h3 class="modal-title">\u{1F9D9} Create Adventurer</h3>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="form-group" style="margin-bottom:14px;">
      <label>Character Name</label>
      <input type="text" id="new-char-name" placeholder="e.g., Gandalf, Aragorn..." maxlength="30">
    </div>
    <div class="emoji-picker-container">
      <span class="emoji-picker-label">Choose Avatar</span>
      <div class="emoji-selected-preview">
        <span class="preview-emoji" id="avatar-preview-create">${window.selectedCreateAvatar}</span>
        <span class="preview-text">Selected Avatar</span>
      </div>
      <div class="emoji-grid" id="avatar-grid-create"></div>
    </div>
    <div class="modal-actions">
      <button class="btn-modal btn-cancel" onclick="window.closeModal()">Cancel</button>
      <button class="btn-modal btn-save" onclick="window.handleCreateCharacter()">+ Create</button>
    </div>
  `;

  createModal(content);

  setTimeout(() => {
    renderEmojiGrid('avatar-grid-create');
    const defaultCell = document.querySelector('#avatar-grid-create .emoji-cell');
    if (defaultCell) window.handleEmojiSelect(defaultCell.textContent, 'avatar-grid-create', defaultCell);
  }, 50);
}

window.handleCreateCharacter = async () => {
  const name = document.getElementById('new-char-name').value.trim();
  if (!name) {
    showToast('\u26A0\uFE0F', 'Name Required', 'Please enter a character name.');
    return;
  }

  const result = await createUser(name, window.selectedCreateAvatar);
  if (result.success) {
    closeModal();
    window.currentUserId = result.user.id;
    localStorage.setItem('tavern_current_user', result.user.id);
    if (window.loadAppState) window.loadAppState();
    showToast('\u{1F9D9}', 'Adventurer Created!', `Welcome to the tavern, ${name}!`);
  } else {
    showToast('\u26A0\uFE0F', 'Creation Failed', result.error || 'Could not create character.');
  }
};