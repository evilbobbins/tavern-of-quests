import { BUILTIN_CATEGORIES } from '../config.js';

export function getAllCategories(customCategories = []) {
  return [...BUILTIN_CATEGORIES, ...(customCategories || [])];
}

export function getCategoryById(id, customCategories = []) {
  const allCategories = getAllCategories(customCategories);
  return allCategories.find(c => c.id === id) || { 
    id: 'unknown', 
    name: 'Unknown', 
    emoji: '\u2753'
  };
}

export function getCategoryTagClass(category) {
  if (!category) return 'tag-custom';
  if (category.builtin) {
    if (category.id === 'household') return 'tag-household';
    if (category.id === 'academy') return 'tag-academy';
    if (category.id === 'dragons-den') return 'tag-dragons-den';
    if (category.id === 'bog-of-eternal-stench') return 'tag-bog';
    return 'tag-technology';
  }
  return 'tag-custom';
}
