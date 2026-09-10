# 📜 The Tavern of Quests - Single character editon

## 🏰 Overview

**The Tavern of Quests** is a gamified, shared task management application designed with a rich, dark-fantasy D&D aesthetic. It transforms mundane daily chores and projects into "Quests," rewarding users with XP, level-ups, and streaks. Built as a client-server application, it is designed to be deployed via Docker, allowing multiple users across a network to collaborate on and view the same quest board in real-time.

---

## ⚔️ Core Features

## 🧙🧝 Multi-User System
- **Character Creation**: Create multiple adventurers with custom names and avatar emojis
- **Character Selection**: Switch between characters with a dedicated selection screen
- **Character Management**: Edit character names and avatars, or delete characters entirely
- **Data Isolation**: Each character maintains separate quest history, XP, and statistics

### 📋 Quest Management

- **Quest Types**: Tasks can be categorized as **Main Quests** (major goals) or **Side Quests** (minor tasks).
- **Priority System**: Quests are color-coded by urgency: 💀 Critical, 🔴 High, 🟡 Medium, and 🟢 Low.
- **XP Rewards**: Each quest is assigned an XP value (10, 25, 50, or 100) based on its difficulty.
- **Filtering & Sorting**: Quest boards can be filtered by category and automatically sort by priority and creation date.
- **Quest Templates**: Create templates for Quests such as "Morning Meditation" or "Weekly Review" that need the same settings each time
- **Quest Editing**: Modify quest details after creation
- **Quest Deletion**: Remove quests with confirmation

### 👑 Completion & Archive System
- **Quest Completion**: Mark quests as complete to earn XP and advance level
- **Archive Feature**: Move completed quests to archive for long-term storage
- **Quest Restoration**: Restore archived quests back to completed status
- **Permanent Deletion**: Permanently delete archived quests
- **Batch Operations**: Clear all completed quests or clear entire archive

### 🎮 Gamification & Progression

- **Leveling System**: Users earn XP to level up, complete with a visual XP progress bar and a dramatic "Level Up!" overlay animation.
- **Daily Streaks**: Tracks consecutive days of completing at least one quest, encouraging daily productivity.
- **Visual Feedback**: Toast notifications, particle effects, and smooth animations provide satisfying feedback for every action.

### 🏷️ Custom Categories & Emoji Library

- **Built-in Categories**: Starts with "Household" and "Technology".
- **Custom Categories**: Users can create unlimited custom categories (e.g., "Garden", "Pets", "Work").
- **Emoji Picker**: A built-in, scrollable library of 300+ Unicode emojis, organized by theme (Fantasy, Home, Tech, Nature, Animals, etc.), allowing users to assign unique icons to their custom categories.
- **Safe Deletion**: If a category is deleted while in use, the system prompts the user to reassign affected quests to a new category before proceeding.

---

## 🏗️ Technical Architecture

### 🖥️ Frontend

- **Pure Vanilla Stack**: Built with HTML5, CSS3, and modern JavaScript (ES6+). No frontend frameworks, ensuring fast load times and easy maintenance.
- **Thematic UI**: Custom CSS featuring a dark wood and parchment color palette, glowing gold accents, and fantasy fonts (Cinzel, IM Fell English).
- **Optimistic UI & Error Handling**: The UI updates instantly when actions are taken, with automatic rollbacks and error toasts if the server fails to save.

### 🗄️ Backend

- **Node.js & Express**: A lightweight REST API handling state retrieval (`GET /api/state`) and updates (`PUT /api/state`).
- **Atomic File Storage**: Data is stored in a `data.json` file. The server uses a dedicated `/app/data` directory to ensure safe, persistent writes.
- **Health Checks**: Includes a `/api/health` endpoint to verify server status and directory write permissions.

### 🐳 Docker & Deployment

- **Containerized**: Fully containerized using a multi-stage `Dockerfile` based on `node:18-alpine` for a minimal footprint.
- **Persistent Storage**: Uses a Docker named volume (`tavern_data`) mapped to `/app/data`, ensuring all quests, XP, and custom categories survive container rebuilds and restarts.
- **Multi-User Sync**: The frontend polls the server every 30 seconds to automatically pull in changes made by other users on the network.

---

## 📖 The Tavern Keeper's Grimoire (Admin Panel)

The admin panel provides deep control over the realm's data and settings:

- **Server Status**: Real-time connection indicator (Online/Syncing/Offline) with detailed error logging.
- **Connection Tools**: Buttons to manually refresh data from the server or test the server's health/write permissions.
- **Category Management**: Full CRUD interface for custom categories.
- **Stat Resets**: Options to manually reset the daily streak or wipe XP/Level back to 1.
- **Backup & Restore**: Export the entire realm state to a JSON file, or import a previous JSON backup.
- **Danger Zone**: A "Wipe Character Data" function that requires typing "RESET" to confirm, permanently deleting all progress for the active character.

---

## 🚀 Deployment Quick-Start

# Configuration
**Environment Variables**
PORT: Server port (default: 3000)
NODE_ENV: Environment mode (default: production)

**Application Constants**
Located in public/js/config.js:
XP_PER_LEVEL: 100 XP required per level
COMPLETED_PER_PAGE: 12 quests per page
Priority order and labels
Built-in categories

**Browser Compatibility**
Modern browsers with ES6 module support
Chrome/Edge 61+
Firefox 60+
Safari 11+

# Build and start the container in the background

docker-compose up -d --build

# View live logs

docker-compose logs -f tavern

# Access the tavern

# Open http://localhost:3000 (or your server's IP) in any browser

## docker-compose
```yaml
services:
  tavern:
    build: .
    container_name: tavern-of-quests
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - tavern_data:/app/data
    environment:
      - PORT=3000
      - NODE_ENV=production

volumes:
  tavern_data:
    driver: local
restart: unless-stopped
```

_Note: Data is safely stored in the `tavern_data` Docker volume. To completely wipe the data, one must explicitly use `docker-compose down -v`._

**Layout**
```yaml
tavern-of-quests/
│
├── 📄 server.js                          # Express server and API endpoints
├── 📄 package.json                       # Node.js dependencies and scripts
├── 📄 Dockerfile                         # Docker container configuration
├── 📄 docker-compose.yml                 # Docker Compose orchestration
├── 📄 .dockerignore                      # Docker build exclusions
├── 📄 .gitignore                         # Git repository exclusions
│
├── 📁 data/                              # Persistent data storage (auto-created)
│   └── 📄 users.json                     # User data and quest state
│
└── 📁 public/                            # Frontend application
    │
    ├── 📄 index.html                     # Main HTML structure
    │
    ├── 📁 css/
    │   └── 📄 styles.css                 # Complete stylesheet
    │
    └── 📁 js/
        │
        ├── 📄 app.js                     # Main application controller
        ├── 📄 config.js                  # Configuration constants
        │
        ├── 📁 utils/
        │   ├── 📄 helpers.js             # Utility functions (escapeHtml, showToast, etc.)
        │   ├── 📄 emojiLibrary.js        # Emoji picker data
        │   └── 📄 categoryUtils.js       # Category management utilities
        │
        ├── 📁 services/
        │   └── 📄 api.js                 # API service layer
        │
        └── 📁 components/
            ├── 📄 Modal.js               # Modal dialog system
            ├── 📄 CharacterSelect.js     # Character selection screen
            ├── 📄 CreateCharacter.js     # Character creation modal
            ├── 📄 EditCharacter.js       # Character editing modal
            ├── 📄 EmojiPicker.js         # Emoji selection component
            ├── 📄 QuestCard.js           # Individual quest card renderer
            ├── 📄 QuestBoard.js          # Quest board with filtering
            ├── 📄 CompletedQuests.js     # Completed quests display
            ├── 📄 AdminPanel.js          # Admin settings panel
            └── 📄 TemplateManager.js     # Quest template management
```

**Credits**
Fonts: Google Fonts (MedievalSharp, Cinzel, IM Fell English)
Icons: Unicode Emoji
Background Image: Unsplash
Framework: Node.js, Express.js