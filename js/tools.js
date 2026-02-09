import { state, elements } from './state.js';
import { supabase } from './supabaseClient.js';
import { showToast, hideDuplicateModal, hideImportModal, hideBulkDeleteModal, showDuplicateModal, showBulkDeleteModal } from './ui.js';
import { loadUrls } from './urls.js';
import { escapeHtml } from './utils.js';

// ===== Duplicate Detection and Removal =====
export function normalizeUrl(url) {
    try {
        const original = url;

        // Parse URL and normalize
        let normalized = url.trim().toLowerCase();

        // Remove query parameters and hash first
        normalized = normalized.split('?')[0].split('#')[0];

        // Remove www. prefix
        normalized = normalized.replace(/^(https?:\/\/)www\./, '$1');

        // Remove trailing slashes
        while (normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }

        console.log('URL Normalization:', original, '->', normalized);
        return normalized;
    } catch (error) {
        console.error('Normalization error:', error);
        return url.trim().toLowerCase();
    }
}

export async function findDuplicates() {
    try {
        // Fetch all URLs for current access key
        const { data, error } = await supabase
            .from('urls')
            .select('*')
            .eq('access_key', state.currentAccessKey)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group URLs by normalized URL
        const urlGroups = new Map();

        data.forEach(item => {
            const normalized = normalizeUrl(item.url);
            if (!urlGroups.has(normalized)) {
                urlGroups.set(normalized, []);
            }
            urlGroups.get(normalized).push(item);
        });

        // Filter groups with > 1 item
        const duplicateGroups = Array.from(urlGroups.values()).filter(group => group.length > 1);

        elements.duplicateLoading.classList.add('d-none');
        elements.duplicateContent.classList.remove('d-none');

        if (duplicateGroups.length === 0) {
            elements.duplicateList.innerHTML = '';
            elements.noDuplicates.classList.remove('d-none');
        } else {
            elements.noDuplicates.classList.add('d-none');
            renderDuplicateGroups(duplicateGroups);
        }
    } catch (error) {
        console.error('Find duplicates error:', error);
        showToast('중복 검사 중 오류가 발생했습니다.', 'error');
        elements.duplicateLoading.classList.add('d-none');
    }
}

function renderDuplicateGroups(groups) {
    elements.duplicateList.innerHTML = groups.map((group, groupIndex) => {
        // Sort by created_at to find the oldest item
        const sortedGroup = [...group].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const oldestItem = sortedGroup[0]; // Keep oldest
        const itemsToShow = sortedGroup.slice(1); // Potential duplicates to delete

        return `
            <div class="duplicate-group" data-group-index="${groupIndex}">
                <div class="duplicate-group-header">
                    <div class="duplicate-group-title">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                        중복 그룹 ${groupIndex + 1}
                    </div>
                    <span class="duplicate-count">${group.length}개</span>
                </div>
                
                <div class="duplicate-items">
                    <div class="duplicate-item-kept" data-item-id="${oldestItem.id}">
                        <div class="duplicate-item-kept-badge">
                            <span class="badge-kept">유지됨</span>
                        </div>
                        <label class="duplicate-item-info">
                            <div class="duplicate-item-title">${escapeHtml(oldestItem.title)}</div>
                            <div class="duplicate-item-url">${escapeHtml(oldestItem.url)}</div>
                            <div class="duplicate-item-meta">
                                등록: ${new Date(oldestItem.created_at).toLocaleString('ko-KR')}
                                ${oldestItem.category ? ` • 카테고리: ${escapeHtml(oldestItem.category)}` : ''}
                            </div>
                        </label>
                    </div>

                    <div class="duplicate-divider"></div>

                    ${itemsToShow.map((item, itemIndex) => `
                        <div class="duplicate-item" data-item-id="${item.id}">
                            <div class="duplicate-item-checkbox">
                                <input 
                                    type="checkbox" 
                                    id="dup-${groupIndex}-${itemIndex}"
                                    data-group="${groupIndex}"
                                    data-id="${item.id}"
                                    onchange="toggleDuplicateItem(this)"
                                >
                            </div>
                            <label for="dup-${groupIndex}-${itemIndex}" class="duplicate-item-info">
                                <div class="duplicate-item-title">${escapeHtml(item.title)}</div>
                                <div class="duplicate-item-url">${escapeHtml(item.url)}</div>
                                <div class="duplicate-item-meta">
                                    등록: ${new Date(item.created_at).toLocaleString('ko-KR')}
                                    ${item.category ? ` • 카테고리: ${escapeHtml(item.category)}` : ''}
                                </div>
                            </label>
                        </div>
                    `).join('')}
                </div>
                
                <div class="duplicate-group-actions">
                    <button 
                        class="btn-delete-selected" 
                        onclick="deleteSelectedInGroup(${groupIndex})"
                        id="delete-btn-${groupIndex}"
                        disabled
                    >
                        <i class="bi bi-trash"></i>
                        선택한 항목 삭제
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

export function toggleDuplicateItem(checkbox) {
    const item = checkbox.closest('.duplicate-item');
    const groupIndex = parseInt(checkbox.dataset.group);
    const deleteBtn = document.getElementById(`delete-btn-${groupIndex}`);

    // Toggle selected class
    if (checkbox.checked) {
        item.classList.add('selected');
    } else {
        item.classList.remove('selected');
    }

    // Enable/disable delete button based on selection
    if (deleteBtn) {
        const group = checkbox.closest('.duplicate-group');
        const checkedCount = group.querySelectorAll('input[type="checkbox"]:checked').length;
        deleteBtn.disabled = checkedCount === 0;
    }
}

export async function deleteSelectedInGroup(groupIndex) {
    const group = document.querySelector(`[data-group-index="${groupIndex}"]`);
    if (!group) return;
    
    const checkedBoxes = group.querySelectorAll('input[type="checkbox"]:checked');
    if (checkedBoxes.length === 0) return;

    const idsToDelete = Array.from(checkedBoxes).map(cb => cb.dataset.id);

    if (!confirm(`선택한 ${idsToDelete.length}개의 항목을 삭제하시겠습니까?`)) return;

    try {
        const { error } = await supabase
            .from('urls')
            .delete()
            .in('id', idsToDelete);

        if (error) throw error;

        showToast(`${idsToDelete.length}개의 중복 항목이 삭제되었습니다.`, 'success');
        
        // Refresh duplicates list
        await findDuplicates();
        // Refresh main list
        await loadUrls();
        
    } catch (error) {
        console.error('Delete duplicates error:', error);
        showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
}


// ===== Import/Export Functions =====
export async function importBookmarks(e) {
    e.preventDefault();
    
    const file = elements.bookmarkFile.files[0];
    if (!file) {
        showToast('파일을 선택해주세요.', 'error');
        return;
    }

    try {
        elements.importForm.classList.add('d-none');
        elements.importProgress.classList.remove('d-none');
        elements.progressFill.style.width = '0%';
        elements.importStatus.textContent = '파일을 읽는 중...';

        const text = await file.text();
        elements.progressFill.style.width = '20%';

        elements.importStatus.textContent = '북마크를 분석 중...';
        const bookmarks = parseBookmarkHTML(text);
        elements.progressFill.style.width = '40%';

        if (bookmarks.length === 0) {
            throw new Error('북마크를 찾을 수 없습니다.');
        }

        let existingUrls = new Set();
        if (elements.skipDuplicates.checked) {
            elements.importStatus.textContent = '중복 확인 중...';
            const { data, error } = await supabase
                .from('urls')
                .select('url')
                .eq('access_key', state.currentAccessKey);
            
            if (!error && data) {
                existingUrls = new Set(data.map(item => normalizeUrl(item.url)));
            }
            elements.progressFill.style.width = '50%';
        }

        const bookmarksToImport = elements.skipDuplicates.checked
            ? bookmarks.filter(bm => !existingUrls.has(normalizeUrl(bm.url)))
            : bookmarks;

        if (bookmarksToImport.length === 0) {
            showToast('가져올 새로운 북마크가 없습니다.', 'error');
            hideImportModal();
            return;
        }

        elements.importStatus.textContent = `${bookmarksToImport.length}개의 북마크를 가져오는 중...`;
        const batchSize = 50;
        let imported = 0;

        for (let i = 0; i < bookmarksToImport.length; i += batchSize) {
            const batch = bookmarksToImport.slice(i, i + batchSize);
            const urlData = batch.map(bm => ({
                access_key: state.currentAccessKey,
                title: bm.title || bm.url,
                url: bm.url,
                category: bm.category || null,
                description: null
            }));

            const { error } = await supabase.from('urls').insert(urlData);
            
            if (error) {
                console.error('Batch import error:', error);
            } else {
                imported += batch.length;
            }

            const progress = 50 + ((imported / bookmarksToImport.length) * 50);
            elements.progressFill.style.width = `${progress}%`;
            elements.importStatus.textContent = `${imported} / ${bookmarksToImport.length} 가져옴...`;
        }

        elements.progressFill.style.width = '100%';
        const skipped = bookmarks.length - bookmarksToImport.length;
        const message = skipped > 0
            ? `${imported}개의 북마크를 가져왔습니다. (${skipped}개 중복 제외)`
            : `${imported}개의 북마크를 가져왔습니다.`;
        
        showToast(message, 'success');
        hideImportModal();
        await loadUrls();
        elements.importForm.reset();

    } catch (error) {
        console.error('Import error:', error);
        showToast('북마크 가져오기 실패: ' + error.message, 'error');
        elements.importForm.classList.remove('d-none');
        elements.importProgress.classList.add('d-none');
    }
}

function parseBookmarkHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bookmarks = [];

    const links = doc.querySelectorAll("a[href]");
    
    links.forEach(link => {
        const url = link.getAttribute("href");
        const title = link.textContent.trim();

        if (!url) return;

        const isValidUrl = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("chrome://");
        if (!isValidUrl) return;

        // Build category path from all parent H3 elements
        const categoryPath = [];
        let element = link;

        while (element && element.tagName !== "BODY") {
            element = element.parentElement;
            if (element && element.tagName === "DL") {
                const parentDT = element.parentElement;
                if (parentDT && parentDT.tagName === "DT") {
                    const h3 = parentDT.querySelector(":scope > h3");
                    if (h3) {
                        const categoryName = h3.textContent.trim();
                        if (!categoryPath.includes(categoryName)) {
                            categoryPath.unshift(categoryName);
                        }
                    }
                }
            }
        }

        const category = categoryPath.length > 0 ? categoryPath.join("/") : null;

        bookmarks.push({
            url: url,
            title: title || url,
            category: category
        });
    });

    return bookmarks;
}

export async function exportBookmarks() {
    try {
        const { data, error } = await supabase
            .from('urls')
            .select('*')
            .eq('access_key', state.currentAccessKey)
            .order('category', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            showToast('내보낼 북마크가 없습니다.', 'error');
            return;
        }

        const html = generateBookmarkHTML(data);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        
        const now = new Date();
        const timestamp = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '_' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');
            
        a.download = `bookmarks_${timestamp}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(`${data.length}개의 북마크를 내보냈습니다.`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('북마크 내보내기 중 오류가 발생했습니다.', 'error');
    }
}

function generateBookmarkHTML(urls) {
    // Build tree structure
    const tree = {};
    const uncategorized = [];

    urls.forEach(url => {
        if (url.category) {
            const parts = url.category.split('/').map(p => p.trim()).filter(p => p);
            let current = tree;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!current[part]) {
                    current[part] = { _folders: {}, _bookmarks: [] };
                }
                if (i === parts.length - 1) {
                    current[part]._bookmarks.push(url);
                } else {
                    current = current[part]._folders;
                }
            }
        } else {
            uncategorized.push(url);
        }
    });

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    function generateFolder(folderTree, indent = "    ") {
        let result = "";
        const folders = Object.keys(folderTree).sort();

        folders.forEach(folderName => {
            const folder = folderTree[folderName];
            result += `${indent}<DT><H3>${escapeHtml(folderName)}</H3></DT>\n`;
            result += `${indent}<DL><p>\n`;

            if (folder._bookmarks && folder._bookmarks.length > 0) {
                folder._bookmarks.forEach(url => {
                    const timestamp = Math.floor(new Date(url.created_at).getTime() / 1000);
                    result += `${indent}    <DT><A HREF="${escapeHtml(url.url)}" ADD_DATE="${timestamp}">${escapeHtml(url.title)}</A></DT>\n`;
                });
            }

            if (folder._folders && Object.keys(folder._folders).length > 0) {
                result += generateFolder(folder._folders, indent + "    ");
            }

            result += `${indent}</DL><p>\n`;
        });
        return result;
    }

    html += generateFolder(tree);

    if (uncategorized.length > 0) {
        uncategorized.forEach(url => {
            const timestamp = Math.floor(new Date(url.created_at).getTime() / 1000);
            html += `    <DT><A HREF="${escapeHtml(url.url)}" ADD_DATE="${timestamp}">${escapeHtml(url.title)}</A></DT>\n`;
        });
    }

    html += `</DL><p>\n`;
    return html;
}

// ===== Bulk Delete Functions =====
let bulkDeleteItems = [];

export async function loadBulkDeleteItems() {
    try {
        elements.bulkDeleteLoading.classList.remove('d-none');
        elements.bulkDeleteContent.classList.add('d-none');
        
        const { data, error } = await supabase
            .from('urls')
            .select('*')
            .eq('access_key', state.currentAccessKey)
            .order('created_at', { ascending: false });

        if (error) throw error;

        bulkDeleteItems = data.map(item => ({...item, selected: false}));
        renderBulkDeleteGrid();
        
        elements.bulkDeleteLoading.classList.add('d-none');
        elements.bulkDeleteContent.classList.remove('d-none');
    } catch (error) {
        console.error('Load bulk items error:', error);
        showToast('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

function renderBulkDeleteGrid() {
    elements.bulkDeleteGrid.innerHTML = '';
    
    if (bulkDeleteItems.length === 0) {
        elements.noBulkItems.classList.remove('d-none');
        elements.selectAllBtn.disabled = true;
        elements.deselectAllBtn.disabled = true;
        return;
    }

    elements.noBulkItems.classList.add('d-none');
    elements.selectAllBtn.disabled = false;
    elements.deselectAllBtn.disabled = false;

    bulkDeleteItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = `bulk-item ${item.selected ? 'selected' : ''}`;
        itemEl.onclick = () => toggleBulkItem(item.id);
        
        itemEl.innerHTML = `
            <div class="bulk-item-check">
                <i class="bi bi-check-lg"></i>
            </div>
            <div class="bulk-item-title">${escapeHtml(item.title)}</div>
            <div class="bulk-item-url">${escapeHtml(item.url)}</div>
        `;
        
        elements.bulkDeleteGrid.appendChild(itemEl);
    });

    updateBulkDeleteCount();
}

export function toggleBulkItem(id) {
    const item = bulkDeleteItems.find(i => i.id === id);
    if (item) {
        item.selected = !item.selected;
        renderBulkDeleteGrid();
    }
}

export function selectAllBulkItems() {
    bulkDeleteItems.forEach(item => item.selected = true);
    renderBulkDeleteGrid();
}

export function deselectAllBulkItems() {
    bulkDeleteItems.forEach(item => item.selected = false);
    renderBulkDeleteGrid();
}

function updateBulkDeleteCount() {
    const count = bulkDeleteItems.filter(i => i.selected).length;
    elements.selectedCount.textContent = count;
    elements.deleteBulkBtn.disabled = count === 0;
}

export async function deleteBulkItems() {
    const selectedIds = bulkDeleteItems.filter(i => i.selected).map(i => i.id);
    
    if (selectedIds.length === 0) return;
    
    if (!confirm(`선택한 ${selectedIds.length}개의 항목을 삭제하시겠습니까?`)) return;
    
    try {
        const { error } = await supabase
            .from('urls')
            .delete()
            .in('id', selectedIds);
            
        if (error) throw error;
        
        showToast(`${selectedIds.length}개의 항목이 삭제되었습니다.`, 'success');
        
        // Remove from local list to avoid reload
        bulkDeleteItems = bulkDeleteItems.filter(i => !i.selected);
        renderBulkDeleteGrid();
        
        // Refresh main list if modal closed
        await loadUrls();
        
    } catch (error) {
        console.error('Bulk delete error:', error);
        showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
}
