import { apiFetch } from '../services/api.js';
import { escapeHtml, showToast } from '../utils/helpers.js';
import { createModal, closeTopModal } from './Modal.js';

function formatSize(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export async function openBackupManager() {
  const overlay = createModal(`<div class="modal-header"><h3 class="modal-title">🗄️ Backup Vault</h3><button class="modal-close" onclick="window.closeTopModal()">&times;</button></div><div class="empty-state">Opening the vault…</div>`);
  const result = await apiFetch('/api/backups');
  if (!result.success) {
    overlay.querySelector('.modal-inner').innerHTML = `<div class="modal-header"><h3 class="modal-title">🗄️ Backup Vault</h3><button class="modal-close" onclick="window.closeTopModal()">&times;</button></div><div class="empty-state">Could not load backups.</div>`;
    return;
  }
  const rows = result.backups.length
    ? result.backups.map(backup => `<div class="backup-item"><div><strong>${backup.type === 'manual' ? '✋ Manual' : backup.type === 'pre' ? '🛟 Safety' : '⏲️ Automatic'} backup</strong><div class="backup-meta">${new Date(backup.createdAt).toLocaleString()} · ${formatSize(backup.size)}</div></div><button class="quest-btn restore-btn" type="button" onclick="window.restoreBackup('${escapeHtml(backup.name)}')" title="Restore this backup" aria-label="Restore backup from ${new Date(backup.createdAt).toLocaleString()}">↻</button></div>`).join('')
    : '<div class="empty-state"><span class="empty-icon">🗄️</span>No server backups yet. Create one below.</div>';
  overlay.querySelector('.modal-inner').innerHTML = `
    <div class="modal-header"><h3 class="modal-title">🗄️ Backup Vault</h3><button class="modal-close" onclick="window.closeTopModal()">&times;</button></div>
    <p class="backup-note">Connection: <strong>${window.connectionStatus === 'online' ? 'Saved' : window.connectionStatus === 'syncing' ? 'Saving' : 'Offline'}</strong>${window.lastSaveError ? ` · ${escapeHtml(window.lastSaveError)}` : ''}<br>Automatic backups run every ${result.intervalHours} hour${result.intervalHours === 1 ? '' : 's'} and the vault retains ${result.retention} snapshots.</p>
    <div class="backup-list">${rows}</div>
    <div class="modal-actions"><button class="btn-modal btn-cancel" onclick="window.closeTopModal()">Close</button><button class="btn-modal btn-save" onclick="window.createManualBackup()">✋ Create Backup Now</button></div>`;
}

window.createManualBackup = async () => {
  const result = await apiFetch('/api/backups', { method: 'POST' });
  if (!result.success) return showToast('⚠️', 'Backup Failed', result.error || 'Could not create a snapshot.');
  showToast('🗄️', 'Backup Created', 'A manual realm snapshot is safely stored in the vault.');
  closeTopModal();
  openBackupManager();
};

window.restoreBackup = async name => {
  if (!confirm('Restore this realm backup? It will replace every adventurer’s current data. A safety backup of the current realm will be created first.')) return;
  const result = await apiFetch(`/api/backups/${encodeURIComponent(name)}/restore`, { method: 'POST' });
  if (!result.success) return showToast('⚠️', 'Restore Failed', result.error || 'Could not restore the selected backup.');
  closeTopModal();
  showToast('🛟', 'Backup Restored', 'The realm was restored. A safety snapshot of the previous state was saved.');
  await window.loadAppState();
};
