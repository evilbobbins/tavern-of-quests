import { loadUsers, deleteUser } from '../services/api.js';
import { escapeHtml } from '../utils/helpers.js';
import { openCreateCharModal } from './CreateCharacter.js';
import { adventurerLabel, avatarMarkup } from '../characters.js';

export async function renderCharacterSelect() {
  const container = document.getElementById('char-select-screen');
  const users = await loadUsers();
  
  if (users.length === 0) {
    container.innerHTML = `
      <h1 class="char-select-title">The Tavern of Quests</h1>
      <p class="char-select-subtitle">Select your adventurer to begin</p>
      <div class="char-grid">
        <div style="grid-column:1/-1; text-align:center; color:var(--parchment-dark); font-style:italic; padding:40px;">
          No adventurers yet. Create one to begin!
        </div>
      </div>
      <button class="btn-create-char" id="btn-create-char">+ Create New Adventurer</button>
    `;
    document.getElementById('btn-create-char')?.addEventListener('click', openCreateCharModal);
    return;
  }
  
  const gridHtml = users.map(u => `
    <div class="char-card" onclick="window.selectUser('${u.id}')">
      <div class="char-actions">
        <button class="char-action-btn char-edit-btn" onclick="event.stopPropagation(); window.openEditCharModal('${u.id}')" title="Edit character">\u270F\uFE0F</button>
        <button class="char-action-btn char-delete-btn" onclick="event.stopPropagation(); window.deleteUser('${u.id}')" title="Delete character">&times;</button>
      </div>
      <div class="char-avatar">${avatarMarkup(u.avatar)}</div>
      <div class="char-name">${escapeHtml(adventurerLabel(u))}</div>
      <div class="char-stats">Level ${u.level} \u2022 ${u.questCount} Quests</div>
      ${(u.championGames || []).length ? `<div class="char-champion-badges">${u.championGames.includes('runefall') ? '<span>🔷 Runefall Champion</span>' : ''}${u.championGames.includes('memory') ? '<span>🃏 Relic Recall Champion</span>' : ''}</div>` : ''}
    </div>
  `).join('');
  
  container.innerHTML = `
    <h1 class="char-select-title">The Tavern of Quests</h1>
    <p class="char-select-subtitle">Select your adventurer to begin</p>
    <div class="char-grid">${gridHtml}</div>
    <button class="btn-create-char" id="btn-create-char">+ Create New Adventurer</button>
  `;
  
  document.getElementById('btn-create-char')?.addEventListener('click', openCreateCharModal);
}

window.selectUser = (userId) => {
  window.currentUserId = userId;
  localStorage.setItem('tavern_current_user', userId);
  if (window.loadAppState) window.loadAppState();
};

window.deleteUser = async (userId) => {
  if (!confirm('Delete this adventurer and all their quests? This cannot be undone.')) return;
  const result = await deleteUser(userId);
  if (result.success) {
    if (window.currentUserId === userId) {
      window.currentUserId = null;
      localStorage.removeItem('tavern_current_user');
    }
    await renderCharacterSelect();
    if (window.showToast) window.showToast('\u{1F5D1}\uFE0F', 'Adventurer Deleted', 'The character has been removed from the realm.');
  }
};