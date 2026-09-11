import { createModal } from './Modal.js';
import { escapeHtml } from '../utils/helpers.js';

export function openAdventurerProfile(state, adventurer) {
  const completed = (state.completed || []).length + (state.archived || []).length;
  const active = (state.quests || []).length;
  const achievements = [
    { icon: '📜', name: 'First Quest', detail: 'Complete your first quest.', unlocked: completed >= 1 },
    { icon: '🏅', name: 'Veteran Adventurer', detail: `${Math.min(completed, 10)} / 10 quests completed`, unlocked: completed >= 10 },
    { icon: '🔥', name: 'Flame Keeper', detail: `${Math.min(state.streak || 0, 7)} / 7 day streak`, unlocked: (state.streak || 0) >= 7 },
    { icon: '👑', name: 'Seasoned Hero', detail: `Level ${Math.min(state.level || 1, 5)} / 5`, unlocked: (state.level || 1) >= 5 },
    { icon: '🧠', name: 'Ritual Master', detail: `${Math.min((state.templates || []).length, 3)} / 3 templates created`, unlocked: (state.templates || []).length >= 3 }
  ];
  const earned = achievements.filter(achievement => achievement.unlocked).length;
  const achievementHtml = achievements.map(achievement => `
    <article class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
      <span class="achievement-icon">${achievement.unlocked ? achievement.icon : '🔒'}</span>
      <div><strong>${achievement.name}</strong><span>${achievement.unlocked ? 'Earned' : achievement.detail}</span></div>
    </article>
  `).join('');

  createModal(`
    <div class="adventurer-profile" role="dialog" aria-modal="true" aria-label="Adventurer achievements">
      <div class="modal-header">
        <h3 class="modal-title">🏆 Adventurer's Chronicle</h3>
        <button class="modal-close" type="button" onclick="window.closeTopModal()" aria-label="Close">&times;</button>
      </div>
      <div class="adventurer-hero">
        <span class="adventurer-profile-avatar">${escapeHtml(adventurer.avatar || '⚔️')}</span>
        <div><h4>${escapeHtml(adventurer.name || 'Adventurer')}</h4><p>Level ${state.level || 1} · ${state.xp || 0} XP</p></div>
      </div>
      <div class="adventurer-stat-grid">
        <div><strong>${completed}</strong><span>Completed</span></div>
        <div><strong>${active}</strong><span>Active</span></div>
        <div><strong>${state.streak || 0}</strong><span>Day streak</span></div>
      </div>
      <div class="adventurer-achievement-heading"><span>Achievements</span><strong>${earned} / ${achievements.length}</strong></div>
      <div class="achievement-list">${achievementHtml}</div>
      <div class="modal-actions"><button class="btn-modal btn-cancel" type="button" onclick="window.closeTopModal()">Close</button></div>
    </div>
  `);
}
