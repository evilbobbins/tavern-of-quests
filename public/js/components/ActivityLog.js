import { createModal } from './Modal.js';
import { escapeHtml } from '../utils/helpers.js';

export function openActivityLog(activity = []) {
  const entries = activity.slice(0, 20);
  const rows = entries.length
    ? entries.map(item => {
        const time = item.at ? new Date(item.at).toLocaleString() : 'Unknown time';
        return `<article class="activity-log-entry"><span class="activity-log-icon">${escapeHtml(item.icon || '📜')}</span><div><strong>${escapeHtml(item.message || 'Realm activity')}</strong><span>${escapeHtml(time)}</span></div></article>`;
      }).join('')
    : '<div class="activity-log-empty">Your adventures will be recorded here as you post, complete, and manage quests.</div>';

  createModal(`
    <div class="activity-log-modal" role="dialog" aria-modal="true" aria-label="Recent activity">
      <div class="modal-header">
        <h3 class="modal-title">🕯️ Recent Activity</h3>
        <button class="modal-close" type="button" onclick="window.closeTopModal()" aria-label="Close">&times;</button>
      </div>
      <div class="activity-log-list">${rows}</div>
      <div class="modal-actions"><button class="btn-modal btn-cancel" type="button" onclick="window.closeTopModal()">Close</button></div>
    </div>
  `);
}
