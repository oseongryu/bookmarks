import { elements } from './state.js';

// ===== UI Functions =====
export function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ===== Modal Functions =====
export function showLoginModal() {
    elements.loginModal.classList.add('show');
}

export function hideLoginModal() {
    elements.loginModal.classList.remove('show');
}

export function hideEditModal() {
    elements.editModal.classList.remove('show');
}

export function showEditModal(url) {
    document.getElementById('editUrlId').value = url.id;
    document.getElementById('editUrlTitle').value = url.title;
    document.getElementById('editUrlCategory').value = url.category || '';
    document.getElementById('editUrlAddress').value = url.url;
    document.getElementById('editUrlDescription').value = url.description || '';

    elements.editModal.classList.add('show');
}

export function showEditMemoModal(memo) {
    document.getElementById("editMemoId").value = memo.id;
    document.getElementById("editMemoTitle").value = memo.title;
    document.getElementById("editMemoContent").value = memo.content;
    document.getElementById("editMemoCategory").value = memo.category || "";
  
    elements.editMemoModal.classList.add("show");
}
  
export function hideMemoModal() {
    elements.editMemoModal.classList.remove("show");
}

export function showDuplicateModal() {
    elements.duplicateModal.classList.add('show');
    elements.duplicateLoading.classList.remove('d-none');
    elements.duplicateContent.classList.add('d-none');
}

export function hideDuplicateModal() {
    elements.duplicateModal.classList.remove('show');
}

export function showImportModal() {
    elements.importModal.classList.add('show');
}

export function hideImportModal() {
    elements.importModal.classList.remove('show');
}

export function showBulkDeleteModal() {
    elements.bulkDeleteModal.classList.add('show');
}

export function hideBulkDeleteModal() {
    elements.bulkDeleteModal.classList.remove('show');
}

// ===== Menu Functions =====
export function toggleUserMenu(e) {
    e.stopPropagation();
    // Close tools menu if open
    closeToolsMenu();
    elements.userDropdown.classList.toggle('show');
    elements.userMenuBtn.classList.toggle('active');
}

export function closeUserMenu() {
    elements.userDropdown.classList.remove('show');
    elements.userMenuBtn.classList.remove('active');
}

export function updateAccessKeyDisplay(currentAccessKey) {
    if (currentAccessKey) {
        elements.dropdownAccessKey.textContent = currentAccessKey;
    } else {
        elements.dropdownAccessKey.textContent = '-';
    }
}

export function toggleToolsMenu(e) {
    e.stopPropagation();
    // Close user menu if open
    closeUserMenu();
    elements.toolsDropdown.classList.toggle('show');
    elements.toolsMenuBtn.classList.toggle('active');
}

export function closeToolsMenu() {
    elements.toolsDropdown.classList.remove('show');
    elements.toolsMenuBtn.classList.remove('active');
}

// ===== Pagination Functions =====
export function updatePaginationUI(state) {
    const { totalCount, itemsPerPage, currentPage } = state;
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
