import { createModal, closeModal } from './Modal.js';

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

export function openTavernBlocks() {
  const overlay = createModal(`
    <div class="blocks-modal">
      <div class="blocks-heading"><div><p class="blocks-kicker">THE TAVERN GAME TABLE</p><h2 class="modal-title">✦ Runefall Revel ✦</h2></div><button class="modal-close" id="blocks-close" aria-label="Close game">×</button></div>
      <p class="blocks-intro">Stack enchanted runes, clear a full row, and keep the hearth from overflowing.</p>
      <div class="blocks-layout">
        <aside class="blocks-side blocks-next-panel"><span class="blocks-label">Next Rune</span><canvas id="blocks-next" width="120" height="120" aria-label="Next rune"></canvas><div class="blocks-tip">Every 10 lines, the tavern grows rowdier.</div></aside>
        <div class="blocks-board-wrap"><canvas id="blocks-board" width="300" height="600" aria-label="Runefall game board"></canvas><div class="blocks-overlay" id="blocks-overlay"><span>Press Start</span><small>Begin the revel</small></div></div>
        <aside class="blocks-side blocks-score-panel"><div class="blocks-stat"><span>Score</span><strong id="blocks-score">000000</strong></div><div class="blocks-stat"><span>Lines Cleared</span><strong id="blocks-lines">0</strong></div><div class="blocks-stat"><span>Revel Level</span><strong id="blocks-level">1</strong></div><button class="blocks-start" id="blocks-start">▶ Start Revel</button></aside>
      </div>
      <div class="blocks-controls" aria-label="Game controls"><button data-action="left" aria-label="Move left">◀</button><button data-action="rotate" class="blocks-rotate" aria-label="Rotate rune">↻</button><button data-action="right" aria-label="Move right">▶</button><button data-action="down" aria-label="Move down">▼</button></div>
      <p class="blocks-keyboard"><kbd>←</kbd><kbd>→</kbd> move &nbsp; <kbd>↑</kbd> turn &nbsp; <kbd>↓</kbd> descend &nbsp; <kbd>Space</kbd> drop &nbsp; <kbd>P</kbd> pause</p>
    </div>`, cleanup);

  const ctx = overlay.querySelector('#blocks-board').getContext('2d');
  const nextCtx = overlay.querySelector('#blocks-next').getContext('2d');
  const overlayEl = overlay.querySelector('#blocks-overlay');
  const startButton = overlay.querySelector('#blocks-start');
  let board, piece, next, score, lines, level, timer, playing = false, paused = false;

  function randomPiece() { const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]; return { ...shape, cells: shape.cells.map(row => [...row]), x: 0, y: 0 }; }
  function collides(test) { return test.cells.some((row, y) => row.some((cell, x) => cell && (test.x + x < 0 || test.x + x >= COLS || test.y + y >= ROWS || (test.y + y >= 0 && board[test.y + y][test.x + x])))); }
  function updateStats() { overlay.querySelector('#blocks-score').textContent = String(score).padStart(6, '0'); overlay.querySelector('#blocks-lines').textContent = lines; overlay.querySelector('#blocks-level').textContent = level; }
  function spawn() { piece = next; next = randomPiece(); piece.x = Math.floor((COLS - piece.cells[0].length) / 2); piece.y = 0; if (collides(piece)) gameOver(); drawNext(); }
  function freshGame() { board = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); score = 0; lines = 0; level = 1; next = randomPiece(); piece = null; updateStats(); spawn(); draw(); }
  function move(dx, dy) { if (!playing || paused) return false; piece.x += dx; piece.y += dy; if (collides(piece)) { piece.x -= dx; piece.y -= dy; return false; } draw(); return true; }
  function rotate() { if (!playing || paused) return; const old = piece.cells; piece.cells = old[0].map((_, i) => old.map(row => row[i]).reverse()); if (collides(piece)) { piece.x += piece.x > COLS / 2 ? -1 : 1; if (collides(piece)) { piece.x += piece.x > COLS / 2 ? 1 : -1; piece.cells = old; } } draw(); }
  function lock() { if (!playing || paused) return; piece.cells.forEach((row, y) => row.forEach((cell, x) => { if (cell && piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.color; })); let cleared = 0; board = board.filter(row => { if (row.every(Boolean)) { cleared++; return false; } return true; }); while (board.length < ROWS) board.unshift(Array(COLS).fill(null)); if (cleared) { lines += cleared; score += [0, 100, 300, 500, 800][cleared] * level; level = Math.floor(lines / 10) + 1; updateStats(); resetTimer(); } spawn(); draw(); }
  function drop() { while (move(0, 1)); lock(); }
  function tick() { if (!move(0, 1)) lock(); }
  function drawCell(context, x, y, color, size = 30) { context.fillStyle = color; context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2); context.fillStyle = 'rgba(255,255,255,.25)'; context.fillRect(x * size + 4, y * size + 4, size - 8, 3); context.strokeStyle = 'rgba(28,14,10,.7)'; context.strokeRect(x * size + 1.5, y * size + 1.5, size - 3, size - 3); }
  function draw() { ctx.fillStyle = '#130b08'; ctx.fillRect(0, 0, 300, 600); ctx.strokeStyle = 'rgba(232,185,73,.10)'; for (let i = 0; i <= COLS; i++) { ctx.beginPath(); ctx.moveTo(i * 30, 0); ctx.lineTo(i * 30, 600); ctx.stroke(); } for (let i = 0; i <= ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i * 30); ctx.lineTo(300, i * 30); ctx.stroke(); } board.forEach((row, y) => row.forEach((color, x) => color && drawCell(ctx, x, y, color))); if (piece) piece.cells.forEach((row, y) => row.forEach((cell, x) => cell && drawCell(ctx, piece.x + x, piece.y + y, piece.color))); }
  function drawNext() { nextCtx.clearRect(0, 0, 120, 120); const size = 24; const width = next.cells[0].length * size, height = next.cells.length * size; next.cells.forEach((row, y) => row.forEach((cell, x) => { if (!cell) return; const px = (120 - width) / 2 + x * size, py = (120 - height) / 2 + y * size; nextCtx.fillStyle = next.color; nextCtx.fillRect(px + 1, py + 1, size - 2, size - 2); nextCtx.fillStyle = 'rgba(255,255,255,.25)'; nextCtx.fillRect(px + 4, py + 4, size - 8, 3); })); }
  function resetTimer() { clearInterval(timer); if (playing && !paused) timer = setInterval(tick, Math.max(120, 720 - (level - 1) * 60)); }
  function begin() { freshGame(); playing = true; paused = false; overlayEl.classList.add('hidden'); startButton.textContent = 'Ⅱ Pause'; resetTimer(); }
  function gameOver() { playing = false; clearInterval(timer); overlayEl.innerHTML = `<span>Hearth Overflow!</span><small>${score.toLocaleString()} renown earned</small>`; overlayEl.classList.remove('hidden'); startButton.textContent = '↻ Revel Again'; }
  function togglePause() { if (!playing) return; paused = !paused; startButton.textContent = paused ? '▶ Resume Revel' : 'Ⅱ Pause'; overlayEl.innerHTML = '<span>Revel Paused</span><small>Take a sip, adventurer</small>'; overlayEl.classList.toggle('hidden', !paused); if (paused) clearInterval(timer); else resetTimer(); }
  function keydown(e) { if (!overlay.isConnected) return; if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) e.preventDefault(); if (e.key === 'ArrowLeft') move(-1, 0); if (e.key === 'ArrowRight') move(1, 0); if (e.key === 'ArrowDown' && !move(0, 1)) lock(); if (e.key === 'ArrowUp') rotate(); if (e.key === ' ') drop(); if (e.key.toLowerCase() === 'p') togglePause(); }
  function cleanup() { clearInterval(timer); document.removeEventListener('keydown', keydown); }
  overlay.querySelector('#blocks-close').onclick = () => { cleanup(); closeModal(); };
  startButton.onclick = () => playing && !paused ? togglePause() : paused ? togglePause() : begin();
  overlay.querySelectorAll('[data-action]').forEach(button => button.onclick = () => ({ left: () => move(-1, 0), right: () => move(1, 0), down: () => { if (!move(0, 1)) lock(); }, rotate })[button.dataset.action]());
  document.addEventListener('keydown', keydown);
  freshGame();
}
