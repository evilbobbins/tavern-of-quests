export const LOOT_CATALOG = {
  'Royal Seal': { image: '/images/loot/royal-seal.png', lore: 'Pressed in crimson wax beneath the first crown of the realm, this seal is recognised by every castle gatekeeper.' },
  'Castle Key': { image: '/images/loot/castle-key.png', lore: 'Its wards have long faded, but the old iron still remembers every hidden passage it once opened.' },
  'Knight’s Ribbon': { image: '/images/loot/knights-ribbon.png', lore: 'A ribbon bestowed after an honourable deed. It carries the quiet pride of a sworn protector.' },
  'Arcane Crystal': { image: '/images/loot/arcane-crystal.png', lore: 'A violet shard that hums softly near unfinished spells and particularly difficult mysteries.' },
  'Enchanted Ink': { image: '/images/loot/enchanted-ink.png', lore: 'This midnight ink writes most clearly by candlelight and refuses to record a deliberate lie.' },
  'Spell Scroll': { image: '/images/loot/spell-scroll.png', lore: 'The sigil on its ribbon changes whenever nobody is looking, as though the spell is choosing its reader.' },
  'Mooncrest Tome': { image: '/images/loot/mooncrest-tome.png', lore: 'Borrowed from a locked academy shelf, its margins are filled with generations of helpful, argumentative notes.' },
  'Scholar’s Quill': { image: '/images/loot/scholars-quill.png', lore: 'A silver-feathered quill said to grow warmer whenever its owner discovers something worth remembering.' },
  'Starlight Sigil': { image: '/images/loot/starlight-sigil.png', lore: 'An academy charm that caught one small piece of the night sky and has been glowing ever since.' },
  'Dragon Scale': { image: '/images/loot/dragon-scale.png', lore: 'Cool to the touch despite its ember-bright edge, this scale was shed by something ancient and very large.' },
  'Hoard Coin': { image: '/images/loot/hoard-coin.png', lore: 'A heavy coin from a dragon’s treasure pile. It seems to find the bottom of any pocket immediately.' },
  'Ember Relic': { image: '/images/loot/ember-relic.png', lore: 'A palm-sized relic containing a patient flame, waiting for a tale bold enough to wake it.' },
  'Bog Charm': { image: '/images/loot/bog-charm.png', lore: 'Braided from reed, bone, and a secret third thing. Locals insist it keeps the bog from noticing you.' },
  'Strange Herb': { image: '/images/loot/strange-herb.png', lore: 'Its luminous leaves smell sharply of rain. Brewed carefully, it is useful; brewed carelessly, it is memorable.' },
  'Mirestone': { image: '/images/loot/mirestone.png', lore: 'A mossy stone that never quite dries. Hold it close and you may hear frogs debating ancient philosophy.' },
  'Tavern Token': { image: '/images/loot/tavern-token.png', lore: 'A brass token good for one mysterious favour at a participating tavern, if you can find one.' },
  'Questing Charm': { image: '/images/loot/questing-charm.png', lore: 'The compass needle points not north, but toward the nearest task that has been put off for too long.' },
  'Traveller’s Trinket': { image: '/images/loot/travellers-trinket.png', lore: 'A bead-strung keepsake from a road no map admits to knowing. It brings a little luck to every journey.' },
  'Wayfarer’s Lantern': { image: '/images/loot/wayfarers-lantern.png', lore: 'This brass lantern always finds a flame when a traveller most needs to see the next step.' },
  'Fatebound Die': { image: '/images/loot/fatebound-die.png', lore: 'Its golden runes rearrange before every roll. Luck, it insists, is only another kind of adventure.' },
  'Phoenix Feather': { image: '/images/loot/phoenix-feather.png', lore: 'Warm but never burning, this feather carries a spark of every fresh beginning.' },
  'Whispering Locket': { image: '/images/loot/whispering-locket.png', lore: 'Held to the ear, the locket offers a faint word of encouragement in a voice you almost recognise.' },
  'Runed Hearthstone': { image: '/images/loot/runed-hearthstone.png', lore: 'A pocket-sized hearth that glows with the memory of safe rooms, shared stories, and warm meals.' },
  'Starlit Chalice': { image: '/images/loot/starlit-chalice.png', lore: 'Its midnight pool reflects constellations from skies far beyond the tavern door.' }
};

const LOOT_SOURCES = {
  'Royal Seal': { emoji: '🏰', name: 'The Castle' },
  'Castle Key': { emoji: '🏰', name: 'The Castle' },
  'Knight’s Ribbon': { emoji: '🏰', name: 'The Castle' },
  'Arcane Crystal': { emoji: '🧙', name: "The Wizard's Lair" },
  'Enchanted Ink': { emoji: '🧙', name: "The Wizard's Lair" },
  'Spell Scroll': { emoji: '🧙', name: "The Wizard's Lair" },
  'Mooncrest Tome': { emoji: '🎓', name: 'Mooncrest Academy' },
  'Scholar’s Quill': { emoji: '🎓', name: 'Mooncrest Academy' },
  'Starlight Sigil': { emoji: '🎓', name: 'Mooncrest Academy' },
  'Dragon Scale': { emoji: '🐉', name: "Dragon's Den" },
  'Hoard Coin': { emoji: '🐉', name: "Dragon's Den" },
  'Ember Relic': { emoji: '🐉', name: "Dragon's Den" },
  'Bog Charm': { emoji: '🧪', name: 'Bog of Eternal Stench' },
  'Strange Herb': { emoji: '🧪', name: 'Bog of Eternal Stench' },
  'Mirestone': { emoji: '🧪', name: 'Bog of Eternal Stench' },
  'Tavern Token': { emoji: '🌍', name: 'Anywhere in the Realm' },
  'Questing Charm': { emoji: '🌍', name: 'Anywhere in the Realm' },
  'Traveller’s Trinket': { emoji: '🌍', name: 'Anywhere in the Realm' },
  'Wayfarer’s Lantern': { emoji: '🌍', name: 'Anywhere in the Realm' },
  'Fatebound Die': { emoji: '🌍', name: 'Anywhere in the Realm' },
  'Phoenix Feather': { emoji: '🌍', name: 'Anywhere in the Realm' },
  'Whispering Locket': { emoji: '🌍', name: 'Anywhere in the Realm' },
  'Runed Hearthstone': { emoji: '🌍', name: 'Anywhere in the Realm' },
  'Starlit Chalice': { emoji: '🌍', name: 'Anywhere in the Realm' }
};

export function getLootSource(name) {
  return LOOT_SOURCES[name] || { emoji: '🌍', name: 'Anywhere in the Realm' };
}

export function getLootDetails(name) {

  return LOOT_CATALOG[name] || { image: '/images/loot/tavern-token.png', lore: 'A curious treasure with a story still waiting to be told.' };
}
