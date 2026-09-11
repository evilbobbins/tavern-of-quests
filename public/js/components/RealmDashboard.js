import { loadState, loadUsers } from '../services/api.js';
import { escapeHtml } from '../utils/helpers.js';
import { createModal } from './Modal.js';

function dueStatus(quest) {
  if (!quest.dueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(`${quest.dueDate}T00:00:00`);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return { label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`, urgent: true };
  if (days === 0) return { label: 'Due today', urgent: true };
  if (days === 1) return { label: 'Due tomorrow', urgent: false };
  return null;
}

export async function openRealmDashboard() {
  const content = `<div class="modal-header"><h3 class="modal-title">🌍 The Realm Chronicle</h3><button class="modal-close" onclick="window.closeTopModal()">&times;</button></div><div class="empty-state">Gathering the realm’s quests…</div>`;
  const modal = createModal(content);
  try {
    const users = await loadUsers();
    const states = await Promise.all(users.map(async user => ({ user, state: await loadState(user.id) })));
    const active = states.reduce((total, entry) => total + (entry.state?.quests?.length || 0), 0);
    const completed = states.reduce((total, entry) => total + (entry.state?.completed?.length || 0), 0);
    const runefallScores = states.find(entry => Array.isArray(entry.state?.runefallScores))?.state?.runefallScores || [];
    const champion = [...runefallScores].sort((a, b) => b.score - a.score || new Date(a.achievedAt) - new Date(b.achievedAt))[0];
    const reminders = states.flatMap(({ user, state }) => (state?.quests || []).map(quest => ({ user, quest, status: dueStatus(quest) })).filter(item => item.status));
    const roster = states.map(({ user, state }) => `<div class="realm-member"><span class="realm-avatar">${escapeHtml(user.avatar)}</span><div><strong>${escapeHtml(user.name)}</strong><div>${state?.quests?.length || 0} active · ${state?.completed?.length || 0} completed · Level ${state?.level || 1}</div></div></div>`).join('') || '<div class="empty-state">No adventurers have joined the realm yet.</div>';
    const reminderHtml = reminders.length
      ? reminders.sort((a, b) => a.quest.dueDate.localeCompare(b.quest.dueDate)).map(({ user, quest, status }) => `<div class="realm-reminder ${status.urgent ? 'urgent' : ''}"><span>${escapeHtml(user.avatar)}</span><div><strong>${escapeHtml(quest.name)}</strong><div>${escapeHtml(user.name)} · ${status.label}</div></div></div>`).join('')
      : '<div class="empty-state">🕯️ No quests are due today or tomorrow.</div>';
    modal.querySelector('.modal-inner').innerHTML = `
      <div class="modal-header"><h3 class="modal-title">🌍 The Realm Chronicle</h3><button class="modal-close" onclick="window.closeTopModal()">&times;</button></div>
      <div class="realm-stats"><div><strong>${users.length}</strong><span>Adventurers</span></div><div><strong>${active}</strong><span>Active quests</span></div><div><strong>${completed}</strong><span>Completed quests</span></div></div>
      <section class="realm-champion"><span>${champion ? escapeHtml(champion.avatar || '👑') : '👑'}</span><div><small>Current Runefall Champion</small><strong>${champion ? escapeHtml(champion.name) : 'The crown awaits'}</strong><p>${champion ? `${Number(champion.score).toLocaleString()} renown · ${new Date(champion.achievedAt).toLocaleDateString()}` : 'Play Runefall Revel to claim the first score.'}</p></div></section>
      <div class="admin-section"><div class="admin-section-title">⏰ Due Soon</div><div class="realm-reminders">${reminderHtml}</div></div>
      <div class="admin-section"><div class="admin-section-title">🛡️ Adventurer Roster</div><div class="realm-roster">${roster}</div></div>
      <div class="modal-actions"><button class="btn-modal btn-cancel" onclick="window.closeTopModal()">Close</button></div>`;
  } catch (err) {
    modal.querySelector('.modal-inner').innerHTML = `<div class="modal-header"><h3 class="modal-title">🌍 The Realm Chronicle</h3><button class="modal-close" onclick="window.closeTopModal()">&times;</button></div><div class="empty-state">The realm could not be loaded. Please try again.</div>`;
  }
}
