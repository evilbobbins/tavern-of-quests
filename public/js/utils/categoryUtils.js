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
    return category.id === 'household' ? 'tag-household' : category.id === 'academy' ? 'tag-academy' : 'tag-technology';
  }
  return 'tag-custom';
}
