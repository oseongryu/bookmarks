// ===== Global State =====
export const state = {
    currentAccessKey: null,
    currentPage: 1,
    itemsPerPage: 5,
    totalCount: 0,
    searchQuery: '',
    currentMode: 'url' // 'url' or 'memo'
};

export const AUTH_STORAGE_KEY = 'url_manager_auth';

// DOM Elements
export const elements = {
    // Forms
    addUrlForm: document.getElementById('addUrlForm'),
    editUrlForm: document.getElementById('editUrlForm'),
    editMemoForm: document.getElementById('editMemoForm'),
    loginForm: document.getElementById('loginForm'),

    // Toggle
    toggleOptions: document.getElementById('toggleOptions'),
    optionalFields: document.getElementById('optionalFields'),
    editModeToggle: document.getElementById('editModeToggle'),

    // URL List
    urlList: document.getElementById('urlList'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    refreshBtn: document.getElementById('refreshBtn'),

    // Search Filters
    searchTitle: document.getElementById('searchTitle'),
    searchUrl: document.getElementById('searchUrl'),
    searchCategory: document.getElementById('searchCategory'),
    searchDescription: document.getElementById('searchDescription'),

    // Pagination
    itemsPerPageSelect: document.getElementById('itemsPerPage'),
    paginationNav: document.getElementById('paginationNav'),
    prevPageBtn: document.getElementById('prevPage'),
    nextPageBtn: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),

    // Modal
    editModal: document.getElementById('editModal'),
    editMemoModal: document.getElementById('editMemoModal'),
    loginModal: document.getElementById('loginModal'),
    duplicateModal: document.getElementById('duplicateModal'),
    importModal: document.getElementById('importModal'),
    bulkDeleteModal: document.getElementById('bulkDeleteModal'),

    // Mode Toggle
    urlModeBtn: document.getElementById('urlModeBtn'),
    memoModeBtn: document.getElementById('memoModeBtn'),
    appIcon: document.getElementById('appIcon'),
    appTitle: document.getElementById('appTitle'),
    addButtonText: document.getElementById('addButtonText'),

    // Memo Form Elements
    memoTitle: document.getElementById('memoTitle'),
    memoContent: document.getElementById('memoContent'),

    // Buttons
    logoutBtn: document.getElementById('logoutBtn'),
    duplicateBtn: document.getElementById('duplicateBtn'),
    importBtn: document.getElementById('importBtn'),
    exportBtn: document.getElementById('exportBtn'),
    bulkDeleteBtn: document.getElementById('bulkDeleteBtn'),
    
    // Duplicate Modal Elements
    duplicateLoading: document.getElementById('duplicateLoading'),
    duplicateContent: document.getElementById('duplicateContent'),
    duplicateList: document.getElementById('duplicateList'),
    noDuplicates: document.getElementById('noDuplicates'),

    // Import Modal Elements
    importForm: document.getElementById('importForm'),
    bookmarkFile: document.getElementById('bookmarkFile'),
    skipDuplicates: document.getElementById('skipDuplicates'),
    importProgress: document.getElementById('importProgress'),
    progressFill: document.getElementById('progressFill'),
    importStatus: document.getElementById('importStatus'),

    // Bulk Delete Modal Elements
    bulkDeleteLoading: document.getElementById('bulkDeleteLoading'),
    bulkDeleteContent: document.getElementById('bulkDeleteContent'),
    bulkDeleteGrid: document.getElementById('bulkDeleteGrid'),
    noBulkItems: document.getElementById('noBulkItems'),
    selectAllBtn: document.getElementById('selectAllBtn'),
    deselectAllBtn: document.getElementById('deselectAllBtn'),
    selectedCount: document.getElementById('selectedCount'),
    deleteBulkBtn: document.getElementById('deleteBulkBtn'),

    // User Menu
    userMenuBtn: document.getElementById('userMenuBtn'),
    userDropdown: document.getElementById('userDropdown'),
    dropdownAccessKey: document.getElementById('dropdownAccessKey'),

    // Tools Menu
    toolsMenuBtn: document.getElementById('toolsMenuBtn'),
    toolsDropdown: document.getElementById('toolsDropdown'),

    // Auto Fetch Title Toggle
    autoFetchTitleToggle: document.getElementById('autoFetchTitleToggle'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};
