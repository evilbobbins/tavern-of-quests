import { loadUsers, updateUser } from '../services/api.js';
import { renderEmojiGrid } from './EmojiPicker.js';
import { createModal, closeModal } from './Modal.js';
import { showToast, escapeAttr } from '../utils/helpers.js';

window.selectedEditAvatar = '\u{1F9D1}';
window.editingUserId = null;

window.openEditCharModal = async (userId) => {
  window.editingUserId = userId;
  const users = await loadUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    showToast('\u26A0\uFE0F', 'Error', 'User not found.');
    return;
  }

  window.selectedEditAvatar = user.avatar;

  const content = `
    <div class="modal-header">
      <h3 class="modal-title">\u270F\uFE0F Edit Adventurer</h3>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="form-group" style="margin-bottom:14px;">
      <label>Character Name</label>
      <input type="text" id="edit-char-name" value="${escapeAttr(user.name)}" maxlength="30">
    </div>
    <div class="emoji-picker-container">
      <span class="emoji-picker-label">Choose Avatar</span>
      <div class="emoji-selected-preview">
        <span class="preview-emoji" id="avatar-preview-edit">${window.selectedEditAvatar}</span>
        <span class="preview-text">Selected Avatar</span>
      </div>
      <div class="emoji-grid" id="avatar-grid-edit"></div>
    </div>
    <div class="modal-actions">
      <button class="btn-modal btn-cancel" onclick="window.closeModal()">Cancel</button>
      <button class="btn-modal btn-save" onclick="window.handleSaveEditChar()">\u{1F4BE} Save Changes</button>
    </div>
  `;

  createModal(content);

  setTimeout(() => {
    renderEmojiGrid('avatar-grid-edit');
    const cells = document.querySelectorAll('#avatar-grid-edit .emoji-cell');
    for (let cell of cells) {
      if (cell.textContent.trim() === window.selectedEditAvatar) {
        window.handleEmojiSelect(cell.textContent, 'avatar-grid-edit', cell);
        break;
      }
    }
  }, 50);
};

window.handleSaveEditChar = async () => {
  const name = document.getElementById('edit-char-name').value.trim();
  if (!name) {
    showToast('\u26A0\uFE0F', 'Name Required', 'Please enter a character name.');
    return;
  }

  const result = await updateUser(window.editingUserId, {
    name: name,
    avatar: window.selectedEditAvatar
  });

  if (result.success) {
    closeModal();
    showToast('\u270F\uFE0F', 'Adventurer Updated!', 'Character details have been changed.');
    if (window.showCharacterSelect) window.showCharacterSelect();
    if (window.editingUserId === window.currentUserId && window.updateCurrentUserDisplay) {
      window.updateCurrentUserDisplay();
    }
  } else {
    showToast('\u26A0\uFE0F', 'Update Failed', result.error || 'Could not update character.');
  }
};