import { renderCharacterSelect } from './components/CharacterSelect.js';
import { renderQuestBoard } from './components/QuestBoard.js';
import { renderCompletedQuests } from './components/CompletedQuests.js';
import { openAdminPanel } from './components/AdminPanel.js';
import { loadState, saveState, loadUsers } from './services/api.js';
import { createParticles, showToast, showLevelUp, escapeHtml, escapeAttr } from './utils/helpers.js';
import { getAllCategories, getCategoryById, getCategoryTagClass } from './utils/categoryUtils.js';
import { CONFIG, BUILTIN_CATEGORIES } from './config.js';
import { createModal, closeModal, closeTopModal } from './components/Modal.js';
import { openCreateCharModal } from './components/CreateCharacter.js';
import { openTemplateManager, openTemplatePicker } from './components/TemplateManager.js';
import './components/EditCharacter.js';
import { EMOJI_LIBRARY } from './utils/emojiLibrary.js';

// Global state with templates array
window.state = {
  quests: [],
  completed: [],
  archived: [],
  templates: [],
  xp: 0,
  level: 1,
  streak: 0,
  lastCompletedDate: null,
  filters: { main: 'all', side: 'all' },
  customCategories: []
};

window.currentUserId = localStorage.getItem('tavern_current_user') || null;
window.completedPage = 0;
window.connectionStatus = 'offline';
window.lastSaveError = null;
window.saveQueue = Promise.resolve();

// Make template and modal functions globally available
window.openTemplateManager = openTemplateManager;
window.openTemplatePicker = openTemplatePicker;
window.closeTopModal = closeTopModal;

async function init() {
  createParticles();
  
  document.getElementById('btn-create-char')?.addEventListener('click', openCreateCharModal);
  document.getElementById('btn-roster')?.addEventListener('click', showCharacterSelect);
  document.getElementById('btn-admin')?.addEventListener('click', () => openAdminPanel(
    window.connectionStatus,
    window.lastSaveError,
    window.state.customCategories,
    window.state
  ));
  document.getElementById('current-user-display')?.addEventListener('click', showCharacterSelect);
  document.getElementById('btn-post-quest')?.addEventListener('click', handleAddQuest);
  document.getElementById('btn-clear')?.addEventListener('click', handleClearCompleted);
  
  document.getElementById('btn-prev-page')?.addEventListener('click', () => {
    if (window.completedPage > 0) {
      window.completedPage--;
      window.renderAll();
    }
  });
  
  document.getElementById('btn-next-page')?.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(window.state.completed.length / CONFIG.COMPLETED_PER_PAGE));
    if (window.completedPage < totalPages - 1) {
      window.completedPage++;
      window.renderAll();
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement?.id === 'quest-name') {
      handleAddQuest();
    }
    if (e.key === 'Escape') {
      closeTopModal();
    }
  });
  
  // Initial load only - no more interval-based refresh
  if (window.currentUserId) {
    await loadAppState();
  } else {
    showCharacterSelect();
  }
}

async function loadAppState() {
  if (!window.currentUserId) {
    showCharacterSelect();
    return;
  }
  
  window.connectionStatus = 'syncing';
  const data = await loadState(window.currentUserId);
  
  if (data) {
    window.state = { ...window.state, ...data };
    if (!window.state.filters) window.state.filters = { main: 'all', side: 'all' };
    if (!Array.isArray(window.state.customCategories)) window.state.customCategories = [];
    if (!Array.isArray(window.state.archived)) window.state.archived = [];
    if (!Array.isArray(window.state.templates)) window.state.templates = [];
    
    window.state.quests.forEach(q => { if (!q.priority) q.priority = 'medium'; });
    window.state.completed.forEach(q => { if (!q.priority) q.priority = 'medium'; });
    window.state.archived.forEach(q => { if (!q.priority) q.priority = 'medium'; });
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (window.state.lastCompletedDate !== today && window.state.lastCompletedDate !== yesterday) {
      window.state.streak = 0;
    }
    
    window.connectionStatus = 'online';
    window.lastSaveError = null;
    
    document.getElementById('char-select-screen').classList.add('hidden');
    document.getElementById('app').style.display = 'block';
    
    window.completedPage = 0;
    await updateCurrentUserDisplay();
    window.renderAll();
  } else {
    showToast('⚠️', 'Load Failed', 'Could not load character data.');
    showCharacterSelect();
  }
}

window.loadAppState = loadAppState;

function showCharacterSelect() {
  document.getElementById('char-select-screen').classList.remove('hidden');
  document.getElementById('app').style.display = 'none';
  renderCharacterSelect();
}

window.showCharacterSelect = showCharacterSelect;

async function updateCurrentUserDisplay() {
  try {
    const users = await loadUsers();
    const user = users.find(u => u.id === window.currentUserId);
    if (user) {
      document.getElementById('current-user-name').textContent = user.name;
      document.getElementById('current-user-avatar').textContent = user.avatar;
    }
  } catch (err) {
    console.error('Failed to load user display:', err);
  }
}

window.updateCurrentUserDisplay = updateCurrentUserDisplay;

function renderAll() {
  try { renderCategoryDropdown(); } catch (e) { console.error('Render Error (Dropdown):', e); }
  try {
    renderQuestBoard(window.state.quests, window.state.filters, (type, filter) => {
      window.state.filters[type] = filter;
      saveStateWrapper();
      window.renderAll();
    });
  } catch (e) { console.error('Render Error (Quest Board):', e); }
  try { renderCompletedQuests(window.state.completed, window.completedPage); } catch (e) { console.error('Render Error (Completed):', e); }
  try { renderArchivedQuests(); } catch (e) { console.error('Render Error (Archived):', e); }
  try { renderStats(); } catch (e) { console.error('Render Error (Stats):', e); }
}

window.renderAll = renderAll;

function renderCategoryDropdown() {
  const select = document.getElementById('quest-category');
  if (!select) return;
  const categories = getAllCategories(window.state.customCategories);
  select.innerHTML = categories.map(c => 
    `<option value="${c.id}">${c.emoji} ${escapeHtml(c.name)}</option>`
  ).join('');
}

function renderStats() {
  document.getElementById('player-level').textContent = window.state.level;
  document.getElementById('player-xp').textContent = window.state.xp;
  document.getElementById('quests-completed').textContent = window.state.completed.length;
  document.getElementById('quests-active').textContent = window.state.quests.length;
  document.getElementById('player-streak').textContent = window.state.streak;
  document.getElementById('xp-bar').style.width = ((window.state.xp % CONFIG.XP_PER_LEVEL) / CONFIG.XP_PER_LEVEL * 100) + '%';
}

async function saveStateWrapper() {
  if (!window.currentUserId) return false;
  window.saveQueue = window.saveQueue.then(() => doSave()).catch(err => {
    console.error('Save queue error:', err);
    return false;
  });
  return window.saveQueue;
}

window.saveStateWrapper = saveStateWrapper;

async function doSave() {
  window.connectionStatus = 'syncing';
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await saveState(window.currentUserId, window.state);
      if (result.success) {
        window.connectionStatus = 'online';
        window.lastSaveError = null;
        return true;
      } else {
        throw new Error(result.error || 'Save failed');
      }
    } catch (err) {
      console.error('Save attempt ' + (attempt + 1) + ' failed:', err.message);
      window.lastSaveError = err.message;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      window.connectionStatus = 'offline';
      showToast('⚠️', 'Save Failed', 'Could not save: ' + err.message);
      return false;
    }
  }
  return false;
}

async function handleAddQuest() {
  const nameInput = document.getElementById('quest-name');
  const descInput = document.getElementById('quest-desc');
  const btn = document.getElementById('btn-post-quest');
  
  if (!nameInput) {
    console.error('Could not find quest-name input!');
    return;
  }

  const name = nameInput.value.trim();
  const type = document.getElementById('quest-type')?.value || 'main';
  const category = document.getElementById('quest-category')?.value || 'household';
  const priority = document.getElementById('quest-priority')?.value || 'medium';
  const xp = parseInt(document.getElementById('quest-xp')?.value || '25');
  const desc = descInput ? descInput.value.trim() : '';
  
  if (!name) {
    showToast('⚠️', 'Quest Name Required', 'Every quest needs a name!');
    nameInput.focus();
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Posting...';
  
  try {
    const quest = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name, type, category, priority, xp,
      description: desc,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    
    window.state.quests.push(quest);
    window.renderAll(); // Immediate UI update
    
    const saved = await saveStateWrapper();
    
    if (saved) {
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      showToast('📜', 'Quest Posted!', `"${name}" added.`);
    } else {
      window.state.quests.pop();
      window.renderAll(); // Rollback UI
      showToast('⚠️', 'Save Failed', 'Could not save quest.');
    }
  } catch (err) {
    console.error('Error posting quest:', err);
    if (window.state.quests.length > 0 && window.state.quests[window.state.quests.length-1].name === name) {
        window.state.quests.pop();
    }
    showToast('⚠️', 'Error', 'Failed to post quest.');
  } finally {
    btn.disabled = false;
    btn.textContent = '⚔️ Post Quest';
    if (nameInput) nameInput.focus();
  }
}

window.toggleQuest = async (id) => {
  const idx = window.state.quests.findIndex(q => q.id === id);
  if (idx === -1) return;
  const quest = window.state.quests[idx];
  quest.completedAt = new Date().toISOString();
  window.state.completed.push(quest);
  window.state.quests.splice(idx, 1);
  const oldLevel = window.state.level;
  window.state.xp += quest.xp;
  window.state.level = Math.floor(window.state.xp / CONFIG.XP_PER_LEVEL) + 1;
  const today = new Date().toDateString();
  if (window.state.lastCompletedDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    window.state.streak = window.state.lastCompletedDate === yesterday ? window.state.streak + 1 : 1;
    window.state.lastCompletedDate = today;
  }
  window.renderAll(); // Immediate UI update
  const saved = await saveStateWrapper();
  if (saved) {
    showToast('⚔️', 'Quest Completed!', `+${quest.xp} XP earned!`);
    if (window.state.level > oldLevel) setTimeout(() => showLevelUp(window.state.level), 600);
  } else {
    window.state.completed.pop();
    window.state.quests.splice(idx, 0, quest);
    window.state.xp -= quest.xp;
    window.state.level = oldLevel;
    window.renderAll(); // Rollback UI
  }
};

window.deleteQuest = async (id) => {
  const idx = window.state.quests.findIndex(q => q.id === id);
  if (idx === -1) return;
  const quest = window.state.quests[idx];
  if (!confirm(`Remove "${quest.name}"?`)) return;
  window.state.quests.splice(idx, 1);
  window.renderAll(); // Immediate UI update
  const saved = await saveStateWrapper();
  if (saved) {
    showToast('🗑️', 'Quest Removed', `"${quest.name}" removed.`);
  } else {
    window.state.quests.splice(idx, 0, quest);
    window.renderAll(); // Rollback UI
  }
};

window.openEditModal = (id) => {
  const quest = window.state.quests.find(q => q.id === id);
  if (!quest) return;
  const categories = getAllCategories(window.state.customCategories);
  const categoryOptions = categories.map(c => 
    `<option value="${c.id}" ${quest.category === c.id ? 'selected' : ''}>${c.emoji} ${escapeHtml(c.name)}</option>`
  ).join('');
  const content = `
    <div class="modal-header">
      <h3 class="modal-title">📜 Edit Quest</h3>
      <button class="modal-close" onclick="window.closeTopModal()">&times;</button>
    </div>
    <div class="form-group" style="margin-bottom:14px;">
      <label>Quest Name</label>
      <input type="text" id="edit-name" value="${escapeAttr(quest.name)}" maxlength="100">
    </div>
    <div class="form-row" style="margin-bottom:0;">
      <div class="form-group">
        <label>Quest Type</label>
        <select id="edit-type">
          <option value="main" ${quest.type === 'main' ? 'selected' : ''}>⚔️ Main</option>
          <option value="side" ${quest.type === 'side' ? 'selected' : ''}>🗺️ Side</option>
        </select>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select id="edit-category">${categoryOptions}</select>
      </div>
      <div class="form-group">
        <label>Priority</label>
        <select id="edit-priority">
          <option value="critical" ${quest.priority === 'critical' ? 'selected' : ''}>💀 Critical</option>
          <option value="high" ${quest.priority === 'high' ? 'selected' : ''}>🔴 High</option>
          <option value="medium" ${quest.priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
          <option value="low" ${quest.priority === 'low' ? 'selected' : ''}>🟢 Low</option>
        </select>
      </div>
      <div class="form-group">
        <label>XP</label>
        <select id="edit-xp">
          <option value="10" ${quest.xp === 10 ? 'selected' : ''}>10</option>
          <option value="25" ${quest.xp === 25 ? 'selected' : ''}>25</option>
          <option value="50" ${quest.xp === 50 ? 'selected' : ''}>50</option>
          <option value="100" ${quest.xp === 100 ? 'selected' : ''}>100</option>
        </select>
      </div>
    </div>
    <div class="form-group" style="margin-top:14px;">
      <label>Description</label>
      <input type="text" id="edit-desc" value="${escapeAttr(quest.description || '')}" maxlength="200">
    </div>
    <div class="modal-actions">
      <button class="btn-modal btn-cancel" onclick="window.closeTopModal()">Cancel</button>
      <button class="btn-modal btn-save" onclick="window.saveEdit('${quest.id}')">💾 Save</button>
    </div>
  `;
  createModal(content);
  setTimeout(() => {
    const n = document.getElementById('edit-name');
    if (n) { n.focus(); n.select(); }
  }, 100);
};

window.saveEdit = async (id) => {
  const quest = window.state.quests.find(q => q.id === id);
  if (!quest) return;
  const name = document.getElementById('edit-name').value.trim();
  if (!name) {
    showToast('⚠️', 'Name Required', 'A quest must have a name!');
    return;
  }
  const backup = { ...quest };
  quest.name = name;
  quest.type = document.getElementById('edit-type').value;
  quest.category = document.getElementById('edit-category').value;
  quest.priority = document.getElementById('edit-priority').value;
  quest.xp = parseInt(document.getElementById('edit-xp').value);
  quest.description = document.getElementById('edit-desc').value.trim();
  quest.updatedAt = new Date().toISOString();
  window.renderAll(); // Immediate UI update
  const saved = await saveStateWrapper();
  if (saved) {
    closeTopModal();
    showToast('✏️', 'Quest Updated!', `"${name}" modified.`);
  } else {
    Object.assign(quest, backup);
    window.renderAll(); // Rollback UI
  }
};

window.confirmRepeatQuest = async (questId) => {
  const originalQuest = window.state.completed.find(q => q.id === questId) || window.state.archived.find(q => q.id === questId);
  if (!originalQuest) return;
  const newQuest = {
    ...originalQuest,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  window.state.quests.push(newQuest);
  closeTopModal();
  window.renderAll(); // Immediate UI update
  const saved = await saveStateWrapper();
  if (saved) {
    showToast('🔄', 'Quest Repeated!', `"${originalQuest.name}" added to active quests.`);
  }
};

window.archiveQuest = async (questId) => {
  const quest = window.state.completed.find(q => q.id === questId);
  if (!quest) return;
  
  window.state.completed = window.state.completed.filter(q => q.id !== questId);
  window.state.archived.push(quest);
  
  closeTopModal();
  window.renderAll(); // Immediate UI update
  
  const saved = await saveStateWrapper();
  if (saved) {
    showToast('📦', 'Quest Archived', `"${quest.name}" moved to archive.`);
  } else {
    window.state.archived.pop();
    window.state.completed.push(quest);
    window.renderAll(); // Rollback UI
    showToast('⚠️', 'Archive Failed', 'Could not save archive.');
  }
};

window.restoreQuest = async (questId) => {
  const quest = window.state.archived.find(q => q.id === questId);
  if (!quest) return;
  
  window.state.archived = window.state.archived.filter(q => q.id !== questId);
  window.state.completed.push(quest);
  
  window.renderAll(); // Immediate UI update
  
  const saved = await saveStateWrapper();
  if (saved) {
    showToast('🔄', 'Quest Restored', `"${quest.name}" restored to completed.`);
  } else {
    window.state.completed.pop();
    window.state.archived.push(quest);
    window.renderAll(); // Rollback UI
    showToast('⚠️', 'Restore Failed', 'Could not save restore.');
  }
};

window.deleteArchivedQuest = async (questId) => {
  const quest = window.state.archived.find(q => q.id === questId);
  if (!quest) return;
  
  if (!confirm(`Permanently delete "${quest.name}"? This cannot be undone.`)) return;
  
  const backup = [...window.state.archived];
  window.state.archived = window.state.archived.filter(q => q.id !== questId);
  
  window.renderAll(); // Immediate UI update
  
  const saved = await saveStateWrapper();
  if (saved) {
    showToast('🗑️', 'Quest Deleted', `"${quest.name}" permanently deleted.`);
  } else {
    window.state.archived = backup;
    window.renderAll(); // Rollback UI
    showToast('⚠️', 'Delete Failed', 'Could not save deletion.');
  }
};

window.clearArchived = async () => {
  if (window.state.archived.length === 0) return;
  if (!confirm(`Clear all ${window.state.archived.length} archived quest(s)? This cannot be undone.`)) return;
  
  const count = window.state.archived.length;
  const backup = [...window.state.archived];
  window.state.archived = [];
  
  window.renderAll(); // Immediate UI update
  
  const saved = await saveStateWrapper();
  if (saved) {
    showToast('🧹', 'Archive Cleared', `${count} archived quest(s) removed.`);
  } else {
    window.state.archived = backup;
    window.renderAll(); // Rollback UI
    showToast('⚠️', 'Clear Failed', 'Could not save changes.');
  }
};

window.toggleArchiveSection = () => {
  const archiveSection = document.getElementById('archive-section');
  if (archiveSection) {
    archiveSection.style.display = archiveSection.style.display === 'none' ? 'block' : 'none';
    const toggleBtn = document.getElementById('btn-archive');
    if (toggleBtn) {
      toggleBtn.textContent = archiveSection.style.display === 'none' 
        ? '📦 Show Archive' 
        : '📦 Hide Archive';
    }
  }
};

function renderArchivedQuests() {
  const archiveList = document.getElementById('archive-list');
  const archiveCount = document.getElementById('archive-count');
  const clearArchiveBtn = document.getElementById('btn-clear-archive');
  
  if (!archiveList || !archiveCount) return;
  
  archiveCount.textContent = window.state.archived.length;
  
  if (window.state.archived.length === 0) {
    archiveList.innerHTML = '<div class="empty-state"><span class="empty-icon">📦</span>No archived quests.</div>';
    if (clearArchiveBtn) clearArchiveBtn.style.display = 'none';
  } else {
    archiveList.innerHTML = window.state.archived.map(q => {
      const cat = getCategoryById(q.category, window.state.customCategories || []);
      return `
        <div class="archived-card">
          <div class="archived-info">
            <span class="check-icon">📦</span>
            <span class="archived-name">${escapeHtml(q.name)}</span>
            <span class="archived-meta">${cat.emoji} ${escapeHtml(cat.name)} | +${q.xp} XP</span>
          </div>
          <div class="archived-actions">
            <button class="quest-btn restore-btn" onclick="window.restoreQuest('${q.id}')" title="Restore">🔄</button>
            <button class="quest-btn delete-btn" onclick="window.deleteArchivedQuest('${q.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
    if (clearArchiveBtn) clearArchiveBtn.style.display = 'inline-block';
  }
}

async function handleClearCompleted() {
  if (window.state.completed.length === 0) return;
  if (!confirm(`Clear all ${window.state.completed.length} completed quest(s)?`)) return;
  const count = window.state.completed.length;
  const backup = [...window.state.completed];
  window.state.completed = [];
  window.completedPage = 0;
  window.renderAll(); // Immediate UI update
  const saved = await saveStateWrapper();
  if (saved) {
    showToast('🧹', 'Board Cleared', `${count} quest(s) removed.`);
  } else {
    window.state.completed = backup;
    window.renderAll(); // Rollback UI
  }
}

window.adminResetStreak = async () => {
  if (!confirm('Reset streak to 0?')) return;
  window.state.streak = 0;
  window.state.lastCompletedDate = null;
  const saved = await saveStateWrapper();
  if (saved) { window.renderAll(); closeTopModal(); showToast('🔥', 'Streak Reset', 'Streak extinguished.'); }
};

window.adminResetXP = async () => {
  if (!confirm('Reset XP and Level to 1?')) return;
  window.state.xp = 0;
  window.state.level = 1;
  const saved = await saveStateWrapper();
  if (saved) { window.renderAll(); closeTopModal(); showToast('📉', 'Stats Reset', 'Returned to Level 1.'); }
};

window.adminExportData = () => {
  const dataStr = JSON.stringify(window.state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `tavern_backup_${document.getElementById('current-user-name').textContent}_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📤', 'Data Exported', 'Backup saved!');
};

window.adminImportData = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported.quests || !imported.completed) throw new Error('Invalid format');
        if (!confirm('⚠️ Overwrite current character data?')) return;
        const backup = { ...window.state };
        window.state = { ...window.state, ...imported };
        if (!window.state.filters) window.state.filters = { main: 'all', side: 'all' };
        if (!Array.isArray(window.state.customCategories)) window.state.customCategories = [];
        if (!Array.isArray(window.state.archived)) window.state.archived = [];
        if (!Array.isArray(window.state.templates)) window.state.templates = [];
        const saved = await saveStateWrapper();
        if (saved) { window.renderAll(); closeTopModal(); showToast('📥', 'Data Imported', 'Restored!'); }
        else { window.state = backup; window.renderAll(); showToast('⚠️', 'Import Failed', 'Reverted.'); }
      } catch (err) {
        showToast('⚠️', 'Import Failed', 'Invalid file.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

window.adminWipeAll = async () => {
  const input = prompt('⚠️ DELETE ALL DATA FOR THIS CHARACTER?\n\nType RESET to confirm:');
  if (input && input.trim().toUpperCase() === 'RESET') {
    window.state = {
      quests: [], completed: [], archived: [], templates: [], xp: 0, level: 1, streak: 0, lastCompletedDate: null,
      filters: { main: 'all', side: 'all' },
      customCategories: window.state.customCategories
    };
    const saved = await saveStateWrapper();
    if (saved) { window.renderAll(); closeTopModal(); showToast('☠️', 'Data Wiped', 'Character reset.'); }
  } else if (input !== null) {
    showToast('⚠️', 'Aborted', 'Cancelled.');
  }
};

window.openCategoryManager = () => {
  const categories = getAllCategories(window.state.customCategories);
  const categoryListHtml = categories.map(cat => {
    const activeCount = window.state.quests.filter(q => q.category === cat.id).length;
    const completedCount = window.state.completed.filter(q => q.category === cat.id).length;
    const total = activeCount + completedCount;
    return `
      <div class="category-item ${cat.builtin ? 'builtin' : ''}">
        <span class="cat-emoji">${cat.emoji}</span>
        <span class="cat-name">${escapeHtml(cat.name)}${cat.builtin ? ' <span style="font-size:0.7rem;opacity:0.6;">(built-in)</span>' : ''}</span>
        <span class="cat-quest-count">${total} quest${total !== 1 ? 's' : ''}</span>
        ${!cat.builtin ? `<button class="cat-delete" onclick="window.requestDeleteCategory('${cat.id}')" title="Delete category">&times;</button>` : ''}
      </div>
    `;
  }).join('');
  
  const content = `
    <div class="modal-header">
      <h3 class="modal-title">🏷️ Category Management</h3>
      <button class="modal-close" onclick="window.closeTopModal()">&times;</button>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">📋 Existing Categories</div>
      <div class="category-list">${categoryListHtml}</div>
    </div>
    <div class="admin-section" style="border-top:1px solid var(--gold-dark); padding-top:20px;">
      <div class="admin-section-title">+ Create New Category</div>
      <div class="form-group" style="margin-bottom:12px;">
        <label>Category Name</label>
        <input type="text" id="new-cat-name" placeholder="e.g., Garden, Pets..." maxlength="30">
      </div>
      <div class="emoji-picker-container">
        <span class="emoji-picker-label">Choose an Icon</span>
        <div class="emoji-selected-preview">
          <span class="preview-emoji" id="preview-emoji"></span>
          <span class="preview-text" id="preview-text">Click an emoji below</span>
        </div>
        <div class="emoji-grid" id="emoji-grid"></div>
      </div>
      <div class="modal-actions" style="margin-top:16px;">
        <button class="btn-modal btn-cancel" onclick="window.closeTopModal()">Cancel</button>
        <button class="btn-modal btn-save" onclick="window.createCategory()">+ Create</button>
      </div>
    </div>
  `;
  
  createModal(content);
  
  const grid = document.getElementById('emoji-grid');
  if (grid && EMOJI_LIBRARY) {
    let html = '';
    for (const [category, emojis] of Object.entries(EMOJI_LIBRARY)) {
      html += `<div class="emoji-category-label">${category}</div>`;
      for (const emoji of emojis) {
        html += `<div class="emoji-cell" onclick="window.selectCategoryEmoji('${emoji}')">${emoji}</div>`;
      }
    }
    grid.innerHTML = html;
  }
};

window.selectedCategoryEmoji = null;

window.selectCategoryEmoji = (emoji) => {
  window.selectedCategoryEmoji = emoji;
  document.querySelectorAll('.emoji-cell').forEach(c => c.classList.remove('selected'));
  event.target.classList.add('selected');
  document.getElementById('preview-emoji').textContent = emoji;
  document.getElementById('preview-text').textContent = `Selected: ${emoji}`;
};

window.createCategory = async () => {
  const name = document.getElementById('new-cat-name').value.trim();
  if (!name) { showToast('⚠️', 'Name Required', 'Please enter a category name.'); return; }
  if (!window.selectedCategoryEmoji) { showToast('⚠️', 'Icon Required', 'Please select an emoji icon.'); return; }
  const exists = window.state.customCategories.some(c => c.name.toLowerCase() === name.toLowerCase());
  if (exists) { showToast('⚠️', 'Duplicate Name', `A category named "${name}" already exists.`); return; }
  const newCat = {
    id: 'cat_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name, emoji: window.selectedCategoryEmoji, builtin: false
  };
  window.state.customCategories.push(newCat);
  const saved = await saveStateWrapper();
  if (saved) {
    window.selectedCategoryEmoji = null;
    showToast('🏷️', 'Category Created!', `"${name}" added.`);
    window.openCategoryManager();
    window.renderAll(); // Immediate UI update
  } else {
    window.state.customCategories.pop();
  }
};

window.requestDeleteCategory = async (catId) => {
  const cat = getCategoryById(catId, window.state.customCategories);
  const activeQuests = window.state.quests.filter(q => q.category === catId);
  const completedQuests = window.state.completed.filter(q => q.category === catId);
  const total = activeQuests.length + completedQuests.length;
  if (total === 0) {
    if (confirm(`Delete category "${cat.emoji} ${cat.name}"?`)) await deleteCategory(catId);
  } else {
    const otherCategories = getAllCategories(window.state.customCategories).filter(c => c.id !== catId);
    const categoryOptions = otherCategories.map(c => 
      `<option value="${c.id}">${c.emoji} ${escapeHtml(c.name)}</option>`
    ).join('');
    const questListHtml = [
      ...activeQuests.map(q => `<div class="reassign-quest-item">⚔️ ${escapeHtml(q.name)} <span style="opacity:0.6;font-size:0.8rem;">(active)</span></div>`),
      ...completedQuests.map(q => `<div class="reassign-quest-item">✅ ${escapeHtml(q.name)} <span style="opacity:0.6;font-size:0.8rem;">(completed)</span></div>`)
    ].join('');
    const content = `
      <div class="modal-header">
        <h3 class="modal-title">⚠️ Category In Use</h3>
        <button class="modal-close" onclick="window.closeTopModal()">&times;</button>
      </div>
      <div class="reassign-warning">
        <strong>${cat.emoji} ${escapeHtml(cat.name)}</strong> is used by <strong>${activeQuests.length} active</strong> and <strong>${completedQuests.length} completed</strong> quest(s).<br>
        Choose a new category for these quests before deleting.
      </div>
      <div style="font-family:'Cinzel',serif; font-size:0.9rem; color:var(--gold-light); margin-bottom:8px;">Affected Quests:</div>
      <div class="reassign-quest-list">${questListHtml}</div>
      <div class="form-group">
        <label>Reassign to Category</label>
        <select id="reassign-target">${categoryOptions}</select>
      </div>
      <div class="modal-actions">
        <button class="btn-modal btn-cancel" onclick="window.closeTopModal()">Cancel</button>
        <button class="btn-modal btn-danger" onclick="window.confirmDeleteWithReassign('${catId}')">🗑️ Reassign & Delete</button>
      </div>
    `;
    createModal(content);
  }
};

window.confirmDeleteWithReassign = async (catId) => {
  const newCatId = document.getElementById('reassign-target').value;
  if (!newCatId) { showToast('⚠️', 'No Target', 'Please select a category.'); return; }
  window.state.quests.forEach(q => { if (q.category === catId) q.category = newCatId; });
  window.state.completed.forEach(q => { if (q.category === catId) q.category = newCatId; });
  if (window.state.filters.main === catId) window.state.filters.main = 'all';
  if (window.state.filters.side === catId) window.state.filters.side = 'all';
  const saved = await saveStateWrapper();
  if (saved) await deleteCategory(catId);
  else showToast('⚠️', 'Save Failed', 'Could not save reassignment.');
};

async function deleteCategory(catId) {
  window.state.customCategories = window.state.customCategories.filter(c => c.id !== catId);
  if (window.state.filters.main === catId) window.state.filters.main = 'all';
  if (window.state.filters.side === catId) window.state.filters.side = 'all';
  const saved = await saveStateWrapper();
  if (saved) {
    showToast('🗑️', 'Category Deleted', 'Category removed.');
    window.openCategoryManager();
    window.renderAll(); // Immediate UI update
  } else {
    showToast('⚠️', 'Delete Failed', 'Could not save changes.');
  }
}

window.closeModal = closeModal;

// Initialize app - NO MORE setInterval
init();