import { createModal } from './Modal.js';

export function openTavernGames({ openRunefall, openMemory }) {
  const overlay = createModal(`<div class="tavern-games-modal"><div class="modal-header"><h3 class="modal-title">🎲 Tavern Games</h3><button class="modal-close" type="button" onclick="window.closeTopModal()">&times;</button></div><p class="loot-ledger-intro">Choose a game, set a score, and claim a place in the realm’s legends.</p><div class="tavern-game-picker"><button data-game="runefall"><span>🔷</span><strong>Runefall Revel</strong><small>Stack enchanted runes and clear the board.</small></button><button data-game="memory"><span>🃏</span><strong>Relic Recall</strong><small>Match guild heroes and relics before time expires.</small></button></div></div>`);
  overlay.querySelector('[data-game="runefall"]').onclick = () => { overlay.remove(); openRunefall(); };
  overlay.querySelector('[data-game="memory"]').onclick = () => { overlay.remove(); openMemory(); };
}
