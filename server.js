const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');
let writeQueue = Promise.resolve();

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

async function ensureDataDir() { await fs.mkdir(DATA_DIR, { recursive: true }); }
async function loadUsers() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const users = JSON.parse(data);
    return users && typeof users === 'object' && !Array.isArray(users) ? users : {};
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    console.error('Error loading users:', err);
    throw new Error('Unable to read tavern data');
  }
}
async function saveUsers(users) {
  const temporaryFile = `${DATA_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(users, null, 2), 'utf8');
  await fs.rename(temporaryFile, DATA_FILE);
}
function withUserMutation(mutator) {
  const operation = writeQueue.then(async () => mutator(await loadUsers()));
  writeQueue = operation.catch(() => undefined);
  return operation;
}
function validText(value, maxLength) { return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength; }
function validQuest(quest) {
  return quest && typeof quest === 'object' && validText(quest.id, 80) && validText(quest.name, 100)
    && ['main', 'side'].includes(quest.type) && ['critical', 'high', 'medium', 'low'].includes(quest.priority)
    && Number.isFinite(quest.xp) && [10, 25, 50, 100].includes(quest.xp)
    && (!quest.description || (typeof quest.description === 'string' && quest.description.length <= 200));
}
function validState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return 'State must be an object.';
  for (const key of ['quests', 'completed', 'archived']) {
    if (!Array.isArray(state[key]) || state[key].length > 1000 || !state[key].every(validQuest)) return `Invalid ${key} collection.`;
  }
  if (state.templates !== undefined && (!Array.isArray(state.templates) || state.templates.length > 250)) return 'Invalid templates collection.';
  if (state.customCategories !== undefined && (!Array.isArray(state.customCategories) || state.customCategories.length > 100)) return 'Invalid categories collection.';
  if (state.activity !== undefined && (!Array.isArray(state.activity) || state.activity.length > 100)) return 'Invalid activity collection.';
  if (!Number.isFinite(state.xp) || state.xp < 0 || state.xp > 10000000) return 'Invalid XP value.';
  if (!Number.isFinite(state.level) || state.level < 1 || state.level > 100001) return 'Invalid level value.';
  return null;
}
function defaultState() {
  return { quests: [], completed: [], archived: [], templates: [], activity: [], xp: 0, level: 1, streak: 0,
    lastCompletedDate: null, filters: { main: 'all', side: 'all' }, customCategories: [] };
}

app.get('/api/health', async (req, res) => {
  try { await ensureDataDir(); await fs.access(DATA_DIR, fs.constants.W_OK); res.json({ success: true, status: 'healthy' }); }
  catch { res.status(503).json({ success: false, error: 'Data directory is not writable' }); }
});
app.get('/api/users', async (req, res, next) => {
  try {
    const users = await loadUsers();
    res.json({ success: true, users: Object.entries(users).map(([id, data]) => ({
      id, name: data.name, avatar: data.avatar, level: data.state?.level || 1,
      questCount: (data.state?.quests?.length || 0) + (data.state?.completed?.length || 0)
    })) });
  } catch (err) { next(err); }
});
app.post('/api/users', async (req, res, next) => {
  const { name, avatar } = req.body || {};
  if (!validText(name, 50) || (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > 16))) {
    return res.status(400).json({ success: false, error: 'A character name (up to 50 characters) and a valid avatar are required.' });
  }
  try {
    const user = await withUserMutation(async users => {
      const id = `user_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
      users[id] = { name: name.trim(), avatar: avatar || '🧑', revision: 0, state: defaultState() };
      await saveUsers(users); return { id, name: users[id].name, avatar: users[id].avatar };
    });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});
app.get('/api/state', async (req, res, next) => {
  try {
    if (!req.query.userId) return res.status(400).json({ success: false, error: 'User ID required' });
    const user = (await loadUsers())[req.query.userId];
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: { ...user.state, _revision: user.revision || 0 } });
  } catch (err) { next(err); }
});
app.put('/api/state', async (req, res, next) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
  const { _revision, ...state } = req.body || {};
  const validationError = validState(state);
  if (validationError) return res.status(400).json({ success: false, error: validationError });
  if (!Number.isInteger(_revision) || _revision < 0) return res.status(400).json({ success: false, error: 'A state revision is required.' });
  try {
    const result = await withUserMutation(async users => {
      const user = users[userId];
      if (!user) return { status: 404, body: { success: false, error: 'User not found' } };
      const currentRevision = user.revision || 0;
      if (_revision !== currentRevision) return { status: 409, body: { success: false, conflict: true, error: 'This character changed in another session. Reload the latest state.' } };
      user.state = state; user.revision = currentRevision + 1; await saveUsers(users);
      return { status: 200, body: { success: true, revision: user.revision } };
    });
    res.status(result.status).json(result.body);
  } catch (err) { next(err); }
});
app.put('/api/users/:userId', async (req, res, next) => {
  const { name, avatar } = req.body || {};
  if ((name !== undefined && !validText(name, 50)) || (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > 16))) return res.status(400).json({ success: false, error: 'Invalid character details.' });
  try {
    const result = await withUserMutation(async users => {
      if (!users[req.params.userId]) return false;
      if (name !== undefined) users[req.params.userId].name = name.trim();
      if (avatar !== undefined) users[req.params.userId].avatar = avatar;
      await saveUsers(users); return true;
    });
    if (!result) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});
app.delete('/api/users/:userId', async (req, res, next) => {
  try {
    const result = await withUserMutation(async users => {
      if (!users[req.params.userId]) return false;
      delete users[req.params.userId]; await saveUsers(users); return true;
    });
    if (!result) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});
app.use((err, req, res, next) => { console.error('Request failed:', err); res.status(500).json({ success: false, error: 'The tavern server could not complete that request.' }); });
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
ensureDataDir().then(() => app.listen(PORT, () => console.log(`The Tavern of Quests is open on port ${PORT}`)));
