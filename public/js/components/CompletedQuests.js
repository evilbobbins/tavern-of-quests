import { escapeHtml } from '../utils/helpers.js';
import { getCategoryById } from '../utils/categoryUtils.js';
import { CONFIG } from '../config.js';
import { createModal } from './Modal.js';

export function renderCompletedQuests(completed, page = 0) {
  const list = document.getElementById('completed-list');
  const btnClear = document.getElementById('btn-clear');
  const btnArchive = document.getElementById('btn-archive');
  const paginationControls = document.getElementById('pagination-controls');
  const paginationInfo = document.getElementById('pagination-info');
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');
  
  const totalPages = Math.max(1, Math.ceil(completed.length / CONFIG.COMPLETED_PER_PAGE));
  
  if (page >= totalPages) page = Math.max(0, totalPages - 1);
  
  if (completed.length === 0) {
    list.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><span class="empty-icon">\u{1F3C6}</span>No quests completed.</div>';
    if (btnClear) btnClear.style.display = 'none';
    if (btnArchive) btnArchive.style.display = 'none';
    paginationControls.style.display = 'none';
    return;
  }
  
  const startIndex = page * CONFIG.COMPLETED_PER_PAGE;
  const endIndex = Math.min(startIndex + CONFIG.COMPLETED_PER_PAGE, completed.length);
  const pageQuests = completed.slice(startIndex, endIndex);
  
  list.innerHTML = pageQuests.map(q => {
    const cat = getCategoryById(q.category, window.state?.customCategories || []);
    return `
      <div class="completed-card" onclick="window.openCompletedQuestModal('${q.id}')" title="Click for options">
        <span class="check-icon">\u2705</span>
        <span>${escapeHtml(q.name)}</span>
        <span style="margin-left:auto;color:var(--gold);font-size:0.8rem;">${cat.emoji} +${q.xp} XP</span>
      </div>
    `;
  }).join('');
  
  if (btnClear) btnClear.style.display = 'inline-block';
  if (btnArchive) btnArchive.style.display = 'inline-block';
  
  if (totalPages > 1) {
    paginationControls.style.display = 'flex';
    paginationInfo.textContent = `Page ${page + 1} of ${totalPages}`;
    btnPrev.disabled = page === 0;
    btnNext.disabled = page === totalPages - 1;
  } else {
    paginationControls.style.display = 'none';
  }
}

window.openCompletedQuestModal = (questId) => {
  const quest = window.state.completed.find(q => q.id === questId);
  if (!quest) return;
  
  const content = `
    <div class="modal-header">
      <h3 class="modal-title">\u{1F4DC} Quest Options</h3>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>
    <div style="padding: 10px 0; font-size: 1.1rem; color: var(--parchment); text-align: center;">
      <strong style="color:var(--gold); font-size: 1.2rem;">"${escapeHtml(quest.name)}"</strong>
    </div>
    <div class="modal-actions" style="flex-direction: column; gap: 10px;">
      <button class="btn-modal btn-save" onclick="window.confirmRepeatQuest('${quest.id}')" style="width: 100%;">
        \u{1F504} Repeat Quest
      </button>
      <button class="btn-modal btn-save" onclick="window.archiveQuest('${quest.id}')" style="width: 100%; background: linear-gradient(135deg, #5c3a21, #8b6b4a);">
        \u{1F4E6} Archive Quest
      </button>
      <button class="btn-modal btn-cancel" onclick="window.closeModal()" style="width: 100%;">
        Cancel
      </button>
    </div>
  `;
  
  createModal(content);
};