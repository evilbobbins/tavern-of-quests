import { createModal } from './Modal.js';
import { escapeHtml } from '../utils/helpers.js';
import { adventurerLabel, avatarMarkup, getGuildCharacter } from '../characters.js';
import { getLootDetails } from '../utils/lootCatalog.js';

function openPortraitViewer(character) {
  const overlay = createModal(`
    <div class="portrait-viewer" role="dialog" aria-modal="true" aria-label="${escapeHtml(character.name)} portrait">
      <div class="modal-header"><h3 class="modal-title">${escapeHtml(character.name)}</h3><button class="modal-close" type="button" onclick="window.closeTopModal()" aria-label="Close portrait">&times;</button></div>
      <img class="portrait-viewer-art" src="${character.portrait}" alt="Full artwork of ${escapeHtml(character.name)}">
      <p>${escapeHtml(character.role)}</p>
    </div>
  `);
  overlay.querySelector('.modal')?.classList.add('portrait-viewer-modal');
}
function openLootViewer(item) {
  const details = getLootDetails(item.name);
  const overlay = createModal(`
    <div class="loot-viewer" role="dialog" aria-modal="true" aria-label="${escapeHtml(item.name)} lore">
      <div class="modal-header"><h3 class="modal-title">${escapeHtml(item.emoji)} ${escapeHtml(item.name)}</h3><button class="modal-close" type="button" onclick="window.closeTopModal()" aria-label="Close loot lore">&times;</button></div>
      <img class="loot-viewer-art" src="${details.image}" alt="Artwork of ${escapeHtml(item.name)}">
      <span class="loot-viewer-source">${escapeHtml(item.rarity)} relic · Found in ${escapeHtml(item.locationEmoji)} ${escapeHtml(item.locationName)}</span>
      <p>${escapeHtml(details.lore)}</p>
    </div>
  `);
  overlay.querySelector('.modal')?.classList.add('loot-viewer-modal');
}

export function openAdventurerProfile(state, adventurer) {
  const completed = (state.completed || []).length + (state.archived || []).length;
  const active = (state.quests || []).length;
  const loot = [...(state.loot || [])].sort((a, b) => new Date(b.foundAt) - new Date(a.foundAt));
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
  const character = getGuildCharacter(adventurer.avatar);
  const avatarHtml = character ? `<button class="adventurer-profile-avatar avatar-art-button" id="view-adventurer-art" type="button" aria-label="View full artwork for ${escapeHtml(character.name)}">${avatarMarkup(adventurer.avatar, 'adventurer-profile-portrait')}</button>` : `<span class="adventurer-profile-avatar">${avatarMarkup(adventurer.avatar, 'adventurer-profile-portrait')}</span>`;
  const editButtonHtml = adventurer.id ? `<button class="btn-profile-edit" id="edit-adventurer" type="button">✏️ Edit Adventurer</button>` : '';
  const storyHtml = character ? `<div class="adventurer-story"><span>Guild Tale</span><p>${escapeHtml(character.story)}</p></div>` : '';
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
  const lootHtml = loot.length
    ? loot.map((item, index) => {
      const details = getLootDetails(item.name);
      return `<article class="loot-card rarity-${escapeHtml(item.rarity)}"><button class="loot-art-button" type="button" data-loot-index="${index}" aria-label="View artwork and lore for ${escapeHtml(item.name)}"><img src="${details.image}" alt="${escapeHtml(item.name)}"></button><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.rarity)} · ${escapeHtml(item.locationEmoji)} ${escapeHtml(item.locationName)}</span><small>${new Date(item.foundAt).toLocaleDateString()}</small></div></article>`;
    }).join('')
    : '<div class="loot-empty">Complete quests to discover treasures from across the realm.</div>';
  const emptySatchelButton = loot.length ? '<button class="btn-empty-satchel" type="button" onclick="window.emptyAdventurerSatchel()">Empty Satchel</button>' : '';

  const overlay = createModal(`
    <div class="adventurer-profile" role="dialog" aria-modal="true" aria-label="Adventurer achievements">
      <div class="modal-header">
        <h3 class="modal-title">🏆 Adventurer's Chronicle</h3>
        <div class="adventurer-profile-actions">
          ${editButtonHtml}
          <button class="modal-close" type="button" onclick="window.closeTopModal()" aria-label="Close">&times;</button>
        </div>
      </div>
      <div class="adventurer-hero ${character ? 'guild-hero' : ''}">
        ${avatarHtml}
        <div>
          ${character ? `<span class="adventurer-hero-role">${escapeHtml(character.role)}</span>` : ''}
          <h4>${escapeHtml(adventurerLabel(adventurer))}</h4>
          <p>${currentRank ? currentRank.name : 'Unranked Adventurer'} · Level ${level} · ${state.xp || 0} XP</p>
        </div>
      </div>
      ${storyHtml}
      <div class="adventurer-stat-grid">
        <div><strong>${completed}</strong><span>Completed</span></div>
        <div><strong>${active}</strong><span>Active</span></div>
        <div><strong>${state.streak || 0}</strong><span>Day streak</span></div>
      </div>
      <div class="adventurer-achievement-heading"><span>🎒 Adventurer’s Satchel</span><div class="satchel-heading-actions"><strong>${loot.length} found</strong>${emptySatchelButton}</div></div>
      <div class="loot-list">${lootHtml}</div>
      <div class="adventurer-achievement-heading"><span>Guild Ranks</span><strong>${rankAchievements.filter(rank => rank.unlocked).length} / ${rankAchievements.length}</strong></div>
      <div class="achievement-list rank-achievement-list">${rankHtml}</div>
      <div class="adventurer-achievement-heading"><span>Achievements</span><strong>${earned} / ${rankAchievements.length + achievements.length}</strong></div>
      <div class="achievement-list achievement-grid">${achievementHtml}</div>
      <div class="modal-actions"><button class="btn-modal btn-cancel" type="button" onclick="window.closeTopModal()">Close</button></div>
    </div>
  `);
  overlay.querySelector('.modal')?.classList.add('adventurer-profile-modal');
  overlay.querySelector('#view-adventurer-art')?.addEventListener('click', () => openPortraitViewer(character));
  overlay.querySelectorAll('[data-loot-index]').forEach(button => button.addEventListener('click', () => {
    const item = loot[Number(button.dataset.lootIndex)];
    if (item) openLootViewer(item);
  }));
  overlay.querySelector('#edit-adventurer')?.addEventListener('click', () => {
    overlay.remove();
    window.openEditCharModal?.(adventurer.id);
  });
}
