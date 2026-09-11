import { renderCharacterSelect } from './components/CharacterSelect.js';
import { renderQuestBoard } from './components/QuestBoard.js';
import { renderCompletedQuests } from './components/CompletedQuests.js';
import { openAdminPanel } from './components/AdminPanel.js';
import { loadState, saveState, saveRealm, recordRunefallScore, resetRunefallScores, loadUsers } from './services/api.js';
import { createParticles, showToast, showUndoToast, showLevelUp, escapeHtml, escapeAttr } from './utils/helpers.js';
import { getAllCategories, getCategoryById, getCategoryTagClass } from './utils/categoryUtils.js';
import { CONFIG, BUILTIN_CATEGORIES } from './config.js';
import { createModal, closeModal, closeTopModal } from './components/Modal.js';
import { openCreateCharModal } from './components/CreateCharacter.js';
import { openTemplateManager, openTemplatePicker } from './components/TemplateManager.js';
import { openRealmDashboard } from './components/RealmDashboard.js';
import { openBackupManager } from './components/BackupManager.js';
import { openRealmMap } from './components/RealmMap.js';
import { openAdventurerProfile } from './components/AdventurerProfile.js';
import { openActivityLog } from './components/ActivityLog.js';
import { openTavernBlocks } from './components/TavernBlocks.js';
import './components/EditCharacter.js';
import { EMOJI_LIBRARY } from './utils/emojiLibrary.js';

// Global state with templates array
window.state = {
  quests: [],
  completed: [],
  archived: [],
  templates: [],
  activity: [],
  xp: 0,
  level: 1,
  streak: 0,
  lastCompletedDate: null,
  filters: { main: 'all', side: 'all' },
  customCategories: [],
  runefallScores: [],
  _realmRevision: 0
};

window.currentUserId = localStorage.getItem('tavern_current_user') || null;
window.completedPage = 0;
window.connectionStatus = 'offline';
window.lastSaveError = null;
window.saveQueue = Promise.resolve();
window.otherUsersCount = 0; // Track number of other users for share button visibility

function updateConnectionIndicator() {
  const indicator = document.getElementById('connection-indicator');
  const label = document.getElementById('connection-label');
  if (!indicator || !label) return;
  const details = {
    online: { label: 'Saved', title: 'All changes are saved to the shared tavern.' },
    syncing: { label: 'Saving', title: 'Saving changes to the shared tavern…' },
    offline: { label: 'Offline', title: window.lastSaveError || 'The tavern server cannot be reached.' }
  }[window.connectionStatus] || { label: 'Offline', title: 'The tavern server cannot be reached.' };
  indicator.className = `connection-indicator status-${window.connectionStatus}`;
  indicator.title = details.title;
  indicator.setAttribute('aria-label', `Server connection: ${details.label}`);
  label.textContent = details.label;
}

window.updateConnectionIndicator = updateConnectionIndicator;

// Make template and modal functions globally available
window.openTemplateManager = openTemplateManager;
window.openTemplatePicker = openTemplatePicker;
window.openRealmDashboard = openRealmDashboard;
window.openBackupManager = openBackupManager;
window.openRealmMap = () => openRealmMap(window.state);
window.openAdventurerProfile = () => openAdventurerProfile(window.state, {
  name: document.getElementById('current-user-name')?.textContent,
  avatar: document.getElementById('current-user-avatar')?.textContent
});
window.openActivityLog = () => openActivityLog(window.state.activity || []);
window.openTavernBlocks = () => openTavernBlocks({
  scores: window.state.runefallScores || [],
  onScore: async ({ score, lines, level }) => {
    const result = await recordRunefallScore(window.currentUserId, score, lines, level);
    if (!result.success || !result.realm) throw new Error(result.error || 'Could not record that Runefall score.');
    window.state.runefallScores = result.realm.runefallScores || [];
    window.state._realmRevision = result.realm.revision || window.state._realmRevision;
    return window.state.runefallScores;
  }
});
window.closeTopModal = closeTopModal;

function openPostQuestModal(startWithTemplate = false) {
  const categories = getAllCategories(window.state.customCategories);
  const categoryOptions = categories.map(category =>
    `<option value="${escapeAttr(category.id)}">${category.emoji} ${escapeHtml(category.name)}</option>`
  ).join('');
  const overlay = createModal(`
    <div class="post-quest-modal" role="dialog" aria-modal="true" aria-label="Post a new quest">
      <div class="modal-header">
        <h3 class="modal-title">📜 Post a New Quest</h3>
        <button class="modal-close" type="button" onclick="window.closeTopModal()" aria-label="Close">&times;</button>
      </div>
      <div class="form-row">
        <div class="form-group quest-name-group">
          <label for="quest-name">Quest Name</label>
          <input type="text" id="quest-name" placeholder="e.g., Slay the Dust Dragon..." maxlength="100" autofocus>
        </div>
        <div class="form-group">
          <label for="quest-type">Quest Type</label>
          <select id="quest-type"><option value="main">⚔️ Main Quest</option><option value="side">🗺️ Side Quest</option></select>
        </div>
        <div class="form-group">
          <label for="quest-category">Location</label>
          <select id="quest-category">${categoryOptions}</select>
        </div>
        <div class="form-group">
          <label for="quest-priority">Priority</label>
          <select id="quest-priority"><option value="critical">💀 Critical</option><option value="high">🔴 High</option><option value="medium" selected>🟠 Medium</option><option value="low">🟢 Low</option></select>
        </div>
        <div class="form-group">
          <label for="quest-xp">Difficulty (XP)</label>
          <select id="quest-xp"><option value="10">Easy (10 XP)</option><option value="25" selected>Medium (25 XP)</option><option value="50">Hard (50 XP)</option><option value="100">Epic (100 XP)</option></select>
        </div>
        <div class="form-group">
          <label for="quest-due-date">Due Date</label>
          <input type="date" id="quest-due-date">
        </div>
        <div class="form-group quest-description-group">
          <label for="quest-desc">Description <span>(optional)</span></label>
          <input type="text" id="quest-desc" placeholder="Brief details..." maxlength="200">
        </div>
      </div>
      <div class="modal-actions post-quest-actions">
        <button class="btn-template" type="button" onclick="window.openTemplatePicker()">📋 Use Template</button>
        <button class="btn-template" type="button" onclick="window.saveQuestFormAsTemplate()">💾 Save as Template</button>
        <button class="btn-modal btn-cancel" type="button" onclick="window.closeTopModal()">Cancel</button>
        <button class="btn-modal btn-save" type="button" id="btn-post-quest">⚔️ Post Quest</button>
      </div>
    </div>
  `, closeTopModal);
  overlay.querySelector('.modal').classList.add('post-quest-shell');
  overlay.querySelector('#btn-post-quest').addEventListener('click', handleAddQuest);
  overlay.querySelector('#quest-name').focus();
  if (startWithTemplate) window.openTemplatePicker();
}

window.openPostQuestModal = openPostQuestModal;

async function init() {
  createParticles();
  updateConnectionIndicator();
  
  document.getElementById('btn-create-char')?.addEventListener('click', openCreateCharModal);
  document.getElementById('btn-roster')?.addEventListener('click', showCharacterSelect);
  document.getElementById('btn-tavern-games')?.addEventListener('click', () => window.openTavernBlocks());
  document.getElementById('btn-realm')?.addEventListener('click', () => window.openRealmDashboard());
  document.getElementById('btn-realm-map')?.addEventListener('click', () => window.openRealmMap());
  document.getElementById('btn-open-post-quest')?.addEventListener('click', () => window.openPostQuestModal());
  document.getElementById('btn-admin')?.addEventListener('click', () => openAdminPanel(window.state));
  document.getElementById('current-user-display')?.addEventListener('click', () => window.openAdventurerProfile());
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
  updateConnectionIndicator();
  const data = await loadState(window.currentUserId);
  
  if (data) {
    window.state = { ...window.state, ...data };
    if (!window.state.filters) window.state.filters = { main: 'all', side: 'all' };
    if (!Array.isArray(window.state.customCategories)) window.state.customCategories = [];
    if (!Array.isArray(window.state.archived)) window.state.archived = [];
    if (!Array.isArray(window.state.templates)) window.state.templates = [];
    if (!Array.isArray(window.state.runefallScores)) window.state.runefallScores = [];
    if (!Number.isInteger(window.state._realmRevision)) window.state._realmRevision = 0;
    if (!Array.isArray(window.state.activity)) window.state.activity = [];
    
    window.state.quests.forEach(q => { if (!q.priority) q.priority = 'medium'; });
    window.state.completed.forEach(q => { if (!q.priority) q.priority = 'medium'; });
    window.state.archived.forEach(q => { if (!q.priority) q.priority = 'medium'; });
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (window.state.lastCompletedDate !== today && window.state.lastCompletedDate !== yesterday) {
      window.state.streak = 0;
    }
    
    window.connectionStatus = 'online';
    updateConnectionIndicator();
    window.lastSaveError = null;
    
    document.getElementById('char-select-screen').classList.add('hidden');
    document.getElementById('app').style.display = 'block';
    
    window.completedPage = 0;
    await updateCurrentUserDisplay();
    await updateOtherUsersCount(); // Load other users count for share button
    window.renderAll();
  } else {
    showToast('⚠️', 'Load Failed', 'Could not load character data.');
    showCharacterSelect();
  }
}

window.loadAppState = loadAppState;

// Load and cache the count of other users
async function updateOtherUsersCount() {
  try {
    const users = await loadUsers();
    window.otherUsersCount = users.filter(u => u.id !== window.currentUserId).length;
  } catch (err) {
    console.error('Failed to load other users count:', err);
    window.otherUsersCount = 0;
  }
}

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

function recordActivity(icon, message) {
  if (!Array.isArray(window.state.activity)) window.state.activity = [];
  window.state.activity.unshift({ icon, message, at: new Date().toISOString() });
  window.state.activity = window.state.activity.slice(0, 20);
}

window.recordActivity = recordActivity;

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
  const completed = document.getElementById('quests-completed');
  const active = document.getElementById('quests-active');
  const streak = document.getElementById('player-streak');
  if (completed) completed.textContent = window.state.completed.length;
  if (active) active.textContent = window.state.quests.length;
  if (streak) streak.textContent = window.state.streak;
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

async function saveSharedRealm() {
  const result = await saveRealm({
    _realmRevision: window.state._realmRevision || 0,
    templates: window.state.templates || [],
    customCategories: window.state.customCategories || []
  });
  if (!result.success || !result.realm) {
    showToast('⚠️', 'Realm Save Failed', result.error || 'Could not save the shared locations and templates.');
    return false;
  }
  window.state.templates = result.realm.templates || [];
  window.state.customCategories = result.realm.customCategories || [];
  window.state._realmRevision = result.realm.revision || 0;
  return await saveStateWrapper();
}

window.saveSharedRealm = saveSharedRealm;

async function doSave() {
  window.connectionStatus = 'syncing';
  updateConnectionIndicator();
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await saveState(window.currentUserId, window.state);
      if (result.success) {
        window.state._revision = result.revision;
        window.connectionStatus = 'online';
        updateConnectionIndicator();
        window.lastSaveError = null;
        return true;
      } else {
        if (result.conflict) {
          return await resolveSaveConflict(JSON.parse(JSON.stringify(window.state)));
        }
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
      updateConnectionIndicator();
      showToast('⚠️', 'Save Failed', 'Could not save: ' + err.message);
      return false;
    }
  }
  return false;
}

function mergeQuestCollections(remote, local) {
  const localIds = new Set(['quests', 'completed', 'archived'].flatMap(key => (local[key] || []).map(quest => quest.id)));
  return ['quests', 'completed', 'archived'].reduce((merged, key) => {
    merged[key] = [...(remote[key] || []).filter(quest => !localIds.has(quest.id)), ...(local[key] || [])];
    return merged;
  }, {});
}

function showConflictChoice() {
  return new Promise(resolve => {
    const content = `
      <div class="modal-header"><h3 class="modal-title">⚔️ The Realm Changed</h3><button class="modal-close" onclick="window.chooseConflictResolution('latest')">&times;</button></div>
      <p style="color:var(--parchment-dark);line-height:1.55;">Another session saved this adventurer while you were working. Choose how to continue—nothing is overwritten until you decide.</p>
      <div class="modal-actions" style="flex-direction:column;gap:10px;">
        <button class="btn-modal btn-save" onclick="window.chooseConflictResolution('merge')">🧩 Merge My Changes</button>
        <button class="btn-modal btn-cancel" onclick="window.chooseConflictResolution('latest')">↻ Use Latest Realm State</button>
      </div>`;
    createModal(content);
    window.chooseConflictResolution = choice => { closeTopModal(); resolve(choice); };
  });
}

async function resolveSaveConflict(localState) {
  const remoteState = await loadState(window.currentUserId);
  if (!remoteState) {
    showToast('⚠️', 'Conflict Unavailable', 'Could not load the latest realm state.');
    return false;
  }
  const choice = await showConflictChoice();
  if (choice === 'latest') {
    window.state = { ...window.state, ...remoteState };
    window.renderAll();
    showToast('↻', 'Latest State Loaded', 'Your board now matches the realm.');
    return true;
  }
  const merged = {
    ...remoteState,
    ...localState,
    ...mergeQuestCollections(remoteState, localState),
    templates: [...new Map([...(remoteState.templates || []), ...(localState.templates || [])].map(item => [item.id, item])).values()],
    activity: [...(localState.activity || []), ...(remoteState.activity || [])].slice(0, 20),
    _revision: remoteState._revision
  };
  const result = await saveState(window.currentUserId, merged);
  if (result.success) {
    window.state = { ...merged, _revision: result.revision };
    window.renderAll();
    showToast('🧩', 'Changes Merged', 'Your updates and the latest realm state were saved together.');
    return true;
  }
  window.state = { ...window.state, ...remoteState };
  window.renderAll();
  showToast('⚠️', 'Merge Failed', 'The latest realm state was loaded instead.');
  return true;
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
  const dueDate = document.getElementById('quest-due-date')?.value || null;
  
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
      name, type, category, priority, xp, dueDate,
      description: desc,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    
    window.state.quests.push(quest);
    recordActivity('📜', `Posted “${name}”`);
    window.renderAll(); // Immediate UI update
    
    const saved = await saveStateWrapper();
    
    if (saved) {
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      const dueInput = document.getElementById('quest-due-date');
      if (dueInput) dueInput.value = '';
      showToast('📜', 'Quest Posted!', `"${name}" added.`);
      if (nameInput.closest('.post-quest-modal')) closeTopModal();
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
  const priorStats = { xp: window.state.xp, level: window.state.level, streak: window.state.streak, lastCompletedDate: window.state.lastCompletedDate };
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
  recordActivity('✅', `Completed “${quest.name}” (+${quest.xp} XP)`);
  window.renderAll(); // Immediate UI update
  const saved = await saveStateWrapper();
  if (saved) {
    showUndoToast('⚔️', 'Quest Completed!', `+${quest.xp} XP earned!`, async () => {
      window.state.completed = window.state.completed.filter(q => q.id !== quest.id);
      window.state.quests.splice(idx, 0, quest);
      Object.assign(window.state, priorStats);
      recordActivity('↩️', `Undid completion of “${quest.name}”`);
      window.renderAll();
      if (await saveStateWrapper()) showToast('↩️', 'Completion Undone', `“${quest.name}” is active again.`);
    });
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
  recordActivity('🗑️', `Removed “${quest.name}”`);
  window.renderAll(); // Immediate UI update
  const saved = await saveStateWrapper();
  if (saved) {
    showUndoToast('🗑️', 'Quest Removed', `“${quest.name}” removed.`, async () => {
      window.state.quests.splice(idx, 0, quest);
      recordActivity('↩️', `Restored “${quest.name}”`);
      window.renderAll();
      if (await saveStateWrapper()) showToast('↩️', 'Quest Restored', `“${quest.name}” is active again.`);
    });
  } else {
    window.state.quests.splice(idx, 0, quest);
    window.renderAll(); // Rollback UI
  }
};

// === QUEST SHARING FUNCTIONS ===

window.shareQuest = async (questId) => {
  const quest = window.state.quests.find(q => q.id === questId);
  if (!quest) return;
  
  // Load all users
  const allUsers = await loadUsers();
  const otherUsers = allUsers.filter(u => u.id !== window.currentUserId);
  
  if (otherUsers.length === 0) {
    showToast('⚠️', 'No Other Adventurers', 'Create more adventurers to share quests!');
    return;
  }
  
  // Create modal with list of other adventurers
  const userListHtml = otherUsers.map(u => `
    <div class="share-user-item" onclick="window.confirmShareQuest('${questId}', '${u.id}')">
      <div class="share-user-avatar">${u.avatar}</div>
      <div class="share-user-info">
        <div class="share-user-name">${escapeHtml(u.name)}</div>
        <div class="share-user-stats">Level ${u.level} • ${u.questCount} Quests</div>
      </div>
    </div>
  `).join('');
  
  const content = `
    <div class="modal-header">
      <h3 class="modal-title">📤 Share Quest</h3>
      <button class="modal-close" onclick="window.closeTopModal()">&times;</button>
    </div>
    <div class="share-quest-info">
      <div class="share-quest-name">${escapeHtml(quest.name)}</div>
      <div class="share-quest-meta">
        ${quest.type === 'main' ? '⚔️ Main Quest' : '🗺️ Side Quest'} • 
        ${CONFIG.PRIORITY_LABELS[quest.priority]} • 
        ✨ ${quest.xp} XP
      </div>
    </div>
    <div class="share-section-title">Select an Adventurer to share with:</div>
    <div class="share-user-list">
      ${userListHtml}
    </div>
    <div class="modal-actions">
      <button class="btn-modal btn-cancel" onclick="window.closeTopModal()">Cancel</button>
    </div>
  `;
  
  createModal(content);
};

window.confirmShareQuest = async (questId, targetUserId) => {
  const quest = window.state.quests.find(q => q.id === questId);
  if (!quest) return;
  
  // Load target user's state
  const targetState = await loadState(targetUserId);
  if (!targetState) {
    showToast('⚠️', 'Error', 'Could not load target adventurer\'s data.');
    return;
  }
  
  // Create a copy of the quest for the target user
  const sharedQuest = {
    ...quest,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    createdAt: new Date().toISOString(),
    completedAt: null,
    sharedFrom: window.currentUserId // Track who shared it
  };
  
  // Add to target user's quests
  if (!targetState.quests) targetState.quests = [];
  targetState.quests.push(sharedQuest);
  
  // Save target user's state
  const saveResult = await saveState(targetUserId, targetState);
  
  if (saveResult.success) {
    // Get target user's name for the toast
    const users = await loadUsers();
    const targetUser = users.find(u => u.id === targetUserId);
    const targetName = targetUser ? targetUser.name : 'Adventurer';
    
    closeTopModal();
    showToast('📤', 'Quest Shared!', `"${quest.name}" shared with ${targetName}.`);
  } else {
    showToast('⚠️', 'Share Failed', 'Could not share quest with target adventurer.');
  }
};

// === END QUEST SHARING FUNCTIONS ===

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
    <div class="form-group" style="margin-top:14px;">
      <label>Due Date</label>
      <input type="date" id="edit-due-date" value="${escapeAttr(quest.dueDate || '')}">
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
  quest.dueDate = document.getElementById('edit-due-date').value || null;
  quest.updatedAt = new Date().toISOString();
  recordActivity('✏️', `Updated “${name}”`);
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
  recordActivity('🔄', `Repeated “${originalQuest.name}”`);
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
  const completedIndex = window.state.completed.findIndex(q => q.id === questId);
  
  window.state.completed = window.state.completed.filter(q => q.id !== questId);
  window.state.archived.push(quest);
  recordActivity('📦', `Archived “${quest.name}”`);
  
  closeTopModal();
  window.renderAll(); // Immediate UI update
  
  const saved = await saveStateWrapper();
  if (saved) {
    showUndoToast('📦', 'Quest Archived', `“${quest.name}” moved to archive.`, async () => {
      window.state.archived = window.state.archived.filter(q => q.id !== quest.id);
      window.state.completed.splice(completedIndex, 0, quest);
      recordActivity('↩️', `Unarchived “${quest.name}”`);
      window.renderAll();
      if (await saveStateWrapper()) showToast('↩️', 'Archive Undone', `“${quest.name}” is back in completed quests.`);
    });
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
  recordActivity('🔄', `Restored “${quest.name}” from archive`);
  
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

window.adminResetRunefallScores = async () => {
  if (!confirm('Reset the shared Runefall scoreboard? This removes every recorded score from the realm.')) return;
  const result = await resetRunefallScores();
  if (!result.success || !result.realm) return showToast('⚠️', 'Reset Failed', result.error || 'Could not reset the Runefall scoreboard.');
  window.state.runefallScores = [];
  window.state._realmRevision = result.realm.revision || window.state._realmRevision;
  closeTopModal();
  showToast('🏆', 'Scoreboard Reset', 'The Runefall score ledger has been cleared.');
};

window.adminExportData = () => {
  const dataStr = JSON.stringify(window.state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `tavern_adventurer_${document.getElementById('current-user-name').textContent}_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📤', 'Adventurer Exported', 'Only this adventurer’s data was saved.');
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
        if (!confirm('⚠️ Overwrite this adventurer’s data only? Other adventurers and the shared realm will not change.')) return;
        const backup = { ...window.state };
        window.state = { ...window.state, ...imported };
        if (!window.state.filters) window.state.filters = { main: 'all', side: 'all' };
        if (!Array.isArray(window.state.customCategories)) window.state.customCategories = [];
        if (!Array.isArray(window.state.archived)) window.state.archived = [];
        if (!Array.isArray(window.state.templates)) window.state.templates = [];
        const saved = await saveStateWrapper();
        if (saved) { window.renderAll(); closeTopModal(); showToast('📥', 'Adventurer Imported', 'Only this adventurer’s data was restored.'); }
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
  window.selectedCategoryEmoji = null;
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
        ${!cat.builtin ? `<button class="cat-delete" onclick="window.requestDeleteCategory('${cat.id}')" title="Delete location">&times;</button>` : ''}
      </div>
    `;
  }).join('');
  
  const content = `
    <div class="modal-header">
      <h3 class="modal-title">📍 Location Management</h3>
      <button class="modal-close" onclick="window.closeTopModal()">&times;</button>
    </div>
    <div class="admin-section">
      <div class="admin-section-title">📋 Existing Locations</div>
      <div class="category-list">${categoryListHtml}</div>
    </div>
    <div class="admin-section" style="border-top:1px solid var(--gold-dark); padding-top:20px;">
      <div class="admin-section-title">+ Create New Location</div>
      <div class="form-group" style="margin-bottom:12px;">
        <label>Location Name</label>
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
  
  const overlay = createModal(content);
  overlay.classList.add('location-manager-overlay');
  
  const grid = overlay.querySelector('#emoji-grid');
  if (grid && EMOJI_LIBRARY) {
    let html = '';
    for (const [category, emojis] of Object.entries(EMOJI_LIBRARY)) {
      html += `<div class="emoji-category-label">${category}</div>`;
      for (const emoji of emojis) {
        html += `<div class="emoji-cell" onclick="window.selectCategoryEmoji('${emoji}', this)">${emoji}</div>`;
      }
    }
    grid.innerHTML = html;
  }
};

window.selectedCategoryEmoji = null;

function refreshCategoryManager() {
  document.querySelectorAll('.location-manager-overlay, .location-reassign-overlay').forEach(modal => modal.remove());
  window.openCategoryManager();
}

window.selectCategoryEmoji = (emoji, cell) => {
  window.selectedCategoryEmoji = emoji;
  const modal = cell?.closest('.location-manager-overlay') || document.querySelector('.location-manager-overlay:last-of-type');
  modal?.querySelectorAll('.emoji-cell').forEach(c => c.classList.remove('selected'));
  cell?.classList.add('selected');
  const previewEmoji = modal?.querySelector('#preview-emoji');
  const previewText = modal?.querySelector('#preview-text');
  if (previewEmoji) previewEmoji.textContent = emoji;
  if (previewText) previewText.textContent = `Selected: ${emoji}`;
};

window.createCategory = async () => {
  const name = document.getElementById('new-cat-name').value.trim();
  if (!name) { showToast('⚠️', 'Name Required', 'Please enter a location name.'); return; }
  if (!window.selectedCategoryEmoji) { showToast('⚠️', 'Icon Required', 'Please select an emoji icon.'); return; }
  const exists = window.state.customCategories.some(c => c.name.toLowerCase() === name.toLowerCase());
  if (exists) { showToast('⚠️', 'Duplicate Name', `A location named "${name}" already exists.`); return; }
  const newCat = {
    id: 'cat_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name, emoji: window.selectedCategoryEmoji, builtin: false
  };
  window.state.customCategories.push(newCat);
  const saved = await saveSharedRealm();
  if (saved) {
    window.selectedCategoryEmoji = null;
    showToast('📍', 'Location Created!', `"${name}" added.`);
    refreshCategoryManager();
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
    if (confirm(`Delete location "${cat.emoji} ${cat.name}"?`)) await deleteCategory(catId);
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
        <h3 class="modal-title">⚠️ Location In Use</h3>
        <button class="modal-close" onclick="window.closeTopModal()">&times;</button>
      </div>
      <div class="reassign-warning">
        <strong>${cat.emoji} ${escapeHtml(cat.name)}</strong> is used by <strong>${activeQuests.length} active</strong> and <strong>${completedQuests.length} completed</strong> quest(s).<br>
        Choose a new location for these quests before deleting.
      </div>
      <div style="font-family:'Cinzel',serif; font-size:0.9rem; color:var(--gold-light); margin-bottom:8px;">Affected Quests:</div>
      <div class="reassign-quest-list">${questListHtml}</div>
      <div class="form-group">
        <label>Reassign to Location</label>
        <select id="reassign-target">${categoryOptions}</select>
      </div>
      <div class="modal-actions">
        <button class="btn-modal btn-cancel" onclick="window.closeTopModal()">Cancel</button>
        <button class="btn-modal btn-danger" onclick="window.confirmDeleteWithReassign('${catId}')">🗑️ Reassign & Delete</button>
      </div>
    `;
    const overlay = createModal(content);
    overlay.classList.add('location-reassign-overlay');
  }
};

window.confirmDeleteWithReassign = async (catId) => {
  const newCatId = document.getElementById('reassign-target').value;
  if (!newCatId) { showToast('⚠️', 'No Target', 'Please select a location.'); return; }
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
  const saved = await saveSharedRealm();
  if (saved) {
    showToast('🗑️', 'Location Deleted', 'Location removed.');
    refreshCategoryManager();
    window.renderAll(); // Immediate UI update
  } else {
    showToast('⚠️', 'Delete Failed', 'Could not save changes.');
  }
}

window.closeModal = closeModal;

// Initialize app - NO MORE setInterval
init();
