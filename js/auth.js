import { state, elements, AUTH_STORAGE_KEY } from './state.js';
import { updateAccessKeyDisplay, hideLoginModal, showLoginModal, showToast, closeUserMenu } from './ui.js';
import { loadUrls } from './urls.js';
import { loadMemos } from './memos.js';

// ===== Authentication Functions =====
export function checkAuth() {
    const authKey = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authKey) {
        state.currentAccessKey = authKey;
        return true;
    }
    return false;
}

export function handleLogin(e) {
    if (e) e.preventDefault();
    const inputKey = document.getElementById('loginKey').value.trim();

    if (inputKey) {
        state.currentAccessKey = inputKey;
        localStorage.setItem(AUTH_STORAGE_KEY, inputKey);
        updateAccessKeyDisplay(state.currentAccessKey);
        hideLoginModal();
        showToast('로그인 성공!', 'success');
        
        if (state.currentMode === 'url') {
            loadUrls();
        } else {
            loadMemos();
        }
        
        document.getElementById('loginKey').value = '';
    } else {
        showToast('액세스 키를 입력해주세요.', 'error');
    }
}

export function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        state.currentAccessKey = null;
        localStorage.removeItem(AUTH_STORAGE_KEY);
        closeUserMenu();
        showLoginModal();
        showToast('로그아웃 되었습니다.', 'success');
        
        // Clear state
        state.totalCount = 0;
        state.currentPage = 1;
        state.searchQuery = '';
        elements.urlList.innerHTML = '';
        elements.emptyState.classList.add('d-none');
        elements.paginationNav.classList.add('d-none');
    }
}
