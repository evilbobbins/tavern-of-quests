import { createModal, closeTopModal } from './Modal.js';
import { getAllCategories } from '../utils/categoryUtils.js';
import { escapeHtml } from '../utils/helpers.js';

const DEFAULT_REGIONS = [
  { id: 'household', name: 'The Castle', icon: '🏰', description: 'Home, routines, and everyday comforts.' },
  { id: 'technology', name: "The Wizard's Lair", icon: '🧙', description: 'Projects, repairs, and bright new ideas.' },
  { id: 'academy', name: 'Mooncrest Academy', icon: '🎓', description: 'Learning, research, and ambitious study quests.' },
  { id: 'unassigned', name: 'The Crossroads', icon: '🧭', description: 'Unsorted quests waiting for a place.' }
];

function getRegions(customCategories = []) {
  const custom = getAllCategories(customCategories)
    .filter(category => !['household', 'technology', 'academy'].includes(category.id))
    .map((category, index) => ({
      id: category.id,
      name: index % 2 ? 'The Workshop Annex' : 'Garden Glen',
      icon: category.emoji || '🗺️',
      description: `${category.name} quests gathered together.`
    }));
  return [...DEFAULT_REGIONS.slice(0, 3), ...custom, DEFAULT_REGIONS[3]];
}

function regionForQuest(quest, regions) {
  return regions.some(region => region.id === quest.category) ? quest.category : 'unassigned';
}

export function openRealmMap(state) {
  const regions = getRegions(state.customCategories);
  const activeQuests = Array.isArray(state.quests) ? state.quests : [];
  const selectedRegion = regions[0].id;
  const overlay = createModal(`
    <div class="realm-map-modal" role="dialog" aria-modal="true" aria-label="Explore the realm map">
      <div class="realm-map-topbar">
        <div><span class="realm-map-kicker">A new way to view the board</span><h2>🗺️ Realm Map</h2></div>
        <button class="modal-close realm-map-close" id="btn-close-realm-map" aria-label="Close realm map">×</button>
      </div>
      <div class="realm-map-stage">
        <div class="realm-map-locations" id="realm-map-locations" role="group" aria-label="Realm locations"></div>
        <aside class="realm-map-drawer" aria-live="polite">
          <span class="realm-map-kicker">Location quest board</span>
          <h3 id="realm-map-title"></h3>
          <p id="realm-map-description"></p>
          <div class="realm-map-quests" id="realm-map-quests"></div>
          <div class="realm-map-progress"><span id="realm-map-progress-label"></span><strong id="realm-map-progress-value"></strong></div>
          <div class="realm-map-progress-track"><span id="realm-map-progress-bar"></span></div>
        </aside>
      </div>
    </div>
  `, closeTopModal);
  overlay.querySelector('.modal').classList.add('realm-map-shell');

  const locations = overlay.querySelector('#realm-map-locations');
  const renderRegion = (id) => {
    const region = regions.find(item => item.id === id) || regions[0];
    const quests = activeQuests.filter(quest => regionForQuest(quest, regions) === region.id);
    locations.innerHTML = regions.map(item => {
      const count = activeQuests.filter(quest => regionForQuest(quest, regions) === item.id).length;
      return `<button type="button" class="realm-map-location ${item.id === region.id ? 'active' : ''}" data-region="${escapeHtml(item.id)}"><span>${item.icon}</span><strong>${escapeHtml(item.name)}</strong><small>${count} active ${count === 1 ? 'quest' : 'quests'}</small></button>`;
    }).join('');
    overlay.querySelector('#realm-map-title').textContent = region.name;
    overlay.querySelector('#realm-map-description').textContent = region.description;
    overlay.querySelector('#realm-map-quests').innerHTML = quests.length
      ? quests.slice(0, 4).map(quest => `<article class="realm-map-quest"><strong>${escapeHtml(quest.name)}</strong><span>${quest.type === 'main' ? 'Main quest' : 'Side quest'}${quest.dueDate ? ` · Due ${escapeHtml(quest.dueDate)}` : ''}</span></article>`).join('')
      : '<div class="realm-map-empty">No active quests here yet. Post one on the main board, then return to the map.</div>';
    const completedHere = (state.completed || []).filter(quest => regionForQuest(quest, regions) === region.id).length;
    const total = quests.length + completedHere;
    const progress = total ? Math.round((completedHere / total) * 100) : 0;
    overlay.querySelector('#realm-map-progress-label').textContent = `${region.name} progress`;
    overlay.querySelector('#realm-map-progress-value').textContent = `${progress}%`;
    overlay.querySelector('#realm-map-progress-bar').style.width = `${progress}%`;
    locations.querySelectorAll('[data-region]').forEach(button => button.addEventListener('click', () => renderRegion(button.dataset.region)));
  };

  overlay.querySelector('#btn-close-realm-map').addEventListener('click', closeTopModal);
  renderRegion(selectedRegion);
}
