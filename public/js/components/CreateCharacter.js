import { createUser } from '../services/api.js';
import { createModal, closeModal } from './Modal.js';
import { showToast, escapeHtml } from '../utils/helpers.js';
import { GUILD_CHARACTERS } from '../characters.js';

window.selectedCreateAvatar = GUILD_CHARACTERS[0].id;

function characterCards(selectedId) {
  return GUILD_CHARACTERS.map(character => `<button type="button" class="guild-character-choice ${character.id === selectedId ? 'selected' : ''}" data-character="${character.id}"><img src="${character.portrait}" alt=""><span><strong>${escapeHtml(character.name)}</strong><small>${escapeHtml(character.role)}</small><em>${escapeHtml(character.story)}</em></span></button>`).join('');
}

export function openCreateCharModal() {
  window.selectedCreateAvatar = GUILD_CHARACTERS[0].id;
  const overlay = createModal(`
    <div class="modal-header"><h3 class="modal-title">🛡️ Join the Guild</h3><button class="modal-close" onclick="window.closeModal()">&times;</button></div>
    <p class="guild-intro">Choose the hero you will embody, then add a player tag so the party knows who is at the table.</p>
    <div class="guild-character-grid" id="guild-character-grid">${characterCards(window.selectedCreateAvatar)}</div>
    <div class="form-group" style="margin-top:16px;"><label for="new-player-tag">Your Player Tag</label><input type="text" id="new-player-tag" placeholder="e.g., Bob, Mum, Player One" maxlength="30" autofocus></div>
    <div class="modal-actions"><button class="btn-modal btn-cancel" onclick="window.closeModal()">Cancel</button><button class="btn-modal btn-save" id="btn-create-guild-character">⚔️ Begin Adventure</button></div>
  `);
  overlay.querySelector('#guild-character-grid').addEventListener('click', event => {
    const choice = event.target.closest('[data-character]');
    if (!choice) return;
    window.selectedCreateAvatar = choice.dataset.character;
    overlay.querySelector('#guild-character-grid').innerHTML = characterCards(window.selectedCreateAvatar);
  });
  overlay.querySelector('#btn-create-guild-character').onclick = window.handleCreateCharacter;
}

window.handleCreateCharacter = async () => {
  const tag = document.getElementById('new-player-tag')?.value.trim();
  const character = GUILD_CHARACTERS.find(item => item.id === window.selectedCreateAvatar);
  if (!tag) { showToast('⚠️', 'Player Tag Required', 'Add a short tag so the party knows who is playing this hero.'); return; }
  const result = await createUser(character.name, character.id, tag);
  if (result.success) {
    closeModal(); window.currentUserId = result.user.id; localStorage.setItem('tavern_current_user', result.user.id);
    if (window.loadAppState) window.loadAppState();
    showToast('🛡️', 'Adventurer Joined!', `${character.name} now answers to ${tag}.`);
  } else showToast('⚠️', 'Creation Failed', result.error || 'Could not create character.');
};
