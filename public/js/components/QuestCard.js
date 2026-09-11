import { escapeHtml } from '../utils/helpers.js';
import { CONFIG } from '../config.js';

export function createQuestCard(quest, category) {
  const card = document.createElement('div');
  card.className = `quest-card priority-${quest.priority}`;
  
  const tagClass = category.builtin
    ? (category.id === 'household' ? 'tag-household' : category.id === 'academy' ? 'tag-academy' : category.id === 'dragons-den' ? 'tag-dragons-den' : category.id === 'bog-of-eternal-stench' ? 'tag-bog' : 'tag-technology')
    : 'tag-custom';
  
  // Check if there are other users to share with
  const showShareButton = (window.otherUsersCount || 0) > 0;
  const due = getDueLabel(quest.dueDate);
  
  card.innerHTML = `
    <div class="quest-card-top">
      <button class="quest-checkbox" type="button" onclick="window.toggleQuest('${quest.id}')" aria-label="Complete ${escapeHtml(quest.name)}" title="Complete quest"></button>
      <div class="quest-info">
        <div class="quest-name">${escapeHtml(quest.name)}</div>
        <div class="quest-meta">
          <span class="quest-tag ${tagClass}">${category.emoji} ${escapeHtml(category.name)}</span>
          <span class="tag-priority priority-${quest.priority}-badge">${CONFIG.PRIORITY_LABELS[quest.priority]}</span>
          <span class="quest-xp">✨ ${quest.xp} XP</span>
          ${due ? `<span class="quest-due ${due.className}">⏰ ${due.label}</span>` : ''}
        </div>
        ${quest.description ? `<div class="quest-description">${escapeHtml(quest.description)}</div>` : ''}
      </div>
      <div class="quest-actions">
        ${showShareButton ? `<button class="quest-btn share-btn" onclick="window.shareQuest('${quest.id}')" title="Share Quest">📤</button>` : ''}
        <button class="quest-btn edit-btn" onclick="window.openEditModal('${quest.id}')" title="Edit">✏️</button>
        <button class="quest-btn delete-btn" onclick="window.deleteQuest('${quest.id}')" title="Delete">🗑️</button>
      </div>
    </div>
  `;
  
  return card;
}
function getDueLabel(dueDate) {
  if (!dueDate) return null;
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return { label: `Overdue · ${due.toLocaleDateString()}`, className: 'is-overdue' };
  if (days === 0) return { label: 'Due today', className: 'is-due-soon' };
  if (days === 1) return { label: 'Due tomorrow', className: 'is-due-soon' };
  return { label: `Due ${due.toLocaleDateString()}`, className: '' };
}
