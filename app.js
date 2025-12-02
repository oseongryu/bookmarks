// ===== Global State =====
let allUrls = [];

// ===== DOM Elements =====
const elements = {
    // Forms
    addUrlForm: document.getElementById('addUrlForm'),
    editUrlForm: document.getElementById('editUrlForm'),

    // Toggle
    toggleOptions: document.getElementById('toggleOptions'),
    optionalFields: document.getElementById('optionalFields'),

    // URL List
    urlList: document.getElementById('urlList'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    refreshBtn: document.getElementById('refreshBtn'),

    // Modal
    editModal: document.getElementById('editModal'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadUrls();
    setupEventListeners();
});

// ===== Event Listeners =====
function setupEventListeners() {
    // Forms
    elements.addUrlForm.addEventListener('submit', addUrl);
    elements.editUrlForm.addEventListener('submit', updateUrl);

    // Toggle optional fields
    elements.toggleOptions.addEventListener('click', () => {
        elements.toggleOptions.classList.toggle('active');
        elements.optionalFields.classList.toggle('show');
    });

    // Search and refresh
    elements.searchInput.addEventListener('input', searchUrls);
    elements.refreshBtn.addEventListener('click', loadUrls);

    // Modal close
    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', hideEditModal);
    });
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
            .order('created_at', { ascending: false });

        if (error) throw error;

        allUrls = data || [];
        renderUrls(allUrls);
    } catch (error) {
        console.error('Load URLs error:', error);
        showToast('URL 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        elements.loadingSpinner.classList.add('d-none');
    }
}

async function addUrl(e) {
    e.preventDefault();

    const urlData = {
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
        await loadUrls();
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
            .eq('id', id);

        if (error) throw error;

        showToast('URL이 수정되었습니다!', 'success');
        hideEditModal();
        await loadUrls();
    } catch (error) {
        console.error('Update URL error:', error);
        showToast('URL 수정 중 오류가 발생했습니다.', 'error');
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
                <div class="url-item-content">
                    ${url.category ? `<span class="url-item-category">${escapeHtml(url.category)}</span>` : ''}
                    <div class="url-item-title">
                        <i class="bi bi-bookmark-fill"></i>
                        ${escapeHtml(url.title)}
                    </div>
                    <a href="${escapeHtml(url.url)}" target="_blank" class="url-item-link">
                        ${escapeHtml(url.url)}
                    </a>
                    ${url.description ? `<div class="url-item-description">${escapeHtml(url.description)}</div>` : ''}
                </div>
                <div class="url-item-actions">
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

// Make functions globally available for onclick handlers
window.deleteUrl = deleteUrl;
window.showEditModal = showEditModal;
