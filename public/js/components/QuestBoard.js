import { createQuestCard } from './QuestCard.js';
import { getAllCategories, getCategoryById } from '../utils/categoryUtils.js';
import { CONFIG } from '../config.js';

export function renderQuestBoard(quests, filters, onFilterChange) {
  if (!Array.isArray(quests)) {
    console.error('Quests is not an array:', quests);
    return;
  }

  const validQuests = quests.filter(q => q != null);
  
  const mainQuests = validQuests.filter(q => q.type === 'main');
  const sideQuests = validQuests.filter(q => q.type === 'side');
  
  const mainFiltered = filters.main === 'all' 
    ? mainQuests 
    : mainQuests.filter(q => q.category === filters.main);
  
  const sideFiltered = filters.side === 'all'
    ? sideQuests
    : sideQuests.filter(q => q.category === filters.side);
  
  const sortByPriority = (a, b) => {
    const pa = CONFIG.PRIORITY_ORDER[a?.priority] ?? 2;
    const pb = CONFIG.PRIORITY_ORDER[b?.priority] ?? 2;
    const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return pa !== pb ? pa - pb : dateB - dateA;
  };

  const sortedMain = [...mainFiltered].sort(sortByPriority);
  const sortedSide = [...sideFiltered].sort(sortByPriority);
  
  document.getElementById('main-count').textContent = mainQuests.length;
  document.getElementById('side-count').textContent = sideQuests.length;
  
  const mainList = document.getElementById('main-quest-list');
  mainList.innerHTML = sortedMain.length === 0
    ? '<div class="empty-state"><span class="empty-icon">\u2694\uFE0F</span><strong>Your quest board is ready.</strong><br>Post your first quest, or start from a template.<div class="empty-actions"><button class="empty-action" type="button" onclick="document.getElementById(\'quest-name\').focus()">Post a quest</button><button class="empty-action" type="button" onclick="window.openTemplatePicker()">Use a template</button></div></div>'
    : sortedMain.map(q => {
        if (!q) return '';
        const cat = getCategoryById(q.category, window.state?.customCategories || []);
        return createQuestCard(q, cat).outerHTML;
      }).join('');
  
  const sideList = document.getElementById('side-quest-list');
  sideList.innerHTML = sortedSide.length === 0
    ? '<div class="empty-state"><span class="empty-icon">\u{1F9ED}</span>No side quests.</div>'
    : sortedSide.map(q => {
        if (!q) return '';
        const cat = getCategoryById(q.category, window.state?.customCategories || []);
        return createQuestCard(q, cat).outerHTML;
      }).join('');
  
  renderFilterTabs('main', filters.main);
  renderFilterTabs('side', filters.side);
  
  window.setFilterCallbackHandler = onFilterChange;
}

function renderFilterTabs(type, activeFilter) {
  const container = document.getElementById(`${type}-filter-tabs`);
  if (!container) return;
  
  const categories = getAllCategories(window.state?.customCategories || []);
  let html = `<div class="filter-tab ${activeFilter === 'all' ? 'active' : ''}" onclick="window.setFilterCallback('${type}', 'all', this)">All</div>`;
  
  for (const cat of categories) {
    html += `<div class="filter-tab ${activeFilter === cat.id ? 'active' : ''}" onclick="window.setFilterCallback('${type}', '${cat.id}', this)">${cat.emoji} ${cat.name}</div>`;
  }
  
  container.innerHTML = html;
}

window.setFilterCallback = (type, filter, el) => {
  if (window.setFilterCallbackHandler) {
    window.setFilterCallbackHandler(type, filter);
    const tabs = el.parentElement.querySelectorAll('.filter-tab');
    tabs.forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
};
