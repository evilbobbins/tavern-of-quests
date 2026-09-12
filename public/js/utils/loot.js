import { getCategoryById } from './categoryUtils.js';
import { getLootDetails } from './lootCatalog.js';

const RARITIES = {
  common: { label: 'Common', icon: '◈' },
  uncommon: { label: 'Uncommon', icon: '✦' },
  rare: { label: 'Rare', icon: '✧' },
  legendary: { label: 'Legendary', icon: '✹' }
};

const LOCATION_LOOT = {
  household: [
    { name: 'Royal Seal', emoji: '👑' }, { name: 'Castle Key', emoji: '🗝️' }, { name: 'Knight’s Ribbon', emoji: '🎗️' }
  ],
  technology: [
    { name: 'Arcane Crystal', emoji: '🔮' }, { name: 'Enchanted Ink', emoji: '🪶' }, { name: 'Spell Scroll', emoji: '📜' }
  ],
  academy: [
    { name: 'Mooncrest Tome', emoji: '📖' }, { name: 'Scholar’s Quill', emoji: '🪶' }, { name: 'Starlight Sigil', emoji: '🌙' }
  ],
  'dragons-den': [
    { name: 'Dragon Scale', emoji: '🐉' }, { name: 'Hoard Coin', emoji: '🪙' }, { name: 'Ember Relic', emoji: '🔥' }
  ],
  'bog-of-eternal-stench': [
    { name: 'Bog Charm', emoji: '🧿' }, { name: 'Strange Herb', emoji: '🌿' }, { name: 'Mirestone', emoji: '🪨' }
  ],
  realm: [
    { name: 'Tavern Token', emoji: '🪙' }, { name: 'Questing Charm', emoji: '🧭' }, { name: 'Traveller’s Trinket', emoji: '📿' },
    { name: 'Wayfarer’s Lantern', emoji: '🏮' }, { name: 'Fatebound Die', emoji: '🎲' }, { name: 'Phoenix Feather', emoji: '🪶' },
    { name: 'Whispering Locket', emoji: '📿' }, { name: 'Runed Hearthstone', emoji: '🪨' }, { name: 'Starlit Chalice', emoji: '🏆' }
  ]
};

const DROP_CHANCE = { low: 0.25, medium: 0.45, high: 0.65, critical: 0.85 };
const RARITY_WEIGHTS = {
  low: [['common', 90], ['uncommon', 10]],
  medium: [['common', 70], ['uncommon', 25], ['rare', 5]],
  high: [['common', 50], ['uncommon', 35], ['rare', 13], ['legendary', 2]],
  critical: [['common', 30], ['uncommon', 40], ['rare', 24], ['legendary', 6]]
};

function weightedRarity(priority) {
  const roll = Math.random() * 100;
  let total = 0;
  for (const [rarity, weight] of RARITY_WEIGHTS[priority] || RARITY_WEIGHTS.medium) {
    total += weight;
    if (roll < total) return rarity;
  }
  return 'common';
}

export function awardLootForQuest(quest, customCategories = [], ownedLoot = []) {
  const priority = quest.priority || 'medium';
  if (Math.random() >= (DROP_CHANCE[priority] || DROP_CHANCE.medium)) return null;
  const location = getCategoryById(quest.category, customCategories);
  const ownedNames = new Set(ownedLoot.map(item => item?.name).filter(Boolean));
  const themedLoot = LOCATION_LOOT[quest.category] || [];
  const pool = [...themedLoot, ...LOCATION_LOOT.realm]
    .filter(item => !ownedNames.has(item.name));
  if (!pool.length) return null;
  const item = pool[Math.floor(Math.random() * pool.length)];
  const rarity = weightedRarity(priority);
  const details = getLootDetails(item.name);
  return {
    id: `loot_${quest.id}_${Date.now().toString(36)}`,
    name: item.name,
    emoji: item.emoji,
    image: details.image,
    lore: details.lore,
    rarity,
    locationId: location.id,
    locationName: location.name,
    locationEmoji: location.emoji,
    foundAt: new Date().toISOString(),
    questName: quest.name
  };
}

export function rarityDetails(rarity) {
  return RARITIES[rarity] || RARITIES.common;
}

export function showLootReveal(loot) {
  const rarity = rarityDetails(loot.rarity);
  const details = getLootDetails(loot.name);
  const overlay = document.createElement('div');
  overlay.className = `loot-reveal-overlay rarity-${loot.rarity}`;
  overlay.innerHTML = `<section class="loot-reveal" role="status" aria-live="polite"><span class="loot-reveal-kicker">${rarity.icon} ${rarity.label} loot found ${rarity.icon}</span><img class="loot-reveal-art" src="${details.image}" alt="${loot.name}"><strong>${loot.emoji} ${loot.name}</strong><small>Found in ${loot.locationEmoji} ${loot.locationName}</small></section>`;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 4200);
}
