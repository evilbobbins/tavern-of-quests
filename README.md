# 📜 The Tavern of Quests

## 🏰 Overview

**The Tavern of Quests** is a shared, dark-fantasy task board that turns everyday work into adventures. Gather a party of adventurers, post Main and Side Quests, earn XP, explore the Realm Map, and take a break at the Tavern Games table.

Built with a lightweight Node.js server and a persistent Docker volume, it is ideal for a household, family, flat, or small party sharing one questing realm on a local network.

---

## ⚔️ Features of the Realm

### 🧙🧝 Adventurers and progress

- Choose from twelve illustrated guild heroes spanning knight, spellweaver, scout, artificer, wizard, rogue, barbarian, bard, ranger, monk, fighter, and cleric.
- The guild’s newest heroes are **Kaela Stoneheart**, **Merrin Goldstrings**, **Talia Fernwatch**, **Sori Windstep**, **Rowan Vale**, and **Sister Elowen Brightmere**—each with a portrait, role, and Guild Tale.
- By default, a guild hero can belong to only one adventurer. Tavern Keepers can temporarily allow duplicates, but cannot restore the one-hero rule until any duplicates are resolved.
- Give each hero a separate **Player Tag**, so a party can tell who is playing whom.
- Update a guild identity at any time from **Active Guild Members**; legacy emoji adventurers can be welcomed into the illustrated guild.
- Join the Guild and Edit Adventurer screens share a spacious four-column desktop roster, with responsive two- and one-column layouts for smaller displays.
- Keep each adventurer’s quests, completed history, XP, level, and streak private to them.
- Open an adventurer’s chronicle directly from the top bar to review achievements, rank, portrait, Guild Tale, and any current Tavern Games crowns.
- Click a Chronicle portrait to admire the hero’s full artwork, or edit the adventurer directly from the Chronicle.

### 📋 Quest board

- Post **Main Quests** for grand objectives and **Side Quests** for smaller errands.
- Set priority, difficulty-based XP, descriptions, and due dates.
- Edit, complete, restore, archive, or permanently remove quests.
- Use compact location filters for both quest columns.
- Create reusable quest templates to post recurring adventures quickly.
- Keep completed quests paginated and archive older victories when the board gets busy.

### 🎒 Loot and relics

- Completing a quest can uncover a random treasure: the chance increases from **25%** for low-priority quests to **85%** for critical quests.
- Loot quality scales with quest difficulty across four tiers: **Common**, **Uncommon**, **Rare**, and **Legendary**.
- Every location has its own themed treasures—from Royal Seals in the Castle to Dragon Scales in the Dragon’s Den and Bog Charms in the Bog of Eternal Stench.
- Each Adventurer owns a private Satchel; a treasure found by one party member never appears in another member’s collection.
- Nine wandering relics—including the Tavern Token, Wayfarer’s Lantern, Fatebound Die, Phoenix Feather, Whispering Locket, Runed Hearthstone, and Starlit Chalice—may be discovered anywhere in the realm.
- An Adventurer cannot hold duplicate named treasures. Empty their Satchel from the Chronicle to begin collecting that adventurer’s relics anew.
- Every one of the eighteen relics has a hand-painted inventory portrait and an in-world lore entry. Select an item in the Satchel to inspect its full artwork, rarity, source, and story.
- Loot discoveries are saved with the adventurer and travel safely through individual exports, full-realm backups, and imports.

### 🗺️ One shared realm

- Explore the **Realm Map** to see active quests grouped by location.
- The realm begins with **The Castle**, **The Wizard’s Lair**, **Mooncrest Academy**, **Dragon's Den**, and the **Bog of Eternal Stench**.
- Locations and quest templates belong to the realm—not one adventurer—so everyone sees the same shared options. Location creation is currently curated to keep the Realm Map consistent.
- The **Realm Chronicle** offers a high-level view of the party’s activity and progress, including illustrated **Runefall** and **Relic Recall** champions plus portrait-led adventurer roster entries.

### 🗄️ Backup Vault

- Automatic server snapshots protect the whole realm on a configurable schedule.
- Create a manual backup before a big change.
- Browse backups in the Tavern Keeper and restore a selected snapshot.
- Restoring creates a safety backup of the current realm first, so the previous state is not lost.
- Export or import a complete realm snapshot for an offline copy or a move between Taverns.
- Clearly separated current-adventurer import and export tools keep individual progress backups distinct from the whole realm.

### 🎲 Tavern Games: Runefall Revel and Relic Recall

- A playable tavern-themed block-stacking mini-game built into the status bar.
- Stack enchanted runes, clear rows, gain score, and survive ever-faster revel levels.
- Chain two, three, or four rows at once for escalating in-board celebration effects.
- Includes next-rune and held-rune previews, a one-use-per-rune hold swap, pause/restart, keyboard controls, and touch-friendly buttons for smaller screens.
- Completed games with a score are recorded in a shared realm leaderboard with the adventurer, score, and date achieved.
- The game table displays the top three scores; first place earns the title **Runefall Champion**.
- Open it with **🎲 Tavern Games** without leaving the quest board.
- **Relic Recall** is a timed card-matching game using illustrated guild heroes and realm relics. Start with a 2×2 board, clear pairs before the sands run out, and advance into larger boards.
- Both games keep independent shared top-three leaderboards with scores and dates achieved.
- First place is the current game champion; an adventurer holding both crowns earns the special **Tavern Games Champion** honour.
- Champions are celebrated in their Adventurer’s Chronicle and on their **Active Guild Members** roster card.
- Tavern Keepers can reset either shared game scoreboard through confirmation-gated controls.

### 👑 Tavern Keeper tools

- Manage shared quest templates.
- Open the activity chronicle and the Backup Vault.
- Use **Active Guild Members** to switch adventurers, welcome a new guild member, or update a hero’s player tag and identity.
- Reset the shared Runefall Revel or Relic Recall score ledger through confirmation-gated scoreboard controls.
- Refresh the current realm from the server and inspect connection status.
- Reset a character’s streak or progress when appropriate, with guarded destructive actions.

---

## 🏗️ Technical architecture

- **Frontend:** Vanilla HTML, CSS, and modern JavaScript modules—no framework required.
- **Theme:** Dark wood, parchment, glowing gold accents, and fantasy typography (Cinzel, MedievalSharp, and IM Fell English).
- **Backend:** Node.js with Express and a small REST API for adventurers, their state, the shared realm, health checks, and backups.
- **Guild roster:** Illustrated character assets and a small shared roster module keep character identity, role, tale, and portrait consistent across the Tavern.
- **Persistence:** Atomic JSON writes under `/app/data`, stored in a Docker named volume.
- **Conflict protection:** Revision checks avoid silently overwriting another adventurer’s shared locations or templates.
- **Relic catalog:** Eighteen illustrated loot assets and a shared lore catalog provide location-themed treasures, item inspection, and per-adventurer collecting.
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
│   ├── images/
│   │   ├── faded-realm-map.png        # Realm Map artwork
│   │   ├── characters/                # Twelve illustrated guild hero portraits
│   │   └── loot/                      # Eighteen illustrated relic portraits
│   └── js/
│       ├── app.js                     # Application controller
│       ├── config.js                  # Quest and location defaults
│       ├── characters.js              # Guild identities, tales, and portraits
│       ├── services/api.js            # REST API client
│       ├── utils/
│       │   ├── loot.js                # Loot drops, rarity, and reveal logic
│       │   └── lootCatalog.js         # Relic artwork and lore catalog
│       └── components/
│           ├── AdminPanel.js          # Tavern Keeper menu
│           ├── BackupManager.js       # Backup Vault
│           ├── RealmMap.js            # Interactive Realm Map
│           ├── RealmDashboard.js      # Realm Chronicle
│           ├── AdventurerProfile.js   # Adventurer achievements and Satchel
│           ├── ActivityLog.js         # Recent realm activity
│           ├── TemplateManager.js     # Shared quest templates
│           ├── CharacterSelect.js     # Active Guild Members screen
│           ├── CreateCharacter.js     # Join the Guild flow
│           ├── EditCharacter.js       # Player tag and guild identity editor
│           ├── TavernBlocks.js        # Runefall Revel mini-game
│           ├── MemoryMatch.js         # Relic Recall matching game
│           └── TavernGames.js         # Tavern Games chooser
└── data/                             # Created inside the persistent Docker volume
```

---

## ✨ Credits

- Fonts: Google Fonts — MedievalSharp, Cinzel, Cinzel Decorative, and IM Fell English
- Icons: Unicode emoji
- Tavern header artwork: Unsplash
- Runtime: Node.js and Express
