import { loadUsers, updateUser } from '../services/api.js';
import { createModal, closeModal } from './Modal.js';
import { showToast, escapeAttr, escapeHtml } from '../utils/helpers.js';
import { GUILD_CHARACTERS } from '../characters.js';

window.selectedEditAvatar = '\u{1F9D1}';

function guildCharacterCards(selectedId) {
  return GUILD_CHARACTERS.map(character => `<button type="button" class="guild-character-choice ${character.id === selectedId ? 'active' : ''}" data-character="${character.id}" ${character.id === selectedId ? 'disabled aria-current="true"' : ''}><img src="${character.portrait}" alt=""><span><strong>${escapeHtml(character.name)}</strong><small>${escapeHtml(character.role)}</small><em>${character.id === selectedId ? 'Selected guild hero' : escapeHtml(character.story)}</em></span></button>`).join('');
}
window.editingUserId = null;

window.openEditCharModal = async (userId) => {
  window.editingUserId = userId;
  const users = await loadUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    showToast('\u26A0\uFE0F', 'Error', 'User not found.');
    return;
  }

  window.selectedEditAvatar = GUILD_CHARACTERS.some(character => character.id === user.avatar) ? user.avatar : GUILD_CHARACTERS[0].id;

  const content = `
    <div class="modal-header">
      <h3 class="modal-title">\u270F\uFE0F Edit Adventurer</h3>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div class="form-group" style="margin-bottom:14px;">
      <label for="edit-player-tag">Your Player Tag</label>
      <input type="text" id="edit-player-tag" value="${escapeAttr(user.playerTag || '')}" placeholder="e.g., Bob, Mum, Player One" maxlength="30" autofocus>
    </div>
    <p class="guild-intro">Choose a guild hero. The muted card is the identity selected for this adventurer.</p>
    <div class="guild-character-grid" id="edit-guild-character-grid">${guildCharacterCards(window.selectedEditAvatar)}</div>
    <div class="modal-actions">
      <button class="btn-modal btn-cancel" onclick="window.closeModal()">Cancel</button>
      <button class="btn-modal btn-save" onclick="window.handleSaveEditChar()">\u{1F4BE} Save Changes</button>
    </div>
  `;

  const overlay = createModal(content);
  overlay.querySelector('.modal')?.classList.add('guild-selection-modal');
  overlay.querySelector('#edit-guild-character-grid').addEventListener('click', event => {
    const choice = event.target.closest('[data-character]');
    if (!choice) return;
    window.selectedEditAvatar = choice.dataset.character;
    overlay.querySelector('#edit-guild-character-grid').innerHTML = guildCharacterCards(window.selectedEditAvatar);
  });
};

window.handleSaveEditChar = async () => {
  const playerTag = document.getElementById('edit-player-tag').value.trim();
  const character = GUILD_CHARACTERS.find(item => item.id === window.selectedEditAvatar);
  if (!playerTag) {
    showToast('\u26A0\uFE0F', 'Player Tag Required', 'Add a short tag so the party knows who is playing this hero.');
    return;
  }

  const result = await updateUser(window.editingUserId, {
    name: character.name,
    avatar: character.id,
    playerTag
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