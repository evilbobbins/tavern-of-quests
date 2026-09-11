import { escapeHtml, escapeAttr } from '../utils/helpers.js';
import { getAllCategories } from '../utils/categoryUtils.js';
import { createModal, closeModal, closeTopModal } from './Modal.js';
import { showToast } from '../utils/helpers.js';

export function openTemplateManager() {
  const templates = window.state.templates || [];
  
  const templateListHtml = templates.length === 0
    ? '<div class="empty-state"><span class="empty-icon">📋</span>No templates yet. Create one below!</div>'
    : templates.map(t => `
        <div class="template-item">
          <div class="template-info">
            <div class="template-name">${escapeHtml(t.name)}</div>
            <div class="template-meta">
              <span class="template-type">${t.type === 'main' ? '⚔️ Main' : '🗺️ Side'}</span>
              <span class="template-priority">${getPriorityBadge(t.priority)}</span>
              <span class="template-xp">✨ ${t.xp} XP</span>
            </div>
            ${t.description ? `<div class="template-desc">${escapeHtml(t.description)}</div>` : ''}
          </div>
          <div class="template-actions">
            <button class="quest-btn edit-btn" onclick="window.openEditTemplateModal('${t.id}')" title="Edit">✏️</button>
            <button class="quest-btn delete-btn" onclick="window.deleteTemplate('${t.id}')" title="Delete">🗑️</button>
          </div>
        </div>
      `).join('');
  
  const categories = getAllCategories(window.state.customCategories);
  const categoryOptions = categories.map(c => 
    `<option value="${c.id}">${c.emoji} ${escapeHtml(c.name)}</option>`
  ).join('');
  
  const content = `
    <div class="modal-header">
      <h3 class="modal-title">📋 Quest Templates</h3>
      <button class="modal-close" onclick="window.closeTopModal()">&times;</button>
    </div>
    
    <div class="admin-section">
      <div class="admin-section-title">📋 Existing Templates</div>
      <div class="template-list">${templateListHtml}</div>
    </div>
    
    <div class="admin-section" style="border-top:1px solid var(--gold-dark); padding-top:20px;">
      <div class="admin-section-title">➕ Create New Template</div>
      <div class="form-group" style="margin-bottom:12px;">
        <label>Template Name</label>
        <input type="text" id="new-template-name" placeholder="e.g., Daily Meditation, Weekly Review..." maxlength="50">
      </div>
      <div class="form-row" style="margin-bottom:12px;">
        <div class="form-group">
          <label>Quest Type</label>
          <select id="new-template-type">
            <option value="main">⚔️ Main Quest</option>
            <option value="side">🗺️ Side Quest</option>
          </select>
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="new-template-category">${categoryOptions}</select>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:12px;">
        <div class="form-group">
          <label>Priority</label>
          <select id="new-template-priority">
            <option value="critical">💀 Critical</option>
            <option value="high">🔴 High</option>
            <option value="medium" selected>🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
        <div class="form-group">
          <label>XP Reward</label>
          <select id="new-template-xp">
            <option value="10">10 XP</option>
            <option value="25" selected>25 XP</option>
            <option value="50">50 XP</option>
            <option value="100">100 XP</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label>Description (optional)</label>
        <input type="text" id="new-template-desc" placeholder="Brief description..." maxlength="200">
      </div>
      <div class="modal-actions">
        <button class="btn-modal btn-cancel" onclick="window.closeTopModal()">Close</button>
        <button class="btn-modal btn-save" onclick="window.createTemplate()">➕ Create Template</button>
      </div>
    </div>
  `;
  
  createModal(content);
}

function getPriorityBadge(priority) {
  const badges = {
    critical: '💀 Critical',
    high: '🔴 High',
    medium: '🟡 Medium',
    low: '🟢 Low'
  };
  return badges[priority] || '🟡 Medium';
}

window.createTemplate = async () => {
  const name = document.getElementById('new-template-name').value.trim();
  if (!name) {
    showToast('⚠️', 'Name Required', 'Please enter a template name.');
    return;
  }
  
  const template = {
    id: 'template_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name,
    type: document.getElementById('new-template-type').value,
    category: document.getElementById('new-template-category').value,
    priority: document.getElementById('new-template-priority').value,
    xp: parseInt(document.getElementById('new-template-xp').value),
    description: document.getElementById('new-template-desc').value.trim()
  };
  
  if (!window.state.templates) window.state.templates = [];
  window.state.templates.push(template);
  window.recordActivity?.('📋', `Created template “${name}”`);
  
  const saved = await window.saveSharedRealm();
  if (saved) {
    showToast('📋', 'Template Created!', `"${name}" template added.`);
    // Close current modal before opening refreshed version
    closeTopModal();
    openTemplateManager();
  } else {
    window.state.templates.pop();
    showToast('⚠️', 'Save Failed', 'Could not save template.');
  }
};

window.saveQuestFormAsTemplate = async () => {
  const name = document.getElementById('quest-name')?.value.trim();
  if (!name) {
    showToast('⚠️', 'Quest Name Required', 'Name the quest first, then save its settings as a template.');
    document.getElementById('quest-name')?.focus();
    return;
  }
  const template = {
    id: 'template_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name,
    type: document.getElementById('quest-type').value,
    category: document.getElementById('quest-category').value,
    priority: document.getElementById('quest-priority').value,
    xp: parseInt(document.getElementById('quest-xp').value),
    description: document.getElementById('quest-desc').value.trim()
  };
  if (!window.state.templates) window.state.templates = [];
  window.state.templates.push(template);
  window.recordActivity?.('📋', `Saved “${name}” as a template`);
  const saved = await window.saveSharedRealm();
  if (saved) showToast('📋', 'Template Saved!', `“${name}” is ready to reuse.`);
  else { window.state.templates.pop(); showToast('⚠️', 'Save Failed', 'Could not save template.'); }
};

window.openEditTemplateModal = (templateId) => {
  const template = (window.state.templates || []).find(t => t.id === templateId);
  if (!template) return;
  
  const categories = getAllCategories(window.state.customCategories);
  const categoryOptions = categories.map(c => 
    `<option value="${c.id}" ${template.category === c.id ? 'selected' : ''}>${c.emoji} ${escapeHtml(c.name)}</option>`
  ).join('');
  
  const content = `
    <div class="modal-header">
      <h3 class="modal-title">✏️ Edit Template</h3>
      <button class="modal-close" onclick="window.closeTopModal()">&times;</button>
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <label>Template Name</label>
      <input type="text" id="edit-template-name" value="${escapeAttr(template.name)}" maxlength="50">
    </div>
    <div class="form-row" style="margin-bottom:12px;">
      <div class="form-group">
        <label>Quest Type</label>
        <select id="edit-template-type">
          <option value="main" ${template.type === 'main' ? 'selected' : ''}>⚔️ Main Quest</option>
          <option value="side" ${template.type === 'side' ? 'selected' : ''}>🗺️ Side Quest</option>
        </select>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select id="edit-template-category">${categoryOptions}</select>
      </div>
    </div>
    <div class="form-row" style="margin-bottom:12px;">
      <div class="form-group">
        <label>Priority</label>
        <select id="edit-template-priority">
          <option value="critical" ${template.priority === 'critical' ? 'selected' : ''}>💀 Critical</option>
          <option value="high" ${template.priority === 'high' ? 'selected' : ''}>🔴 High</option>
          <option value="medium" ${template.priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
          <option value="low" ${template.priority === 'low' ? 'selected' : ''}>🟢 Low</option>
        </select>
      </div>
      <div class="form-group">
        <label>XP Reward</label>
        <select id="edit-template-xp">
          <option value="10" ${template.xp === 10 ? 'selected' : ''}>10 XP</option>
          <option value="25" ${template.xp === 25 ? 'selected' : ''}>25 XP</option>
          <option value="50" ${template.xp === 50 ? 'selected' : ''}>50 XP</option>
          <option value="100" ${template.xp === 100 ? 'selected' : ''}>100 XP</option>
        </select>
      </div>
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <label>Description (optional)</label>
      <input type="text" id="edit-template-desc" value="${escapeAttr(template.description || '')}" maxlength="200">
    </div>
    <div class="modal-actions">
      <button class="btn-modal btn-cancel" onclick="window.closeTopModal(); window.openTemplateManager();">Cancel</button>
      <button class="btn-modal btn-save" onclick="window.saveTemplateEdit('${template.id}')">💾 Save Changes</button>
    </div>
  `;
  
  createModal(content);
};

window.saveTemplateEdit = async (templateId) => {
  const template = (window.state.templates || []).find(t => t.id === templateId);
  if (!template) return;
  
  const name = document.getElementById('edit-template-name').value.trim();
  if (!name) {
    showToast('⚠️', 'Name Required', 'Please enter a template name.');
    return;
  }
  
  const backup = { ...template };
  template.name = name;
  template.type = document.getElementById('edit-template-type').value;
  template.category = document.getElementById('edit-template-category').value;
  template.priority = document.getElementById('edit-template-priority').value;
  template.xp = parseInt(document.getElementById('edit-template-xp').value);
  template.description = document.getElementById('edit-template-desc').value.trim();
  
  const saved = await window.saveSharedRealm();
  if (saved) {
    showToast('✏️', 'Template Updated!', `"${name}" template modified.`);
    closeTopModal();
    openTemplateManager();
  } else {
    Object.assign(template, backup);
    showToast('⚠️', 'Save Failed', 'Could not save changes.');
  }
};

window.deleteTemplate = async (templateId) => {
  const template = (window.state.templates || []).find(t => t.id === templateId);
  if (!template) return;
  
  if (!confirm(`Delete template "${template.name}"?`)) return;
  
  const backup = [...(window.state.templates || [])];
  window.state.templates = window.state.templates.filter(t => t.id !== templateId);
  
  const saved = await window.saveSharedRealm();
  if (saved) {
    showToast('🗑️', 'Template Deleted', `"${template.name}" template removed.`);
    closeTopModal();
    openTemplateManager();
  } else {
    window.state.templates = backup;
    showToast('⚠️', 'Delete Failed', 'Could not save changes.');
  }
};

export function openTemplatePicker() {
  const templates = window.state.templates || [];
  
  if (templates.length === 0) {
    showToast('⚠️', 'No Templates', 'Create templates in the Admin Panel first.');
    return;
  }
  
  const templateListHtml = templates.map(t => `
    <div class="template-picker-item" onclick="window.applyTemplate('${t.id}')">
      <div class="template-picker-name">${escapeHtml(t.name)}</div>
      <div class="template-picker-meta">
        <span>${t.type === 'main' ? '⚔️ Main' : '🗺️ Side'}</span>
        <span>${getPriorityBadge(t.priority)}</span>
        <span>✨ ${t.xp} XP</span>
      </div>
      ${t.description ? `<div class="template-picker-desc">${escapeHtml(t.description)}</div>` : ''}
    </div>
  `).join('');
  
  const content = `
    <div class="modal-header">
      <h3 class="modal-title">📋 Use Quest Template</h3>
      <button class="modal-close" onclick="window.closeTopModal()">&times;</button>
    </div>
    <div class="template-picker-list">
      ${templateListHtml}
    </div>
    <div class="modal-actions">
      <button class="btn-modal btn-cancel" onclick="window.closeTopModal()">Cancel</button>
    </div>
  `;
  
  createModal(content);
}

window.applyTemplate = (templateId) => {
  const template = (window.state.templates || []).find(t => t.id === templateId);
  if (!template) return;
  
  // Fill the quest form with template data
  document.getElementById('quest-name').value = template.name;
  document.getElementById('quest-type').value = template.type;
  document.getElementById('quest-category').value = template.category;
  document.getElementById('quest-priority').value = template.priority;
  document.getElementById('quest-xp').value = template.xp;
  document.getElementById('quest-desc').value = template.description || '';
  
  window.closeTopModal();
  showToast('📋', 'Template Applied!', `"${template.name}" template loaded. Modify and post!`);
  
  // Focus on the quest name field
  document.getElementById('quest-name').focus();
  document.getElementById('quest-name').select();
};

// New function to close only the topmost modal
window.closeTopModal = () => {
  const modals = document.querySelectorAll('.modal-overlay');
  if (modals.length > 0) {
    // Remove the last (topmost) modal
    modals[modals.length - 1].remove();
  }
};
