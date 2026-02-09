import { state, elements } from './state.js';
import { supabase } from './supabaseClient.js';
import { showToast, hideMemoModal, updatePaginationUI, showEditMemoModal } from './ui.js';
import { escapeHtml } from './utils.js';

// ===== Memo CRUD Functions =====
export async function loadMemos() {
    if (!state.currentAccessKey) {
        console.log('No access key available');
        return;
    }

    state.currentPage = 1;
    state.searchQuery = '';
    elements.searchInput.value = '';
    await fetchMemos();
}

export async function fetchMemos() {
    if (!state.currentAccessKey) {
        console.log('No access key available');
        return;
    }

    try {
        elements.loadingSpinner.classList.remove('d-none');
        elements.urlList.innerHTML = '';
        elements.emptyState.classList.add('d-none');

        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage - 1;

        let query = supabase
            .from('memos')
            .select('id, title, content, category, created_at', { count: 'exact' })
            .eq('access_key', state.currentAccessKey)
            .order('created_at', { ascending: false });

        if (state.searchQuery) {
            const searchFields = [];
            if (elements.searchTitle.checked) searchFields.push('title');
            if (elements.searchCategory.checked) searchFields.push('category');
            if (elements.searchDescription.checked) searchFields.push('content');

            if (searchFields.length > 0) {
                const orConditions = searchFields
                    .map((field) => `${field}.ilike.%${state.searchQuery}%`)
                    .join(',');
                query = query.or(orConditions);
            }
        }

        query = query.range(startIndex, endIndex);

        const { data, error, count } = await query;

        if (error) throw error;

        state.totalCount = count || 0;
        renderMemos(data || []);
        updatePaginationUI(state);
    } catch (error) {
        console.error('Load memos error:', error);
        showToast('메모 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
        elements.loadingSpinner.classList.add('d-none');
    }
}

export async function addMemo() {
    const title = document.getElementById("memoTitle").value.trim();
    const content = document.getElementById("memoContent").value.trim();

    if (!content) {
        showToast("메모 내용을 입력해주세요.", "error");
        return;
    }

    try {
        const category = document.getElementById("urlCategory").value.trim() || null;

        const now = new Date();
        const timestampTitle = title || (
            now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0") +
            "_" +
            String(now.getHours()).padStart(2, "0") +
            String(now.getMinutes()).padStart(2, "0") +
            String(now.getSeconds()).padStart(2, "0")
        );

        const memoData = {
            access_key: state.currentAccessKey,
            title: timestampTitle,
            content: content,
            category: category,
        };

        const { error } = await supabase
            .from("memos")
            .insert([memoData])
            .select();

        if (error) throw error;

        showToast("메모가 추가되었습니다!", "success");
        elements.addUrlForm.reset();

        // Hide optional fields after submit
        elements.toggleOptions.classList.remove("active");
        elements.optionalFields.classList.remove("show");

        await loadMemos();
    } catch (error) {
        console.error("Add memo error:", error);
        showToast("메모 추가 중 오류가 발생했습니다.", "error");
    }
}

export async function deleteMemo(id) {
    if (!confirm('정말 이 메모를 삭제하시겠습니까?')) return;

    try {
        const { error } = await supabase.from("memos").delete().eq("id", id);

        if (error) throw error;

        showToast("메모가 삭제되었습니다.", "success");
        await fetchMemos();
    } catch (error) {
        console.error("Delete memo error:", error);
        showToast("메모 삭제 중 오류가 발생했습니다.", "error");
    }
}

export async function updateMemo(e) {
    if (e) e.preventDefault();

    const id = document.getElementById("editMemoId").value;
    const title = document.getElementById("editMemoTitle").value.trim();
    const content = document.getElementById("editMemoContent").value.trim();

    if (!content) {
        showToast("메모 내용을 입력해주세요.", "error");
        return;
    }

    const memoData = {
        title: title || "제목 없음",
        content: content,
        category: document.getElementById("editMemoCategory").value.trim() || null,
    };

    try {
        const { error } = await supabase
            .from("memos")
            .update(memoData)
            .eq("id", id);

        if (error) throw error;

        showToast("메모가 수정되었습니다!", "success");
        hideMemoModal();
        await fetchMemos();
    } catch (error) {
        console.error("Update memo error:", error);
        showToast("메모 수정 중 오류가 발생했습니다.", "error");
    }
}

export function renderMemos(memos) {
    elements.urlList.innerHTML = memos
        .map(
            (memo) => `
        <div class="url-item">
            <div class="url-item-header">
                <div class="url-item-content">
                    ${memo.category ? `<span class="url-item-category">${escapeHtml(memo.category)}</span>` : ''}
                    <div class="url-item-title">
                        <i class="bi bi-sticky-fill"></i>
                        ${escapeHtml(memo.title)}
                    </div>
                    <div class="memo-item-content-text collapsed" id="memo-content-${memo.id}">
                        ${escapeHtml(memo.content)}
                    </div>
                    <span class="memo-item-expand" onclick="toggleMemoContent('${memo.id}')">
                        더 보기
                    </span>
                </div>
                <div class="url-item-actions">
                    <button class="btn-icon edit" onclick="showEditMemoModal(${JSON.stringify(memo).replace(/"/g, "&quot;")})" title="수정">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteMemo('${memo.id}')" title="삭제">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
        )
        .join("");
}

export function toggleMemoContent(id) {
    const contentEl = document.getElementById(`memo-content-${id}`);
    const expandBtn = contentEl.nextElementSibling;
    
    if (contentEl.classList.contains('collapsed')) {
      contentEl.classList.remove('collapsed');
      expandBtn.textContent = '접기';
    } else {
      contentEl.classList.add('collapsed');
      expandBtn.textContent = '더 보기';
    }
}
