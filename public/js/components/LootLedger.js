import { createModal } from './Modal.js';
import { LOOT_CATALOG, getLootSource } from '../utils/lootCatalog.js';
import { openLootViewer } from './AdventurerProfile.js';
import { escapeHtml } from '../utils/helpers.js';

export function openLootLedger() {
  const relics = Object.entries(LOOT_CATALOG).map(([name, details]) => ({ name, ...details, source: getLootSource(name) }));
  const overlay = createModal(`
    <div class="loot-ledger" role="dialog" aria-modal="true" aria-label="Realm relic ledger">
      <div class="modal-header"><h3 class="modal-title">🎒 The Realm Relic Ledger</h3><button class="modal-close" type="button" onclick="window.closeTopModal()" aria-label="Close relic ledger">&times;</button></div>
      <p class="loot-ledger-intro">Every treasure that may be discovered in the realm. Select a relic to inspect its full artwork and tale.</p>
      <div class="loot-ledger-grid">${relics.map((relic, index) => `<button class="loot-ledger-card" type="button" data-relic-index="${index}" aria-label="View ${escapeHtml(relic.name)} artwork and lore"><img src="${relic.image}" alt="${escapeHtml(relic.name)}"><strong>${escapeHtml(relic.name)}</strong><small>${relic.source.emoji} ${escapeHtml(relic.source.name)}</small></button>`).join('')}</div>
      <div class="modal-actions"><button class="btn-modal btn-cancel" type="button" onclick="window.closeTopModal()">Close</button></div>
    </div>
  `);
  overlay.querySelector('.modal')?.classList.add('loot-ledger-modal');
  overlay.querySelectorAll('[data-relic-index]').forEach(button => button.addEventListener('click', () => {
    const relic = relics[Number(button.dataset.relicIndex)];
    if (relic) openLootViewer({ name: relic.name, emoji: '✨', rarity: 'Relic', locationEmoji: relic.source.emoji, locationName: relic.source.name });
  }));
}
