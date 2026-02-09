import { showToast } from './ui.js';

// ===== Utility Functions =====
export function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

export async function copyUrl(url) {
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

// ===== Fetch Page Title Helper =====
export async function fetchTitleForUrl(url) {
    // List of CORS proxies to try
    const proxies = [
        (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    ];

    for (const proxyFn of proxies) {
        try {
            const proxyUrl = proxyFn(url);
            const response = await fetch(proxyUrl, {
                method: 'GET',
                timeout: 5000
            });

            if (!response.ok) continue;

            let html;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                html = data.contents || data;
            } else {
                html = await response.text();
            }

            if (html) {
                // Parse HTML to extract title
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const title = doc.querySelector('title');

                if (title && title.textContent.trim()) {
                    return title.textContent.trim();
                }
            }
        } catch (error) {
            console.log('Proxy failed, trying next...', error);
            continue;
        }
    }

    // Fallback: use timestamp as index
    const now = new Date();
    return now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
}
