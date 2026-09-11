import { createModal } from './Modal.js';
import { escapeHtml } from '../utils/helpers.js';

export function openAdventurerProfile(state, adventurer) {
  const completed = (state.completed || []).length + (state.archived || []).length;
  const active = (state.quests || []).length;
  const level = Math.max(1, Number(state.level) || 1);
  const rankAchievements = [
    { icon: '🪶', name: 'F-Rank Adventurer', level: 2 },
    { icon: '🛡️', name: 'E-Rank Adventurer', level: 10 },
    { icon: '⚔️', name: 'D-Rank Adventurer', level: 25 },
    { icon: '🏹', name: 'C-Rank Adventurer', level: 40 },
    { icon: '🦁', name: 'B-Rank Adventurer', level: 60 },
    { icon: '👑', name: 'A-Rank Adventurer', level: 80 },
    { icon: '🌟', name: 'S-Rank Adventurer', level: 100 }
  ].map(rank => ({
    ...rank,
    detail: `Level ${Math.min(level, rank.level)} / ${rank.level}`,
    unlocked: level >= rank.level
  }));
  const currentRank = [...rankAchievements].reverse().find(rank => rank.unlocked);
  const achievements = [
    { icon: '📜', name: 'First Quest', detail: 'Complete your first quest.', unlocked: completed >= 1 },
    { icon: '🏅', name: 'Veteran Adventurer', detail: `${Math.min(completed, 10)} / 10 quests completed`, unlocked: completed >= 10 },
    { icon: '🏆', name: 'Questing Veteran', detail: `${Math.min(completed, 50)} / 50 quests completed`, unlocked: completed >= 50 },
    { icon: '📚', name: 'Living Legend', detail: `${Math.min(completed, 100)} / 100 quests completed`, unlocked: completed >= 100 },
    { icon: '🔥', name: 'Flame Keeper', detail: `${Math.min(state.streak || 0, 7)} / 7 day streak`, unlocked: (state.streak || 0) >= 7 },
    { icon: '🔥', name: 'Eternal Flame', detail: `${Math.min(state.streak || 0, 30)} / 30 day streak`, unlocked: (state.streak || 0) >= 30 },
    { icon: '🧠', name: 'Ritual Master', detail: `${Math.min((state.templates || []).length, 3)} / 3 templates created`, unlocked: (state.templates || []).length >= 3 },
    { icon: '📖', name: 'Grimoire Keeper', detail: `${Math.min((state.templates || []).length, 10)} / 10 templates created`, unlocked: (state.templates || []).length >= 10 }
  ];
  const earned = [...rankAchievements, ...achievements].filter(achievement => achievement.unlocked).length;
  const renderAchievement = achievement => `
    <article class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
      <span class="achievement-icon">${achievement.unlocked ? achievement.icon : '🔒'}</span>
      <div><strong>${achievement.name}</strong><span>${achievement.unlocked ? 'Earned' : achievement.detail}</span></div>
    </article>
  `;
  const rankHtml = rankAchievements.map(renderAchievement).join('');
  const achievementHtml = achievements.map(renderAchievement).join('');

  const overlay = createModal(`
    <div class="adventurer-profile" role="dialog" aria-modal="true" aria-label="Adventurer achievements">
      <div class="modal-header">
        <h3 class="modal-title">🏆 Adventurer's Chronicle</h3>
        <button class="modal-close" type="button" onclick="window.closeTopModal()" aria-label="Close">&times;</button>
      </div>
      <div class="adventurer-hero">
        <span class="adventurer-profile-avatar">${escapeHtml(adventurer.avatar || '⚔️')}</span>
        <div><h4>${escapeHtml(adventurer.name || 'Adventurer')}</h4><p>${currentRank ? currentRank.name : 'Unranked Adventurer'} · Level ${level} · ${state.xp || 0} XP</p></div>
      </div>
      <div class="adventurer-stat-grid">
        <div><strong>${completed}</strong><span>Completed</span></div>
        <div><strong>${active}</strong><span>Active</span></div>
        <div><strong>${state.streak || 0}</strong><span>Day streak</span></div>
      </div>
      <div class="adventurer-achievement-heading"><span>Guild Ranks</span><strong>${rankAchievements.filter(rank => rank.unlocked).length} / ${rankAchievements.length}</strong></div>
      <div class="achievement-list rank-achievement-list">${rankHtml}</div>
      <div class="adventurer-achievement-heading"><span>Achievements</span><strong>${earned} / ${rankAchievements.length + achievements.length}</strong></div>
      <div class="achievement-list achievement-grid">${achievementHtml}</div>
      <div class="modal-actions"><button class="btn-modal btn-cancel" type="button" onclick="window.closeTopModal()">Close</button></div>
    </div>
  `);
  overlay.querySelector('.modal')?.classList.add('adventurer-profile-modal');
}
