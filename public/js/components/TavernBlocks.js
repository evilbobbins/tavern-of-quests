import { createModal, closeModal } from './Modal.js';
import { escapeHtml } from '../utils/helpers.js';
import { avatarMarkup } from '../characters.js';

const SHAPES = [
  { color: '#e5533d', cells: [[1, 1, 1, 1]] },
  { color: '#49a6e9', cells: [[1, 1], [1, 1]] },
  { color: '#57b96d', cells: [[0, 1, 1], [1, 1, 0]] },
  { color: '#d95992', cells: [[1, 1, 0], [0, 1, 1]] },
  { color: '#e8b949', cells: [[1, 0, 0], [1, 1, 1]] },
  { color: '#5b78dc', cells: [[0, 0, 1], [1, 1, 1]] },
  { color: '#a96bd8', cells: [[0, 1, 0], [1, 1, 1]] }
];
const COLS = 10;
const ROWS = 20;

function formatScoreDate(achievedAt) {
  const date = new Date(achievedAt);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderScoreboard(scores) {
  const topScores = [...scores].sort((a, b) => b.score - a.score || new Date(a.achievedAt) - new Date(b.achievedAt)).slice(0, 3);
  if (!topScores.length) return '<div class="runefall-empty">No scores yet. Claim the first crown.</div>';
  return topScores.map((entry, index) => `<div class="runefall-score ${index === 0 ? 'champion' : ''}"><span class="runefall-place">${index === 0 ? '👑' : `#${index + 1}`}</span><span class="runefall-score-avatar">${avatarMarkup(entry.avatar || '⚔️', 'runefall-score-portrait')}</span><div><strong>${index === 0 ? 'Champion · ' : ''}${escapeHtml(entry.name)}</strong><small>${formatScoreDate(entry.achievedAt)}</small></div><b>${Number(entry.score).toLocaleString()}</b></div>`).join('');
}
function placementHonour(result) {
  const position = (result?.scores || []).findIndex(entry => entry.id === result?.entry?.id);
  if (position < 0 || position > 2) return '';
  const details = [{ icon: '👑', title: 'New Runefall Champion!', copy: 'The crown is yours!' }, { icon: '🥈', title: 'A Silver Revel!', copy: 'You have claimed second place!' }, { icon: '🥉', title: 'Top Three Revel!', copy: 'A place in the realm’s legends is yours!' }][position];
  return `<div class="game-score-honour place-${position + 1}"><span>${details.icon}</span><strong>${details.title}</strong><small>${details.copy}</small></div>`;
}

export function openTavernBlocks({ scores: initialScores = [], onScore = async () => initialScores } = {}) {
  const overlay = createModal(`
    <div class="blocks-modal">
      <div class="blocks-heading"><div><p class="blocks-kicker">THE TAVERN GAME TABLE</p><h2 class="modal-title">✦ Runefall Revel ✦</h2></div><button class="modal-close" id="blocks-close" aria-label="Close game">×</button></div>
      <p class="blocks-intro">Stack enchanted runes, clear a full row, and keep the hearth from overflowing.</p>
      <div class="blocks-layout">
        <aside class="blocks-side blocks-next-panel"><span class="blocks-label">Next Rune</span><canvas id="blocks-next" width="120" height="100" aria-label="Next rune"></canvas><span class="blocks-label">Held Rune</span><canvas id="blocks-hold" width="120" height="90" aria-label="Held rune"></canvas><div class="blocks-tip">Hold once per rune with <kbd>C</kbd>.</div></aside>
        <div class="blocks-board-wrap"><canvas id="blocks-board" width="300" height="600" aria-label="Runefall game board"></canvas><div class="blocks-clear-celebration" id="blocks-clear-celebration" aria-live="polite"></div><div class="blocks-overlay" id="blocks-overlay"><span>Press Start</span><small>Begin the revel</small></div></div>
        <aside class="blocks-side blocks-score-panel"><div class="blocks-stat"><span>Score</span><strong id="blocks-score">000000</strong></div><div class="blocks-stat"><span>Lines Cleared</span><strong id="blocks-lines">0</strong></div><div class="blocks-stat"><span>Revel Level</span><strong id="blocks-level">1</strong></div><button class="blocks-start" id="blocks-start">▶ Start Revel</button></aside>
      </div>
      <div class="blocks-controls" aria-label="Game controls"><button data-action="left" aria-label="Move left">◀</button><button data-action="rotate" class="blocks-rotate" aria-label="Rotate rune">↻</button><button data-action="right" aria-label="Move right">▶</button><button data-action="down" aria-label="Move down">▼</button><button data-action="hold" class="blocks-hold" aria-label="Hold rune">⇄</button></div>
      <p class="blocks-keyboard"><kbd>←</kbd><kbd>→</kbd> move &nbsp; <kbd>↑</kbd> turn &nbsp; <kbd>↓</kbd> descend &nbsp; <kbd>Space</kbd> drop &nbsp; <kbd>C</kbd> hold &nbsp; <kbd>P</kbd> pause</p>
      <section class="runefall-scoreboard"><div class="blocks-label">🏆 Runefall Revel — Top Three</div><div id="runefall-scores">${renderScoreboard(initialScores)}</div></section>
    </div>`, cleanup);

  const ctx = overlay.querySelector('#blocks-board').getContext('2d');
  const nextCtx = overlay.querySelector('#blocks-next').getContext('2d');
  const holdCtx = overlay.querySelector('#blocks-hold').getContext('2d');
  const overlayEl = overlay.querySelector('#blocks-overlay');
  const celebrationEl = overlay.querySelector('#blocks-clear-celebration');
  const startButton = overlay.querySelector('#blocks-start');
  const scoreboard = overlay.querySelector('#runefall-scores');
  let board, piece, next, held, canHold, score, lines, level, timer, celebrationTimer, playing = false, paused = false, submitted = false, scores = initialScores;

  function randomPiece() { const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]; return { ...shape, cells: shape.cells.map(row => [...row]), x: 0, y: 0 }; }
  function collides(test) { return test.cells.some((row, y) => row.some((cell, x) => cell && (test.x + x < 0 || test.x + x >= COLS || test.y + y >= ROWS || (test.y + y >= 0 && board[test.y + y][test.x + x])))); }
  function updateStats() { overlay.querySelector('#blocks-score').textContent = String(score).padStart(6, '0'); overlay.querySelector('#blocks-lines').textContent = lines; overlay.querySelector('#blocks-level').textContent = level; }
  function positionPiece(candidate) { piece = candidate; piece.x = Math.floor((COLS - piece.cells[0].length) / 2); piece.y = 0; return collides(piece); }
  function spawn() { const blocked = positionPiece(next); next = randomPiece(); canHold = true; if (blocked) gameOver(); drawNext(); }
  function freshGame() { board = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); score = 0; lines = 0; level = 1; submitted = false; held = null; canHold = true; next = randomPiece(); piece = null; updateStats(); spawn(); drawHold(); draw(); }
  function move(dx, dy) { if (!playing || paused) return false; piece.x += dx; piece.y += dy; if (collides(piece)) { piece.x -= dx; piece.y -= dy; return false; } draw(); return true; }
  function rotate() { if (!playing || paused) return; const old = piece.cells; piece.cells = old[0].map((_, i) => old.map(row => row[i]).reverse()); if (collides(piece)) { piece.x += piece.x > COLS / 2 ? -1 : 1; if (collides(piece)) { piece.x += piece.x > COLS / 2 ? 1 : -1; piece.cells = old; } } draw(); }
  function lock() { if (!playing || paused) return; piece.cells.forEach((row, y) => row.forEach((cell, x) => { if (cell && piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.color; })); let cleared = 0; board = board.filter(row => { if (row.every(Boolean)) { cleared++; return false; } return true; }); while (board.length < ROWS) board.unshift(Array(COLS).fill(null)); if (cleared) { lines += cleared; score += [0, 100, 300, 500, 800][cleared] * level; level = Math.floor(lines / 10) + 1; updateStats(); resetTimer(); if (cleared >= 2) celebrateClear(cleared); } spawn(); draw(); }
  function drop() { while (move(0, 1)); lock(); }
  function hold() {
    if (!playing || paused || !canHold) return;
    const outgoing = piece;
    canHold = false;
    if (held) {
      const incoming = held;
      held = outgoing;
      if (positionPiece(incoming)) gameOver();
    } else {
      held = outgoing;
      const blocked = positionPiece(next);
      next = randomPiece();
      if (blocked) gameOver();
      drawNext();
    }
    drawHold();
    draw();
  }
  function tick() { if (!move(0, 1)) lock(); }
  function drawCell(context, x, y, color, size = 30) { context.fillStyle = color; context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2); context.fillStyle = 'rgba(255,255,255,.25)'; context.fillRect(x * size + 4, y * size + 4, size - 8, 3); context.strokeStyle = 'rgba(28,14,10,.7)'; context.strokeRect(x * size + 1.5, y * size + 1.5, size - 3, size - 3); }
  function landingPiece() {
    if (!piece) return null;
    const ghost = { ...piece };
    while (!collides({ ...ghost, y: ghost.y + 1 })) ghost.y++;
    return ghost;
  }
  function drawGhostCell(x, y, color) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = color;
    ctx.fillRect(x * 30 + 4, y * 30 + 4, 22, 22);
    ctx.globalAlpha = 0.95;
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x * 30 + 4, y * 30 + 4, 22, 22);
    ctx.restore();
  }
  function draw() { ctx.fillStyle = '#130b08'; ctx.fillRect(0, 0, 300, 600); ctx.strokeStyle = 'rgba(232,185,73,.10)'; for (let i = 0; i <= COLS; i++) { ctx.beginPath(); ctx.moveTo(i * 30, 0); ctx.lineTo(i * 30, 600); ctx.stroke(); } for (let i = 0; i <= ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i * 30); ctx.lineTo(300, i * 30); ctx.stroke(); } board.forEach((row, y) => row.forEach((color, x) => color && drawCell(ctx, x, y, color))); const ghost = landingPiece(); if (ghost) ghost.cells.forEach((row, y) => row.forEach((cell, x) => cell && drawGhostCell(ghost.x + x, ghost.y + y, ghost.color))); if (piece) piece.cells.forEach((row, y) => row.forEach((cell, x) => cell && drawCell(ctx, piece.x + x, piece.y + y, piece.color))); }
  function drawPreview(context, rune, height) { context.clearRect(0, 0, 120, height); if (!rune) return; const size = 20; const width = rune.cells[0].length * size, runeHeight = rune.cells.length * size; rune.cells.forEach((row, y) => row.forEach((cell, x) => { if (!cell) return; const px = (120 - width) / 2 + x * size, py = (height - runeHeight) / 2 + y * size; context.fillStyle = rune.color; context.fillRect(px + 1, py + 1, size - 2, size - 2); context.fillStyle = 'rgba(255,255,255,.25)'; context.fillRect(px + 4, py + 4, size - 8, 3); })); }
  function drawNext() { drawPreview(nextCtx, next, 100); }
  function drawHold() { drawPreview(holdCtx, held, 90); }
  function celebrateClear(cleared) {
    const tier = Math.min(cleared, 4);
    const details = {
      2: { title: 'Double Clear!', sparks: 14 },
      3: { title: 'Triple Clear!', sparks: 24 },
      4: { title: 'Runefall!', sparks: 38 }
    }[tier];
    const sparks = Array.from({ length: details.sparks }, () => `<i style="--x:${Math.round(Math.random() * 100 - 50)}px;--y:${Math.round(Math.random() * 180 - 90)}px;--delay:${Math.round(Math.random() * 160)}ms"></i>`).join('');
    clearTimeout(celebrationTimer);
    celebrationEl.className = `blocks-clear-celebration tier-${tier}`;
    celebrationEl.setAttribute('aria-label', details.title);
    celebrationEl.innerHTML = `<div><strong>${details.title}</strong></div>${sparks}`;
    requestAnimationFrame(() => celebrationEl.classList.add('show'));
    celebrationTimer = setTimeout(() => { celebrationEl.className = 'blocks-clear-celebration'; celebrationEl.removeAttribute('aria-label'); celebrationEl.innerHTML = ''; }, tier === 4 ? 2900 : 2100);
  }
  function resetTimer() { clearInterval(timer); if (playing && !paused) timer = setInterval(tick, Math.max(120, 720 - (level - 1) * 60)); }
  function begin() { freshGame(); playing = true; paused = false; overlayEl.classList.add('hidden'); startButton.textContent = 'Ⅱ Pause'; resetTimer(); }
  async function submitScore() {
    if (submitted || score <= 0) return;
    submitted = true;
    try {
      const scoreResult = await onScore({ score, lines, level });
      scores = scoreResult?.scores || scoreResult;
      scoreboard.innerHTML = renderScoreboard(scores);
      overlayEl.querySelector('small').textContent = `${score.toLocaleString()} renown recorded in the shared ledger`;
      const honour = placementHonour(scoreResult);
      if (honour) overlayEl.querySelector('small').insertAdjacentHTML('afterend', honour);
    } catch (err) {
      overlayEl.querySelector('small').textContent = `${score.toLocaleString()} renown earned · score could not be recorded`;
    }
  }
  function gameOver() { playing = false; clearInterval(timer); overlayEl.innerHTML = `<span>Hearth Overflow!</span><small>${score.toLocaleString()} renown earned</small>`; overlayEl.classList.remove('hidden'); startButton.textContent = '↻ Revel Again'; submitScore(); }
  function togglePause() { if (!playing) return; paused = !paused; startButton.textContent = paused ? '▶ Resume Revel' : 'Ⅱ Pause'; overlayEl.innerHTML = '<span>Revel Paused</span><small>Take a sip, adventurer</small>'; overlayEl.classList.toggle('hidden', !paused); if (paused) clearInterval(timer); else resetTimer(); }
  function keydown(e) { if (!overlay.isConnected) return; if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) e.preventDefault(); if (e.key === 'ArrowLeft') move(-1, 0); if (e.key === 'ArrowRight') move(1, 0); if (e.key === 'ArrowDown' && !move(0, 1)) lock(); if (e.key === 'ArrowUp') rotate(); if (e.key === ' ') drop(); if (e.key.toLowerCase() === 'c') hold(); if (e.key.toLowerCase() === 'p') togglePause(); }
  function cleanup() { clearInterval(timer); clearTimeout(celebrationTimer); document.removeEventListener('keydown', keydown); }
  overlay.querySelector('#blocks-close').onclick = () => { cleanup(); closeModal(); };
  startButton.onclick = () => playing && !paused ? togglePause() : paused ? togglePause() : begin();
  overlay.querySelectorAll('[data-action]').forEach(button => button.onclick = () => ({ left: () => move(-1, 0), right: () => move(1, 0), down: () => { if (!move(0, 1)) lock(); }, rotate, hold })[button.dataset.action]());
  document.addEventListener('keydown', keydown);
  freshGame();
}
