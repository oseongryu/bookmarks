// ===== Global State =====
let currentAccessKey = null; // 현재 로그인한 사용자의 액세스 키
let currentPage = 1;
let itemsPerPage = 5;
let totalCount = 0; // 전체 URL 개수
let searchQuery = ''; // 현재 검색어

// ===== Authentication =====
const AUTH_STORAGE_KEY = 'url_manager_auth';

// ===== DOM Elements =====
const elements = {
    // Forms
    addUrlForm: document.getElementById('addUrlForm'),
    editUrlForm: document.getElementById('editUrlForm'),
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

    // Pagination
    itemsPerPageSelect: document.getElementById('itemsPerPage'),
    paginationNav: document.getElementById('paginationNav'),
    prevPageBtn: document.getElementById('prevPage'),
    nextPageBtn: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),

    // Modal
    editModal: document.getElementById('editModal'),
    loginModal: document.getElementById('loginModal'),

    // Buttons
    logoutBtn: document.getElementById('logoutBtn'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    if (checkAuth()) {
        await loadUrls();
        setupEventListeners();
    } else {
        showLoginModal();
        setupEventListeners();
    }
});

// ===== Event Listeners =====
function setupEventListeners() {
    // Forms
    elements.addUrlForm.addEventListener('submit', addUrl);
    elements.editUrlForm.addEventListener('submit', updateUrl);
    elements.loginForm.addEventListener('submit', handleLogin);

    // Logout
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Toggle optional fields
    elements.toggleOptions.addEventListener('click', () => {
        elements.toggleOptions.classList.toggle('active');
        elements.optionalFields.classList.toggle('show');
    });

    // Toggle edit mode
    elements.editModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('edit-mode');
        elements.editModeToggle.classList.toggle('active');
    });

    // Search and refresh
    elements.searchInput.addEventListener('input', searchUrls);
    elements.refreshBtn.addEventListener('click', loadUrls);

    // Pagination
    elements.itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        fetchUrls();
    });

    elements.prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchUrls();
        }
    });

    elements.nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(totalCount / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            fetchUrls();
        }
    });

    // Modal close
    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', hideEditModal);
    });
}

// ===== URL CRUD Functions =====
async function loadUrls() {
    if (!currentAccessKey) {
        console.log('No access key available');
        return;
    }

    currentPage = 1;
    searchQuery = '';
    elements.searchInput.value = '';
    await fetchUrls();
}

async function fetchUrls() {
    if (!currentAccessKey) {
        console.log('No access key available');
        return;
    }

    try {
        elements.loadingSpinner.classList.remove('d-none');
        elements.urlList.innerHTML = '';
        elements.emptyState.classList.add('d-none');

        // Calculate range for pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;

        // Build query (excluding category and description)
        let query = supabase
            .from('urls')
            .select('id, title, url, created_at', { count: 'exact' })
            .eq('access_key', currentAccessKey)
            .order('created_at', { ascending: false });

        // Apply search filter if exists (only search url)
        if (searchQuery) {
            query = query.ilike('url', `%${searchQuery}%`);
        }

        // Apply pagination
        query = query.range(startIndex, endIndex);

        const { data, error, count } = await query;

        if (error) throw error;

        totalCount = count || 0;
        renderUrls(data || []);
        updatePaginationUI();
    } catch (error) {
        console.error('Load URLs error:', error);
        showToast('URL 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        elements.loadingSpinner.classList.add('d-none');
    }
}

async function addUrl(e) {
    e.preventDefault();

    const title = document.getElementById('urlTitle').value.trim();
    const url = document.getElementById('urlAddress').value.trim();

    try {
        let finalTitle = title;

        // If title is empty, use timestamp as index
        if (!title) {
            const now = new Date();
            // Format: YYYYMMDD_HHmmss (e.g., 20251209_083701)
            finalTitle = now.getFullYear() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0') +
                String(now.getSeconds()).padStart(2, '0');
        }

        const urlData = {
            access_key: currentAccessKey,
            title: finalTitle,
            url: url,
            category: document.getElementById('urlCategory').value.trim() || null,
            description: document.getElementById('urlDescription').value.trim() || null
        };

        const { error } = await supabase
            .from('urls')
            .insert([urlData]);

        if (error) throw error;

        showToast('URL이 추가되었습니다!', 'success');
        elements.addUrlForm.reset();

        // Hide optional fields after submit
        elements.toggleOptions.classList.remove('active');
        elements.optionalFields.classList.remove('show');

        await loadUrls();
    } catch (error) {
        console.error('Add URL error:', error);
        showToast('URL 추가 중 오류가 발생했습니다.', 'error');
    }
}

async function deleteUrl(id) {
    if (!confirm('정말 이 URL을 삭제하시겠습니까?')) return;

    try {
        const { error } = await supabase
            .from('urls')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('URL이 삭제되었습니다.', 'success');
        await fetchUrls();
    } catch (error) {
        console.error('Delete URL error:', error);
        showToast('URL 삭제 중 오류가 발생했습니다.', 'error');
    }
}

function showEditModal(url) {
    document.getElementById('editUrlId').value = url.id;
    document.getElementById('editUrlTitle').value = url.title;
    document.getElementById('editUrlCategory').value = url.category || '';
    document.getElementById('editUrlAddress').value = url.url;
    document.getElementById('editUrlDescription').value = url.description || '';

    elements.editModal.classList.add('show');
}

function hideEditModal() {
    elements.editModal.classList.remove('show');
}

async function updateUrl(e) {
    e.preventDefault();

    const id = document.getElementById('editUrlId').value;
    const title = document.getElementById('editUrlTitle').value.trim();
    const url = document.getElementById('editUrlAddress').value.trim();

    const urlData = {
        title: title || url, // Use URL as title if title is empty
        url: url,
        category: document.getElementById('editUrlCategory').value.trim() || null,
        description: document.getElementById('editUrlDescription').value.trim() || null
    };

    try {
        const { error } = await supabase
            .from('urls')
            .update(urlData)
            .eq('id', id);

        if (error) throw error;

        showToast('URL이 수정되었습니다!', 'success');
        hideEditModal();
        await fetchUrls();
    } catch (error) {
        console.error('Update URL error:', error);
        showToast('URL 수정 중 오류가 발생했습니다.', 'error');
    }
}

// ===== Render Functions =====
function renderUrls(urls) {
    elements.urlList.innerHTML = urls.map(url => `
        <div class="url-item">
            <div class="url-item-header">
                <div class="url-item-content">
                    <div class="url-item-title">
                        <i class="bi bi-bookmark-fill"></i>
                        ${escapeHtml(url.title)}
                    </div>
                    <a href="${escapeHtml(url.url)}" target="_blank" class="url-item-link">
                        ${escapeHtml(url.url)}
                    </a>
                </div>
                <div class="url-item-actions">
                    <button class="btn-icon copy" onclick="copyUrl('${escapeHtml(url.url)}')" title="복사">
                        <i class="bi bi-clipboard"></i>
                    </button>
                    <button class="btn-icon edit" onclick="showEditModal(${JSON.stringify(url).replace(/"/g, '&quot;')})" title="수정">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteUrl('${url.id}')" title="삭제">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Pagination Functions =====
function updatePaginationUI() {
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Handle empty results
    if (totalCount === 0) {
        elements.emptyState.classList.remove('d-none');
        elements.urlList.innerHTML = '';
        elements.paginationNav.classList.add('d-none');
        return;
    }

    elements.emptyState.classList.add('d-none');

    // Hide pagination if only one page
    if (totalPages <= 1) {
        elements.paginationNav.classList.add('d-none');
        return;
    }

    elements.paginationNav.classList.remove('d-none');
    elements.pageInfo.textContent = `${currentPage} / ${totalPages}`;

    // Update button states
    elements.prevPageBtn.disabled = currentPage === 1;
    elements.nextPageBtn.disabled = currentPage === totalPages;

    // Add/remove disabled class for styling
    if (currentPage === 1) {
        elements.prevPageBtn.classList.add('disabled');
    } else {
        elements.prevPageBtn.classList.remove('disabled');
    }

    if (currentPage === totalPages) {
        elements.nextPageBtn.classList.add('disabled');
    } else {
        elements.nextPageBtn.classList.remove('disabled');
    }
}

function searchUrls() {
    const query = elements.searchInput.value.trim();
    searchQuery = query;
    currentPage = 1;
    fetchUrls();
}

async function copyUrl(url) {
    try {
        await navigator.clipboard.writeText(url);
        showToast('URL이 복사되었습니다!', 'success');
    } catch (error) {
        console.error('Copy error:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('URL이 복사되었습니다!', 'success');
        } catch (err) {
            showToast('복사에 실패했습니다.', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// ===== UI Functions =====
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ===== Utility Functions =====
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== Authentication Functions =====
function checkAuth() {
    const authKey = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authKey) {
        currentAccessKey = authKey;
        return true;
    }
    return false;
}

function handleLogin(e) {
    e.preventDefault();
    const inputKey = document.getElementById('loginKey').value.trim();

    if (inputKey) {
        // 모든 키를 유효한 것으로 간주 (각 키마다 별도의 데이터 공간)
        currentAccessKey = inputKey;
        localStorage.setItem(AUTH_STORAGE_KEY, inputKey);
        hideLoginModal();
        showToast('로그인 성공!', 'success');
        loadUrls();
        document.getElementById('loginKey').value = '';
    } else {
        showToast('액세스 키를 입력해주세요.', 'error');
    }
}

function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        currentAccessKey = null;
        localStorage.removeItem(AUTH_STORAGE_KEY);
        showLoginModal();
        showToast('로그아웃 되었습니다.', 'success');
        // Clear state
        totalCount = 0;
        currentPage = 1;
        searchQuery = '';
        elements.urlList.innerHTML = '';
        elements.emptyState.classList.add('d-none');
        elements.paginationNav.classList.add('d-none');
    }
}

function showLoginModal() {
    elements.loginModal.classList.add('show');
}

function hideLoginModal() {
    elements.loginModal.classList.remove('show');
}

// Make functions globally available for onclick handlers
window.deleteUrl = deleteUrl;
window.showEditModal = showEditModal;
window.copyUrl = copyUrl;
