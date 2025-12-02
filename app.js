// ===== Global State =====
let currentUser = null;
let allUrls = [];
let authMode = 'login'; // 'login' or 'signup'

// ===== DOM Elements =====
const elements = {
    // Sections
    heroSection: document.getElementById('heroSection'),
    appSection: document.getElementById('appSection'),

    // Auth
    authButtons: document.getElementById('authButtons'),
    userInfo: document.getElementById('userInfo'),
    userEmail: document.getElementById('userEmail'),
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),
    heroLoginBtn: document.getElementById('heroLoginBtn'),
    heroSignupBtn: document.getElementById('heroSignupBtn'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Modals
    authModal: new bootstrap.Modal(document.getElementById('authModal')),
    editModal: new bootstrap.Modal(document.getElementById('editModal')),
    authModalTitle: document.getElementById('authModalTitle'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    authToggle: document.getElementById('authToggle'),

    // Forms
    authForm: document.getElementById('authForm'),
    authEmail: document.getElementById('authEmail'),
    authPassword: document.getElementById('authPassword'),
    addUrlForm: document.getElementById('addUrlForm'),
    editUrlForm: document.getElementById('editUrlForm'),

    // URL List
    urlList: document.getElementById('urlList'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    refreshBtn: document.getElementById('refreshBtn'),

    // Toast
    toast: new bootstrap.Toast(document.getElementById('toast')),
    toastMessage: document.getElementById('toastMessage'),
    toastElement: document.getElementById('toast')
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupEventListeners();
});

// ===== Authentication Functions =====
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        currentUser = session.user;
        showApp();
        await loadUrls();
    } else {
        showHero();
    }
}

async function handleAuth(e) {
    e.preventDefault();

    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;

    try {
        if (authMode === 'signup') {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) throw error;

            showToast('회원가입이 완료되었습니다! 이메일을 확인해주세요.', 'success');
            elements.authModal.hide();

            // Auto login after signup if email confirmation is disabled
            if (data.session) {
                currentUser = data.user;
                showApp();
                await loadUrls();
            }
        } else {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            currentUser = data.user;
            showToast('로그인되었습니다!', 'success');
            elements.authModal.hide();
            showApp();
            await loadUrls();
        }

        elements.authForm.reset();
    } catch (error) {
        console.error('Auth error:', error);
        showToast(error.message || '인증 중 오류가 발생했습니다.', 'danger');
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        allUrls = [];
        showToast('로그아웃되었습니다.', 'primary');
        showHero();
    } catch (error) {
        console.error('Logout error:', error);
        showToast('로그아웃 중 오류가 발생했습니다.', 'danger');
    }
}

function showAuthModal(mode) {
    authMode = mode;

    if (mode === 'signup') {
        elements.authModalTitle.textContent = '회원가입';
        elements.authSubmitBtn.textContent = '회원가입';
        elements.authToggle.innerHTML = '이미 계정이 있으신가요? <strong>로그인</strong>';
    } else {
        elements.authModalTitle.textContent = '로그인';
        elements.authSubmitBtn.textContent = '로그인';
        elements.authToggle.innerHTML = '계정이 없으신가요? <strong>회원가입</strong>';
    }

    elements.authModal.show();
}

// ===== URL CRUD Functions =====
async function loadUrls() {
    try {
        elements.loadingSpinner.classList.remove('d-none');
        elements.urlList.innerHTML = '';
        elements.emptyState.classList.add('d-none');

        const { data, error } = await supabase
            .from('urls')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allUrls = data || [];
        renderUrls(allUrls);
    } catch (error) {
        console.error('Load URLs error:', error);
        showToast('URL 목록을 불러오는 중 오류가 발생했습니다.', 'danger');
    } finally {
        elements.loadingSpinner.classList.add('d-none');
    }
}

async function addUrl(e) {
    e.preventDefault();

    const urlData = {
        user_id: currentUser.id,
        title: document.getElementById('urlTitle').value.trim(),
        url: document.getElementById('urlAddress').value.trim(),
        category: document.getElementById('urlCategory').value.trim() || null,
        description: document.getElementById('urlDescription').value.trim() || null
    };

    try {
        const { error } = await supabase
            .from('urls')
            .insert([urlData]);

        if (error) throw error;

        showToast('URL이 추가되었습니다!', 'success');
        elements.addUrlForm.reset();
        await loadUrls();
    } catch (error) {
        console.error('Add URL error:', error);
        showToast('URL 추가 중 오류가 발생했습니다.', 'danger');
    }
}

async function deleteUrl(id) {
    if (!confirm('정말 이 URL을 삭제하시겠습니까?')) return;

    try {
        const { error } = await supabase
            .from('urls')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        showToast('URL이 삭제되었습니다.', 'success');
        await loadUrls();
    } catch (error) {
        console.error('Delete URL error:', error);
        showToast('URL 삭제 중 오류가 발생했습니다.', 'danger');
    }
}

function showEditModal(url) {
    document.getElementById('editUrlId').value = url.id;
    document.getElementById('editUrlTitle').value = url.title;
    document.getElementById('editUrlCategory').value = url.category || '';
    document.getElementById('editUrlAddress').value = url.url;
    document.getElementById('editUrlDescription').value = url.description || '';

    elements.editModal.show();
}

async function updateUrl(e) {
    e.preventDefault();

    const id = document.getElementById('editUrlId').value;
    const urlData = {
        title: document.getElementById('editUrlTitle').value.trim(),
        url: document.getElementById('editUrlAddress').value.trim(),
        category: document.getElementById('editUrlCategory').value.trim() || null,
        description: document.getElementById('editUrlDescription').value.trim() || null
    };

    try {
        const { error } = await supabase
            .from('urls')
            .update(urlData)
            .eq('id', id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        showToast('URL이 수정되었습니다!', 'success');
        elements.editModal.hide();
        await loadUrls();
    } catch (error) {
        console.error('Update URL error:', error);
        showToast('URL 수정 중 오류가 발생했습니다.', 'danger');
    }
}

// ===== Render Functions =====
function renderUrls(urls) {
    if (urls.length === 0) {
        elements.emptyState.classList.remove('d-none');
        elements.urlList.innerHTML = '';
        return;
    }

    elements.emptyState.classList.add('d-none');

    elements.urlList.innerHTML = urls.map(url => `
        <div class="url-item">
            <div class="url-item-header">
                <div>
                    ${url.category ? `<span class="url-item-category">${escapeHtml(url.category)}</span>` : ''}
                    <div class="url-item-title">
                        <i class="bi bi-bookmark-fill text-primary"></i>
                        ${escapeHtml(url.title)}
                    </div>
                    <a href="${escapeHtml(url.url)}" target="_blank" class="url-item-link">
                        <i class="bi bi-box-arrow-up-right"></i>
                        ${escapeHtml(url.url)}
                    </a>
                    ${url.description ? `<div class="url-item-description">${escapeHtml(url.description)}</div>` : ''}
                </div>
                <div class="url-item-actions">
                    <button class="btn btn-outline-primary btn-icon" onclick="showEditModal(${JSON.stringify(url).replace(/"/g, '&quot;')})" title="수정">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-icon" onclick="deleteUrl('${url.id}')" title="삭제">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function searchUrls() {
    const query = elements.searchInput.value.toLowerCase().trim();

    if (!query) {
        renderUrls(allUrls);
        return;
    }

    const filtered = allUrls.filter(url =>
        url.title.toLowerCase().includes(query) ||
        url.url.toLowerCase().includes(query) ||
        (url.category && url.category.toLowerCase().includes(query)) ||
        (url.description && url.description.toLowerCase().includes(query))
    );

    renderUrls(filtered);
}

// ===== UI Functions =====
function showApp() {
    elements.heroSection.classList.add('d-none');
    elements.appSection.classList.remove('d-none');
    elements.authButtons.classList.add('d-none');
    elements.userInfo.classList.remove('d-none');
    elements.userInfo.classList.add('d-flex');
    elements.userEmail.textContent = currentUser.email;
}

function showHero() {
    elements.heroSection.classList.remove('d-none');
    elements.appSection.classList.add('d-none');
    elements.authButtons.classList.remove('d-none');
    elements.userInfo.classList.add('d-none');
    elements.userInfo.classList.remove('d-flex');
}

function showToast(message, type = 'primary') {
    elements.toastMessage.textContent = message;
    elements.toastElement.className = `toast align-items-center border-0 bg-${type}`;
    elements.toast.show();
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Auth buttons
    elements.loginBtn.addEventListener('click', () => showAuthModal('login'));
    elements.signupBtn.addEventListener('click', () => showAuthModal('signup'));
    elements.heroLoginBtn.addEventListener('click', () => showAuthModal('login'));
    elements.heroSignupBtn.addEventListener('click', () => showAuthModal('signup'));
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Auth toggle
    elements.authToggle.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthModal(authMode === 'login' ? 'signup' : 'login');
    });

    // Forms
    elements.authForm.addEventListener('submit', handleAuth);
    elements.addUrlForm.addEventListener('submit', addUrl);
    elements.editUrlForm.addEventListener('submit', updateUrl);

    // Search and refresh
    elements.searchInput.addEventListener('input', searchUrls);
    elements.refreshBtn.addEventListener('click', loadUrls);
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

// Make functions globally available for onclick handlers
window.deleteUrl = deleteUrl;
window.showEditModal = showEditModal;
