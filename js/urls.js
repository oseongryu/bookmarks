import { state, elements } from './state.js';
import { supabase } from './supabaseClient.js';
import { showToast, hideEditModal, updatePaginationUI, showEditModal } from './ui.js';
import { escapeHtml, fetchTitleForUrl } from './utils.js';

// ===== URL CRUD Functions =====
export async function loadUrls() {
    if (!state.currentAccessKey) {
        console.log('No access key available');
        return;
    }

    state.currentPage = 1;
    state.searchQuery = '';
    elements.searchInput.value = '';
    await fetchUrls();
}

export async function fetchUrls() {
    if (!state.currentAccessKey) {
        console.log('No access key available');
        return;
    }

    try {
        elements.loadingSpinner.classList.remove('d-none');
        elements.urlList.innerHTML = '';
        elements.emptyState.classList.add('d-none');

        // Calculate range for pagination
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage - 1;

        // Build query - fetch all fields for search
        let query = supabase
            .from('urls')
            .select('id, title, url, category, description, created_at', { count: 'exact' })
            .eq('access_key', state.currentAccessKey)
            .order('created_at', { ascending: false });

        // Apply search filter if exists
        if (state.searchQuery) {
            const searchFields = [];
            if (elements.searchTitle.checked) searchFields.push('title');
            if (elements.searchUrl.checked) searchFields.push('url');
            if (elements.searchCategory.checked) searchFields.push('category');
            if (elements.searchDescription.checked) searchFields.push('description');

            // If at least one field is selected, apply OR filter
            if (searchFields.length > 0) {
                const orConditions = searchFields.map(field => `${field}.ilike.%${state.searchQuery}%`).join(',');
                query = query.or(orConditions);
            }
        }

        // Apply pagination
        query = query.range(startIndex, endIndex);

        const { data, error, count } = await query;

        if (error) throw error;

        state.totalCount = count || 0;
        renderUrls(data || []);
        updatePaginationUI(state);
    } catch (error) {
        console.error('Load URLs error:', error);
        showToast('URL 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        elements.loadingSpinner.classList.add('d-none');
    }
}

export async function addUrl() {
    const titleInput = document.getElementById('urlTitle').value.trim();
    const rawUrlInput = document.getElementById('urlAddress').value.trim();

    // Split by newlines and filter empty lines
    const urls = rawUrlInput.split(/[\n\r]+/).map(u => u.trim()).filter(u => u.length > 0);

    if (urls.length === 0) {
        showToast('URL을 입력해주세요.', 'error');
        return;
    }

    try {
        const category = document.getElementById('urlCategory').value.trim() || null;
        const description = document.getElementById('urlDescription').value.trim() || null;

        const now = new Date();
        const timestampBase = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '_' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');

        const urlDataList = urls.map((url, index) => {
            let finalTitle = titleInput;

            // If title is empty, use timestamp as temporary title
            if (!finalTitle) {
                finalTitle = urls.length > 1 ? `${timestampBase}_${index + 1}` : timestampBase;
            } else if (urls.length > 1) {
                // If title provided and multiple items, append index
                finalTitle = `${finalTitle} (${index + 1})`;
            }

            return {
                access_key: state.currentAccessKey,
                title: finalTitle,
                url: url,
                category: category,
                description: description
            };
        });

        const { data, error } = await supabase
            .from('urls')
            .insert(urlDataList)
            .select();

        if (error) throw error;

        const count = urlDataList.length;
        showToast(`${count}개의 URL이 추가되었습니다!`, 'success');
        elements.addUrlForm.reset();

        // Hide optional fields after submit
        elements.toggleOptions.classList.remove('active');
        elements.optionalFields.classList.remove('show');

        await loadUrls();

        // If title was empty and auto-fetch is enabled, fetch it in the background and update
        if (elements.autoFetchTitleToggle.checked && data) {
            data.forEach((item) => {
                if (!titleInput) {
                    fetchAndUpdateTitle(item.id, item.url);
                }
            });
        }
    } catch (error) {
        console.error('Add URL error:', error);
        showToast('URL 추가 중 오류가 발생했습니다.', 'error');
    }
}

export async function updateUrl(e) {
    if (e) e.preventDefault();

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

export async function deleteUrl(id) {
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

// Fetch title in background and update
export async function fetchAndUpdateTitle(id, url) {
    try {
        const fetchedTitle = await fetchTitleForUrl(url);

        // Only update if it's not a timestamp (meaning we got a real title)
        if (!/^\d{8}_\d{6}$/.test(fetchedTitle)) {
            const { error } = await supabase
                .from('urls')
                .update({ title: fetchedTitle })
                .eq('id', id);

            if (!error) {
                // Refresh the list to show updated title
                await fetchUrls();
            }
        }
    } catch (error) {
        console.log('Background title fetch failed:', error);
        // Silently fail - user already has the URL saved
    }
}

// ===== Render Functions =====
export function renderUrls(urls) {
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
