import { createModal } from './Modal.js';

export function openAdminPanel(connectionStatus, lastSaveError, customCategories, state) {
  const customCatCount = (customCategories || []).length;
  const templateCount = (state.templates || []).length;
  
  const content = `
    <div class="modal-header">
      <h3 class="modal-title">📖 Tavern Keeper's Grimoire</h3>
      <button class="modal-close" onclick="window.closeModal()">&times;</button>
    </div>

    <div class="admin-grimoire-grid">
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
      <div class="admin-section-title">🕯️ Realm Chronicle</div>
      <div class="admin-grid">
        <button class="admin-btn" onclick="window.openActivityLog()" style="grid-column:1/-1;">
          <span class="admin-icon">🕯️</span>
          <span>View Recent Activity</span>
          <span class="admin-label">Review the last 20 happenings in the realm</span>
        </button>
      </div>
    </div>
    
    <div class="admin-section">
      <div class="admin-section-title">📋 Shared Quest Templates <span style="font-size:0.8rem; opacity:0.7;">(${templateCount})</span></div>
      <div class="admin-grid">
        <button class="admin-btn" onclick="window.openTemplateManager()" style="grid-column:1/-1;">
          <span class="admin-icon">📋</span>
          <span>Manage Templates</span>
          <span class="admin-label">Shared by every adventurer</span>
        </button>
      </div>
    </div>
    
    <div class="admin-section">
      <div class="admin-section-title">📍 Shared Locations <span style="font-size:0.8rem; opacity:0.7;">(${customCatCount} custom)</span></div>
      <div class="admin-grid">
        <button class="admin-btn" onclick="window.openCategoryManager()" style="grid-column:1/-1;">
          <span class="admin-icon">📍</span>
          <span>Manage Locations</span>
          <span class="admin-label">Shared by every adventurer</span>
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
  
  const overlay = createModal(content);
  overlay.querySelector('.modal')?.classList.add('admin-modal');
}
