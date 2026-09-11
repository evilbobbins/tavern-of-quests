# 📜 The Tavern of Quests

## 🏰 Overview

**The Tavern of Quests** is a shared, dark-fantasy task board that turns everyday work into adventures. Gather a party of adventurers, post Main and Side Quests, earn XP, explore the Realm Map, and take a break at the Tavern Games table.

Built with a lightweight Node.js server and a persistent Docker volume, it is ideal for a household, family, flat, or small party sharing one questing realm on a local network.

---

## ⚔️ Features of the Realm

### 🧙🧝 Adventurers and progress

- Create, rename, edit, and retire adventurers with custom emoji avatars.
- Keep each adventurer’s quests, completed history, XP, level, and streak private to them.
- Open an adventurer’s chronicle directly from the top bar to review achievements and progress.
- Browse the roster when it is time to change adventurers.

### 📋 Quest board

- Post **Main Quests** for grand objectives and **Side Quests** for smaller errands.
- Set priority, difficulty-based XP, descriptions, and due dates.
- Edit, complete, restore, archive, or permanently remove quests.
- Use compact location filters for both quest columns.
- Create reusable quest templates to post recurring adventures quickly.
- Keep completed quests paginated and archive older victories when the board gets busy.

### 🗺️ One shared realm

- Explore the **Realm Map** to see active quests grouped by location.
- Start with **The Castle**, **The Wizard’s Lair**, and **Mooncrest Academy**, then add more locations through the Tavern Keeper.
- Locations and quest templates belong to the realm—not one adventurer—so everyone sees the same shared options.
- The **Realm Chronicle** offers a high-level view of the party’s activity and progress, including the current **Runefall Champion**.

### 🗄️ Backup Vault

- Automatic server snapshots protect the whole realm on a configurable schedule.
- Create a manual backup before a big change.
- Browse backups in the Tavern Keeper and restore a selected snapshot.
- Restoring creates a safety backup of the current realm first, so the previous state is not lost.

### 🎲 Tavern Games: Runefall Revel

- A playable tavern-themed block-stacking mini-game built into the status bar.
- Stack enchanted runes, clear rows, gain score, and survive ever-faster revel levels.
- Includes next-rune preview, pause/restart, keyboard controls, and touch-friendly buttons for smaller screens.
- Completed games with a score are recorded in a shared realm leaderboard with the adventurer, score, and date achieved.
- The game table displays the top three scores; first place earns the title **Runefall Champion**.
- Open it with **🎲 Tavern Games** without leaving the quest board.

### 👑 Tavern Keeper tools

- Manage shared locations and shared quest templates.
- Open the activity chronicle, backup vault, and character tools.
- Reset the shared Runefall score ledger through a confirmation-gated scoreboard control.
- Refresh the current realm from the server and inspect connection status.
- Reset a character’s streak or progress when appropriate, with guarded destructive actions.

---

## 🏗️ Technical architecture

- **Frontend:** Vanilla HTML, CSS, and modern JavaScript modules—no framework required.
- **Theme:** Dark wood, parchment, glowing gold accents, and fantasy typography (Cinzel, MedievalSharp, and IM Fell English).
- **Backend:** Node.js with Express and a small REST API for adventurers, their state, the shared realm, health checks, and backups.
- **Persistence:** Atomic JSON writes under `/app/data`, stored in a Docker named volume.
- **Conflict protection:** Revision checks avoid silently overwriting another adventurer’s shared locations or templates.
- **Health check:** `GET /api/health` confirms that the Tavern server and persistent storage are ready.

---

## 🚀 Raise the Tavern with Docker

### Docker Compose (recommended)

```bash
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000), or replace `localhost` with the server’s IP address for other adventurers on your network.

Useful commands:

```bash
# Follow the tavern logs
docker compose logs -f tavern-of-quests

# Stop the container while retaining all realm data
docker compose down

# Rebuild after pulling new project changes
docker compose up -d --build
```

### Docker Hub image

The published image is available at [`evilbobbins/tavern-of-quests`](https://hub.docker.com/r/evilbobbins/tavern-of-quests):

```bash
docker pull evilbobbins/tavern-of-quests:latest
docker run -d --name tavern-of-quests -p 3000:3000 -v tavern-data:/app/data evilbobbins/tavern-of-quests:latest
```

The release image is published for `linux/amd64`.

### Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Tavern server port |
| `NODE_ENV` | `production` | Node environment |
| `BACKUP_INTERVAL_HOURS` | `24` | Time between automatic realm backups |
| `BACKUP_RETENTION` | `14` | Number of automatic snapshots retained |

### Included Compose file

```yaml
services:
  tavern-of-quests:
    build: .
    container_name: tavern-of-quests
    ports:
      - "3000:3000"
    volumes:
      - tavern-data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped

volumes:
  tavern-data:
    driver: local
```

> Realm data lives in the `tavern-data` Docker volume. `docker compose down` keeps it safe; `docker compose down -v` permanently removes it.

---

## 🧭 Project layout

```text
tavern-of-quests/
├── server.js                         # Express API, shared realm, and backups
├── Dockerfile                        # Container image definition
├── docker-compose.yml                # Local deployment setup
├── public/
│   ├── index.html                    # Tavern interface
│   ├── css/styles.css                # Fantasy theme and responsive styles
│   ├── images/faded-realm-map.png    # Realm Map artwork
│   └── js/
│       ├── app.js                    # Application controller
│       ├── config.js                 # Quest and location defaults
│       ├── services/api.js           # REST API client
│       └── components/
│           ├── AdminPanel.js         # Tavern Keeper menu
│           ├── BackupManager.js      # Backup Vault
│           ├── RealmMap.js           # Interactive Realm Map
│           ├── RealmDashboard.js     # Realm Chronicle
│           ├── AdventurerProfile.js  # Adventurer achievements
│           ├── ActivityLog.js        # Recent realm activity
│           ├── TemplateManager.js    # Shared quest templates
│           └── TavernBlocks.js       # Runefall Revel mini-game
└── data/                             # Created inside the persistent Docker volume
```

---

## ✨ Credits

- Fonts: Google Fonts — MedievalSharp, Cinzel, Cinzel Decorative, and IM Fell English
- Icons: Unicode emoji
- Tavern header artwork: Unsplash
- Runtime: Node.js and Express
