export const CONFIG = {
  API_BASE: '',
  XP_PER_LEVEL: 100,
  COMPLETED_PER_PAGE: 12,
  PRIORITY_ORDER: { critical: 0, high: 1, medium: 2, low: 3 },
  PRIORITY_LABELS: {
    critical: '\u{1F480} Critical',
    high: '\u{1F534} High',
    medium: '\u{1F7E1} Medium',
    low: '\u{1F7E2} Low'
  }
};

export const BUILTIN_CATEGORIES = [
  { id: 'household', name: 'The Castle', emoji: '\u{1F3F0}', builtin: true },
  { id: 'technology', name: "The Wizard's Lair", emoji: '\u{1F9D9}', builtin: true },
  { id: 'academy', name: 'Mooncrest Academy', emoji: '\u{1F393}', builtin: true }
];
