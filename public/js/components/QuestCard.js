import { escapeHtml } from '../utils/helpers.js';
import { CONFIG } from '../config.js';

export function createQuestCard(quest, category) {
  const card = document.createElement('div');
  card.className = `quest-card priority-${quest.priority}`;
  
  const tagClass = category.builtin 
    ? (category.id === 'household' ? 'tag-household' : 'tag-technology')
    : 'tag-custom';
  
  card.innerHTML = `
    <div class="quest-card-top">
      <div class="quest-checkbox" onclick="window.toggleQuest('${quest.id}')"></div>
      <div class="quest-info">
        <div class="quest-name">${escapeHtml(quest.name)}</div>
        <div class="quest-meta">
          <span class="quest-tag ${tagClass}">${category.emoji} ${escapeHtml(category.name)}</span>
          <span class="tag-priority priority-${quest.priority}-badge">${CONFIG.PRIORITY_LABELS[quest.priority]}</span>
          <span class="quest-xp">\u2728 ${quest.xp} XP</span>
        </div>
        ${quest.description ? `<div class="quest-description">${escapeHtml(quest.description)}</div>` : ''}
      </div>
      <div class="quest-actions">
        <button class="quest-btn edit-btn" onclick="window.openEditModal('${quest.id}')" title="Edit">\u270F\uFE0F</button>
        <button class="quest-btn delete-btn" onclick="window.deleteQuest('${quest.id}')" title="Delete">\u{1F5D1}\uFE0F</button>
      </div>
    </div>
  `;
  
  return card;
}