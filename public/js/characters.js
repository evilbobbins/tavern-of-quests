import { escapeHtml } from './utils/helpers.js';

export const GUILD_CHARACTERS = [
  { id: 'cedric', name: 'Sir Cedric Ashford', role: 'The Oathbound Knight', story: 'A steadfast guardian who treats every promise as a sacred quest.', portrait: '/images/characters/cedric.png' },
  { id: 'lyra', name: 'Lyra Moonwhisper', role: 'The Moonlit Spellweaver', story: 'A quiet elf mage whose starlit magic turns tangled problems into clear paths.', portrait: '/images/characters/lyra.png' },
  { id: 'bramble', name: 'Bramble Thistlebuckle', role: 'The Trail Scout', story: 'A quick-witted ranger who can find a shortcut through any wild and winding day.', portrait: '/images/characters/bramble.png' },
  { id: 'doran', name: 'Doran Ironvein', role: 'The Forgewise Artificer', story: 'A practical dwarf inventor who believes every broken thing deserves one more clever try.', portrait: '/images/characters/doran.png' },
  { id: 'aldric', name: 'Aldric Emberquill', role: 'The Emberwise Wizard', story: 'A patient scholar whose bright magic and sharper wit can illuminate even the most stubborn mystery.', portrait: '/images/characters/aldric.png' },
  { id: 'nessa', name: 'Nessa Nightvale', role: 'The Lantern Rogue', story: 'A quick-footed half-elf with a talent for finding hidden doors, overlooked details, and the safest way through trouble.', portrait: '/images/characters/nessa.png' },
];

export function getGuildCharacter(id) { return GUILD_CHARACTERS.find(character => character.id === id) || null; }
export function adventurerLabel(user) { return user?.playerTag ? `${user.name} · ${user.playerTag}` : (user?.name || 'Adventurer'); }
export function avatarMarkup(avatar, className = 'character-avatar-image') {
  const character = getGuildCharacter(avatar);
  if (character) return `<img class="${className}" src="${character.portrait}" alt="${escapeHtml(character.name)}">`;
  return `<span class="character-avatar-emoji">${escapeHtml(avatar || '🧑')}</span>`;
}
