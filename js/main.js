import { state, elements } from './state.js';
import { checkAuth, handleLogin, handleLogout } from './auth.js';
import { loadUrls, addUrl, updateUrl, deleteUrl, fetchUrls } from './urls.js';
import { loadMemos, addMemo, updateMemo, deleteMemo, fetchMemos, toggleMemoContent } from './memos.js';
import { showToast, showEditModal, showEditMemoModal, hideEditModal, hideMemoModal, hideDuplicateModal, hideImportModal, hideBulkDeleteModal, showDuplicateModal, showImportModal, showBulkDeleteModal, toggleUserMenu, closeUserMenu, toggleToolsMenu, closeToolsMenu, updateAccessKeyDisplay, showLoginModal, hideLoginModal } from './ui.js';
import { findDuplicates, importBookmarks, exportBookmarks, deleteSelectedInGroup, toggleDuplicateItem, loadBulkDeleteItems, toggleBulkItem, selectAllBulkItems, deselectAllBulkItems, deleteBulkItems } from './tools.js';
import { copyUrl } from './utils.js';

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    // Restore auto fetch title toggle state
    const autoFetchTitle = localStorage.getItem('autoFetchTitle');
    if (autoFetchTitle !== null) {
        elements.autoFetchTitleToggle.checked = autoFetchTitle === 'true';
    }

    // Restore edit mode toggle state
    const editMode = localStorage.getItem('editMode');
    if (editMode === 'true') {
        elements.editModeToggle.checked = true;
        document.body.classList.add('edit-mode');
    }

    if (checkAuth()) {
        updateAccessKeyDisplay(state.currentAccessKey);
        await loadUrls(); // Default mode is URL
        setupEventListeners();
    } else {
        showLoginModal();
        setupEventListeners();
    }
});

// ===== Event Listeners =====
function setupEventListeners() {
    // Forms
    elements.addUrlForm.addEventListener('submit', addItem);
    elements.editUrlForm.addEventListener('submit', updateUrl);
    elements.editMemoForm.addEventListener('submit', updateMemo);
    elements.loginForm.addEventListener('submit', handleLogin);

    // Mode Toggle
    elements.urlModeBtn.addEventListener('click', () => switchMode('url'));
    elements.memoModeBtn.addEventListener('click', () => switchMode('memo'));

    // User Menu
    elements.userMenuBtn.addEventListener('click', toggleUserMenu);

    // Tools Menu
    elements.toolsMenuBtn.addEventListener('click', toggleToolsMenu);

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.userMenuBtn.contains(e.target) && !elements.userDropdown.contains(e.target)) {
            closeUserMenu();
        }
        if (!elements.toolsMenuBtn.contains(e.target) && !elements.toolsDropdown.contains(e.target)) {
            closeToolsMenu();
        }
    });

    // Logout, Duplicate, Import, Export, Bulk Delete
    elements.logoutBtn.addEventListener('click', handleLogout);
    elements.duplicateBtn.addEventListener('click', () => {
        closeToolsMenu();
        showDuplicateModal();
        findDuplicates();
    });
    elements.importBtn.addEventListener('click', () => {
        closeToolsMenu();
        showImportModal();
    });
    elements.exportBtn.addEventListener('click', () => {
        closeToolsMenu();
        exportBookmarks();
    });
    elements.bulkDeleteBtn.addEventListener('click', () => {
        closeToolsMenu();
        showBulkDeleteModal();
        loadBulkDeleteItems();
    });
    elements.importForm.addEventListener('submit', importBookmarks);
    elements.selectAllBtn.addEventListener('click', selectAllBulkItems);
    elements.deselectAllBtn.addEventListener('click', deselectAllBulkItems);
    elements.deleteBulkBtn.addEventListener('click', deleteBulkItems);

    // Toggle optional fields
    elements.toggleOptions.addEventListener('click', () => {
        elements.toggleOptions.classList.toggle('active');
        elements.optionalFields.classList.toggle('show');
    });

    // Toggle edit mode
    elements.editModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('edit-mode');
        } else {
            document.body.classList.remove('edit-mode');
        }
        localStorage.setItem('editMode', e.target.checked);
    });

    // Auto fetch title toggle
    elements.autoFetchTitleToggle.addEventListener('change', (e) => {
        localStorage.setItem('autoFetchTitle', e.target.checked);
    });

    // Search and refresh
    elements.searchInput.addEventListener('input', searchItems);
    elements.refreshBtn.addEventListener('click', refreshItems);

    // Search filters
    elements.searchTitle.addEventListener('change', searchItems);
    elements.searchUrl.addEventListener('change', searchItems);
    elements.searchCategory.addEventListener('change', searchItems);
    elements.searchDescription.addEventListener('change', searchItems);

    // Pagination
    elements.itemsPerPageSelect.addEventListener('change', (e) => {
        state.itemsPerPage = parseInt(e.target.value);
        state.currentPage = 1;
        if (state.currentMode === 'url') {
            fetchUrls();
        } else {
            fetchMemos();
        }
    });

    elements.prevPageBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            if (state.currentMode === 'url') {
                fetchUrls();
            } else {
                fetchMemos();
            }
        }
    });

    elements.nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(state.totalCount / state.itemsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            if (state.currentMode === 'url') {
                fetchUrls();
            } else {
                fetchMemos();
            }
        }
    });

    // Modal close
    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', hideEditModal);
    });

    document.querySelectorAll('[data-dismiss="duplicate-modal"]').forEach(btn => {
        btn.addEventListener('click', hideDuplicateModal);
    });

    document.querySelectorAll('[data-dismiss="import-modal"]').forEach(btn => {
        btn.addEventListener('click', hideImportModal);
    });

    document.querySelectorAll('[data-dismiss="bulk-delete-modal"]').forEach(btn => {
        btn.addEventListener('click', hideBulkDeleteModal);
    });

    document.querySelectorAll('[data-dismiss="memo-modal"]').forEach(btn => {
        btn.addEventListener('click', hideMemoModal);
    });
}

// ===== Mode Switching =====
function switchMode(mode) {
    if (state.currentMode === mode) return;
    
    state.currentMode = mode;
    state.currentPage = 1;
    state.searchQuery = '';
    elements.searchInput.value = '';
    
    // Update mode buttons
    if (mode === 'url') {
        elements.urlModeBtn.classList.add('active');
        elements.memoModeBtn.classList.remove('active');
        elements.appIcon.className = 'bi bi-link-45deg';
        elements.appTitle.textContent = 'URL Manager';
        elements.addButtonText.textContent = 'URL 추가';
    } else {
        elements.memoModeBtn.classList.add('active');
        elements.urlModeBtn.classList.remove('active');
        elements.appIcon.className = 'bi bi-sticky';
        elements.appTitle.textContent = 'Memo Manager';
        elements.addButtonText.textContent = '메모 추가';
    }
    
    // Toggle form fields
    const urlFields = document.querySelectorAll('.url-mode-field');
    const memoFields = document.querySelectorAll('.memo-mode-field');
    
    if (mode === 'url') {
        urlFields.forEach(field => field.style.display = '');
        memoFields.forEach(field => field.style.display = 'none');
        document.getElementById('urlAddress').required = true;
        document.getElementById('memoContent').required = false;
    } else {
        urlFields.forEach(field => field.style.display = 'none');
        memoFields.forEach(field => field.style.display = '');
        document.getElementById('urlAddress').required = false;
        document.getElementById('memoContent').required = true;
    }
    
    // Load data for current mode
    if (state.currentMode === 'url') {
        loadUrls();
    } else {
        loadMemos();
    }
}

// ===== Item Logic =====
async function addItem(e) {
    e.preventDefault();

    if (state.currentMode === 'url') {
        await addUrl();
    } else {
        await addMemo();
    }
}

function searchItems() {
    const query = elements.searchInput.value.trim();
    state.searchQuery = query;
    state.currentPage = 1;
    if (state.currentMode === 'url') {
        fetchUrls();
    } else {
        fetchMemos();
    }
}

function refreshItems() {
    if (state.currentMode === 'url') {
        loadUrls();
    } else {
        loadMemos();
    }
}

// Make functions globally available for onclick handlers
window.deleteUrl = deleteUrl;
window.showEditModal = showEditModal;
window.copyUrl = copyUrl;
window.toggleDuplicateItem = toggleDuplicateItem;
window.deleteSelectedInGroup = deleteSelectedInGroup;
window.toggleBulkItem = toggleBulkItem;
window.deleteMemo = deleteMemo;
window.showEditMemoModal = showEditMemoModal;
window.toggleMemoContent = toggleMemoContent;
