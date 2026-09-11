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
    <section class="backup-offline-copy"><div><strong>💾 Offline Realm Copy</strong><p>Download or import the entire realm: every adventurer, shared location, template, score, and quest.</p></div><div class="backup-offline-actions"><button class="btn-modal btn-cancel" type="button" onclick="window.exportRealmBackup()">📤 Export Realm</button><button class="btn-modal btn-save" type="button" onclick="window.importRealmBackup()">📥 Import Realm</button></div></section>
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

window.exportRealmBackup = async () => {
  const result = await apiFetch('/api/realm/export');
  if (!result.success || !result.realm) return showToast('⚠️', 'Export Failed', result.error || 'Could not prepare the realm export.');
  const blob = new Blob([JSON.stringify(result.realm, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tavern-realm-${(result.exportedAt || new Date().toISOString()).slice(0, 10)}.json`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  showToast('📤', 'Realm Exported', 'An offline copy of the full realm was downloaded.');
};

window.importRealmBackup = () => {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,application/json';
  input.onchange = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const realm = JSON.parse(await file.text());
      if (!confirm('⚠️ Import this full realm backup? It replaces every adventurer, shared locations, templates, and Runefall scores. A safety backup of the current realm will be created first.')) return;
      const result = await apiFetch('/api/realm/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ realm }) });
      if (!result.success) return showToast('⚠️', 'Import Failed', result.error || 'Could not import that realm copy.');
      closeTopModal();
      showToast('🛟', 'Realm Imported', 'The full realm was restored and a safety snapshot was saved.');
      await window.loadAppState();
    } catch {
      showToast('⚠️', 'Import Failed', 'Choose a valid Tavern realm export file.');
    }
  };
  input.click();
};
