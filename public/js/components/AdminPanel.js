import { createModal } from './Modal.js';
import { escapeHtml } from '../utils/helpers.js';

export function openAdminPanel(connectionStatus, lastSaveError, customCategories, state) {
  const customCatCount = (customCategories || []).length;
  const templateCount = (state.templates || []).length;
  const activity = (state.activity || []).slice(0, 6);
  const activityHtml = activity.length
    ? activity.map(item => `<div style="padding:7px 0;border-bottom:1px solid rgba(212,168,67,.15);">${escapeHtml(item.icon || '📜')} ${escapeHtml(item.message || '')}<span style="float:right;opacity:.55;font-size:.72rem;">${item.at ? new Date(item.at).toLocaleDateString() : ''}</span></div>`).join('')
    : '<div style="opacity:.7;font-style:italic;">Your recent quest activity will appear here.</div>';
  const completedCount = (state.completed || []).length + (state.archived || []).length;
  const achievements = [
    completedCount >= 1 && '📜 First Quest — completed your first quest',
    completedCount >= 10 && '🏅 Veteran Adventurer — completed 10 quests',
    state.streak >= 7 && '🔥 Flame Keeper — a 7-day streak',
    state.level >= 5 && '👑 Seasoned Hero — reached Level 5',
    (state.templates || []).length >= 3 && '🧠 Ritual Master — created 3 templates'
  ].filter(Boolean);
  const achievementHtml = achievements.length
    ? achievements.map(item => `<div style="padding:7px 0;border-bottom:1px solid rgba(212,168,67,.15);">${item}</div>`).join('')
    : '<div style="opacity:.7;font-style:italic;">Complete quests, build a streak, and create templates to earn badges.</div>';
  
  const content = `
    <div class="modal-header">
      <h3 class="modal-title">📖 Tavern Keeper's Grimoire</h3>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>

    <div class="admin-section">
      <div class="admin-section-title">🕯️ Recent Activity</div>
      <div style="font-size:.82rem;color:var(--parchment-dark);">${activityHtml}</div>
    </div>

    <div class="admin-section">
      <div class="admin-section-title">🏆 Achievements</div>
      <div style="font-size:.82rem;color:var(--parchment-dark);">${achievementHtml}</div>
    </div>
    
    <div class="admin-section">
      <div class="admin-section-title">👥 Manage Adventurers</div>
      <div class="admin-grid">
        <button class="admin-btn" onclick="window.showCharacterSelect(); window.closeModal();">
          <span class="admin-icon">🛡️</span>
          <span>View Roster</span>
          <span class="admin-label">Switch or create characters</span>
        </button>
      </div>
    </div>
    
    <div class="admin-section">
      <div class="admin-section-title">📋 Quest Templates <span style="font-size:0.8rem; opacity:0.7;">(${templateCount})</span></div>
      <div class="admin-grid">
        <button class="admin-btn" onclick="window.openTemplateManager()" style="grid-column:1/-1;">
          <span class="admin-icon">📋</span>
          <span>Manage Templates</span>
          <span class="admin-label">Create, edit, or remove quest templates</span>
        </button>
      </div>
    </div>
    
    <div class="admin-section">
      <div class="admin-section-title">🏷️ Categories <span style="font-size:0.8rem; opacity:0.7;">(${customCatCount} custom)</span></div>
      <div class="admin-grid">
        <button class="admin-btn" onclick="window.openCategoryManager()" style="grid-column:1/-1;">
          <span class="admin-icon">🏷️</span>
          <span>Manage Categories</span>
          <span class="admin-label">Create or remove categories</span>
        </button>
      </div>
    </div>
    
    <div class="admin-section">
      <div class="admin-section-title">✨ Reset Statistics</div>
      <div class="admin-grid">
        <button class="admin-btn" onclick="window.adminResetStreak()">
          <span class="admin-icon">🔥</span>
          <span>Reset Streak</span>
          <span class="admin-label">Current: ${state.streak}</span>
        </button>
        <button class="admin-btn" onclick="window.adminResetXP()">
          <span class="admin-icon">📉</span>
          <span>Reset XP & Level</span>
          <span class="admin-label">Lvl ${state.level} / ${state.xp} XP</span>
        </button>
      </div>
    </div>
    
    <div class="admin-section">
      <div class="admin-section-title">📜 Backup & Restore</div>
      <div class="admin-grid">
        <button class="admin-btn" onclick="window.openBackupManager()" style="grid-column:1/-1;">
          <span class="admin-icon">🗄️</span>
          <span>Open Backup Vault</span>
          <span class="admin-label">Browse, create, or restore realm snapshots</span>
        </button>
        <button class="admin-btn" onclick="window.adminExportData()">
          <span class="admin-icon">📤</span>
          <span>Export Data</span>
          <span class="admin-label">Download JSON backup</span>
        </button>
        <button class="admin-btn" onclick="window.adminImportData()">
          <span class="admin-icon">📥</span>
          <span>Import Data</span>
          <span class="admin-label">Restore from JSON</span>
        </button>
      </div>
    </div>
    
    <div class="admin-section admin-danger-zone">
      <div class="admin-section-title">☠️ Danger Zone</div>
      <button class="admin-danger-btn" onclick="window.adminWipeAll()">🗑️ Wipe Character Data</button>
      <div style="font-size:0.75rem; color:var(--parchment-dark); margin-top:8px; text-align:center; opacity:0.7;">Deletes all quests and XP for THIS character only.</div>
    </div>
    
    <div class="modal-actions">
      <button class="btn-modal btn-cancel" onclick="window.closeModal()">Close</button>
    </div>
  `;
  
  createModal(content);
}
