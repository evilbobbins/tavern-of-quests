import { createModal, closeModal } from './Modal.js';
import { GUILD_CHARACTERS, avatarMarkup } from '../characters.js';
import { LOOT_CATALOG } from '../utils/lootCatalog.js';
import { escapeHtml } from '../utils/helpers.js';

const LEVELS = [{ cols: 2, pairs: 2 }, { cols: 4, pairs: 4 }, { cols: 4, pairs: 6 }, { cols: 4, pairs: 8 }];
const CARD_POOL = [
  ...GUILD_CHARACTERS.map(hero => ({ id: `hero-${hero.id}`, name: hero.name, image: hero.portrait })),
  ...Object.entries(LOOT_CATALOG).map(([name, details]) => ({ id: `loot-${name}`, name, image: details.image }))
];

function shuffle(items) { return [...items].sort(() => Math.random() - .5); }
function scoreRows(scores) {
  const top = [...scores].sort((a, b) => b.score - a.score || new Date(a.achievedAt) - new Date(b.achievedAt)).slice(0, 3);
  return top.length ? top.map((entry, index) => `<div class="runefall-score ${index === 0 ? 'champion' : ''}"><span class="runefall-place">${index === 0 ? '👑' : `#${index + 1}`}</span><span class="runefall-score-avatar">${avatarMarkup(entry.avatar || '🃏', 'runefall-score-portrait')}</span><div><strong>${index === 0 ? 'Champion · ' : ''}${escapeHtml(entry.name)}</strong><small>${new Date(entry.achievedAt).toLocaleDateString()}</small></div><b>${entry.score}</b></div>`).join('') : '<div class="runefall-empty">No scores yet. Claim the first crown.</div>';
}

export function openMemoryMatch({ scores: initialScores = [], onScore = async () => initialScores } = {}) {
  const overlay = createModal(`<div class="memory-modal"><div class="blocks-heading"><div><p class="blocks-kicker">THE TAVERN GAME TABLE</p><h2 class="modal-title">✦ Relic Recall ✦</h2></div><button class="modal-close" id="memory-close">×</button></div><p class="blocks-intro">Match guild heroes and relics before the sands run out. Each victory grows the board.</p><div class="memory-stats"><div><span>Level</span><strong id="memory-level">1</strong></div><div><span>Pairs</span><strong id="memory-pairs">0</strong></div><div><span>Time</span><strong id="memory-time">0</strong></div><div><span>Score</span><strong id="memory-score">0</strong></div></div><div class="memory-board" id="memory-board"></div><div class="memory-actions"><button class="blocks-start" id="memory-start">▶ Begin Recall</button><span id="memory-message">Match every pair to advance.</span></div><section class="runefall-scoreboard"><div class="blocks-label">🏆 Relic Recall — Top Three</div><div id="memory-scores">${scoreRows(initialScores)}</div></section></div>`, cleanup);
  const board = overlay.querySelector('#memory-board'), start = overlay.querySelector('#memory-start'), message = overlay.querySelector('#memory-message'), scoreBoard = overlay.querySelector('#memory-scores');
  let level = 1, score = 0, pairs = 0, cards = [], open = [], locked = false, seconds = 0, timer, scores = initialScores, submitted = false;
  function update() { overlay.querySelector('#memory-level').textContent = level; overlay.querySelector('#memory-pairs').textContent = pairs; overlay.querySelector('#memory-time').textContent = `${seconds}s`; overlay.querySelector('#memory-score').textContent = score; }
  function render() { const setup = LEVELS[Math.min(level - 1, LEVELS.length - 1)]; board.style.setProperty('--memory-cols', setup.cols); board.innerHTML = cards.map((card, index) => `<button class="memory-card ${card.open ? 'open' : ''} ${card.matched ? 'matched' : ''}" data-card="${index}" ${card.matched ? 'disabled' : ''}><span class="memory-card-back">✦</span><img src="${card.image}" alt="${escapeHtml(card.name)}"><small>${escapeHtml(card.name)}</small></button>`).join(''); board.querySelectorAll('[data-card]').forEach(button => button.addEventListener('click', () => flip(Number(button.dataset.card)))); }
  function beginLevel() { const setup = LEVELS[Math.min(level - 1, LEVELS.length - 1)]; const chosen = shuffle(CARD_POOL).slice(0, setup.pairs); cards = shuffle(chosen.flatMap(card => [{ ...card }, { ...card }])); pairs = 0; open = []; locked = false; seconds = Math.max(14, 42 - level * 5); clearInterval(timer); timer = setInterval(() => { seconds--; update(); if (seconds <= 0) end(); }, 1000); message.textContent = `Level ${level}: find ${setup.pairs} pairs before time runs out.`; start.textContent = '↻ Restart Run'; render(); update(); }
  function flip(index) { if (locked || cards[index].open || cards[index].matched) return; cards[index].open = true; open.push(index); render(); if (open.length !== 2) return; locked = true; const [a, b] = open; if (cards[a].id === cards[b].id) { cards[a].matched = cards[b].matched = true; pairs++; score += 100 * level; open = []; locked = false; if (pairs === LEVELS[Math.min(level - 1, LEVELS.length - 1)].pairs) { clearInterval(timer); score += seconds * 10; level++; message.textContent = 'A perfect recall! The next board grows…'; update(); setTimeout(beginLevel, 850); } else { render(); update(); } } else setTimeout(() => { cards[a].open = cards[b].open = false; open = []; locked = false; render(); }, 700); }
  async function end() { clearInterval(timer); board.querySelectorAll('button').forEach(button => button.disabled = true); message.textContent = `The sands fall. You reached level ${level} with ${score} renown.`; start.textContent = '▶ Begin Recall'; if (!submitted && score > 0) { submitted = true; try { scores = await onScore({ score, level, pairs }); scoreBoard.innerHTML = scoreRows(scores); } catch {} } }
  function cleanup() { clearInterval(timer); }
  overlay.querySelector('#memory-close').onclick = () => { cleanup(); closeModal(); };
  start.onclick = () => { level = 1; score = 0; submitted = false; beginLevel(); };
  update();
}
