const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function loadUsers() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    console.error('Error loading users:', err);
    return {};
  }
}

async function saveUsers(users) {
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
  return true;
}

app.get('/api/users', async (req, res) => {
  const users = await loadUsers();
  const userList = Object.entries(users).map(([id, data]) => ({
    id,
    name: data.name,
    avatar: data.avatar,
    level: data.state?.level || 1,
    questCount: (data.state?.quests?.length || 0) + (data.state?.completed?.length || 0)
  }));
  res.json({ success: true, users: userList });
});

app.post('/api/users', async (req, res) => {
  const { name, avatar } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  const users = await loadUsers();
  const userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  users[userId] = {
    name: name.trim(),
    avatar: avatar || '\u{1F9D1}',
    state: {
      quests: [],
      completed: [],
      archived: [],
      xp: 0,
      level: 1,
      streak: 0,
      lastCompletedDate: null,
      filters: { main: 'all', side: 'all' },
      customCategories: []
    }
  };
  await saveUsers(users);
  res.json({ success: true, user: { id: userId, name: name.trim(), avatar: avatar || '\u{1F9D1}' } });
});

app.get('/api/state', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
  const users = await loadUsers();
  if (!users[userId]) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, data: users[userId].state });
});

app.put('/api/state', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
  const users = await loadUsers();
  if (!users[userId]) return res.status(404).json({ success: false, error: 'User not found' });
  users[userId].state = req.body;
  await saveUsers(users);
  res.json({ success: true });
});

app.put('/api/users/:userId', async (req, res) => {
  const userId = req.params.userId;
  const { name, avatar } = req.body;
  const users = await loadUsers();
  if (!users[userId]) return res.status(404).json({ success: false, error: 'User not found' });
  if (name !== undefined) users[userId].name = name.trim();
  if (avatar !== undefined) users[userId].avatar = avatar;
  await saveUsers(users);
  res.json({ success: true });
});

app.delete('/api/users/:userId', async (req, res) => {
  const userId = req.params.userId;
  const users = await loadUsers();
  if (!users[userId]) return res.status(404).json({ success: false, error: 'User not found' });
  delete users[userId];
  await saveUsers(users);
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureDataDir().then(() => {
  app.listen(PORT, () => {
    console.log(`The Tavern of Quests is open on port ${PORT}`);
  });
});