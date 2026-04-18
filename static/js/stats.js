import { supabase } from './supabaseClient.js';

const els = {
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    siteFilter: document.getElementById('siteFilter'),
    eventTypeFilter: document.getElementById('eventTypeFilter'),
    applyBtn: document.getElementById('applyFilterBtn'),
    loading: document.getElementById('loadingSpinner'),
    content: document.getElementById('statsContent'),
    empty: document.getElementById('emptyState'),
    summaryTotal: document.getElementById('summaryTotal'),
    summaryDays: document.getElementById('summaryDays'),
    summaryAvg: document.getElementById('summaryAvg'),
    summaryMax: document.getElementById('summaryMax'),
    chart: document.getElementById('dailyChart'),
    tableBody: document.querySelector('#dailyTable tbody'),
    tableHead: document.querySelector('#dailyTable thead tr'),
    tabs: document.querySelectorAll('.stats-tab'),
    views: {
        daily: document.getElementById('view-daily'),
        hourly: document.getElementById('view-hourly'),
        bySite: document.getElementById('view-bySite')
    },
    heatmapHead: document.querySelector('#hourlyHeatmap thead'),
    heatmapBody: document.querySelector('#hourlyHeatmap tbody'),
    siteTableHead: document.querySelector('#siteTable thead tr'),
    siteTableBody: document.querySelector('#siteTable tbody'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

function toast(msg) {
    els.toastMessage.textContent = msg;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 2500);
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function toDateInput(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateKey(isoString) {
    return toDateInput(new Date(isoString));
}

function initDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    els.startDate.value = toDateInput(start);
    els.endDate.value = toDateInput(end);
}

async function populateFilterOptions() {
    const { data, error } = await supabase
        .from('page_events')
        .select('site, event_type')
        .limit(5000);

    if (error) {
        console.error('필터 옵션 로드 실패:', error);
        return;
    }

    const sites = [...new Set(data.map(r => r.site).filter(Boolean))].sort();
    const types = [...new Set(data.map(r => r.event_type).filter(Boolean))].sort();

    for (const s of sites) {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        els.siteFilter.appendChild(opt);
    }
    for (const t of types) {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        els.eventTypeFilter.appendChild(opt);
    }
}

async function loadStats() {
    const start = els.startDate.value;
    const end = els.endDate.value;
    if (!start || !end) {
        toast('날짜를 선택해주세요');
        return;
    }
    if (start > end) {
        toast('시작일이 종료일보다 이후입니다');
        return;
    }

    els.loading.classList.remove('d-none');
    els.content.classList.add('d-none');
    els.empty.classList.add('d-none');

    const startIso = new Date(`${start}T00:00:00`).toISOString();
    const endLocal = new Date(`${end}T00:00:00`);
    endLocal.setDate(endLocal.getDate() + 1);
    const endIso = endLocal.toISOString();

    let query = supabase
        .from('page_events')
        .select('event_type, created_at, site')
        .gte('created_at', startIso)
        .lt('created_at', endIso)
        .order('created_at', { ascending: true });

    const site = els.siteFilter.value;
    const eventType = els.eventTypeFilter.value;
    if (site) query = query.eq('site', site);
    if (eventType) query = query.eq('event_type', eventType);

    const { data, error } = await query.limit(50000);

    els.loading.classList.add('d-none');

    if (error) {
        toast('조회 실패: ' + error.message);
        return;
    }

    if (!data || data.length === 0) {
        els.empty.classList.remove('d-none');
        return;
    }

    const dates = buildDateRange(start, end);
    renderDaily(data, dates);
    renderHourly(data, dates);
    renderBySite(data, dates);
    els.content.classList.remove('d-none');
}

function buildDateRange(start, end) {
    const result = [];
    const cur = new Date(`${start}T00:00:00`);
    const last = new Date(`${end}T00:00:00`);
    while (cur <= last) {
        result.push(toDateInput(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return result;
}

function renderDaily(rows, dates) {
    const typesSet = new Set();
    const byDate = new Map();

    for (const d of dates) byDate.set(d, { total: 0, byType: {} });

    for (const r of rows) {
        const key = formatDateKey(r.created_at);
        if (!byDate.has(key)) continue;
        const slot = byDate.get(key);
        slot.total += 1;
        const t = r.event_type || 'unknown';
        typesSet.add(t);
        slot.byType[t] = (slot.byType[t] || 0) + 1;
    }

    const types = [...typesSet].sort();
    const counts = dates.map(d => byDate.get(d).total);
    const total = counts.reduce((a, b) => a + b, 0);
    const activeDays = counts.filter(c => c > 0).length;
    const avg = activeDays > 0 ? (total / activeDays).toFixed(1) : 0;
    const max = counts.length > 0 ? Math.max(...counts) : 0;

    els.summaryTotal.textContent = total.toLocaleString();
    els.summaryDays.textContent = activeDays;
    els.summaryAvg.textContent = avg;
    els.summaryMax.textContent = max.toLocaleString();

    renderChart(dates, counts, max);
    renderDailyTable(dates, byDate, types);
}

function renderChart(dates, counts, max) {
    els.chart.innerHTML = '';
    const safeMax = max > 0 ? max : 1;
    for (let i = 0; i < dates.length; i++) {
        const bar = document.createElement('div');
        bar.className = 'stats-bar';
        const height = (counts[i] / safeMax) * 100;
        bar.innerHTML = `
            <div class="stats-bar-value">${counts[i]}</div>
            <div class="stats-bar-fill" style="height:${height}%"></div>
            <div class="stats-bar-label">${dates[i].slice(5)}</div>
        `;
        bar.title = `${dates[i]}: ${counts[i]}`;
        els.chart.appendChild(bar);
    }
}

function renderDailyTable(dates, byDate, types) {
    els.tableHead.innerHTML = '<th>날짜</th><th>총 이벤트</th>' +
        types.map(t => `<th>${escapeHtml(t)}</th>`).join('');

    const rows = [];
    for (let i = dates.length - 1; i >= 0; i--) {
        const d = dates[i];
        const slot = byDate.get(d);
        const typeCells = types.map(t => `<td>${slot.byType[t] || 0}</td>`).join('');
        rows.push(`<tr><td>${d}</td><td><strong>${slot.total}</strong></td>${typeCells}</tr>`);
    }
    els.tableBody.innerHTML = rows.join('');
}

function renderHourly(rows, dates) {
    const matrix = new Map();
    for (const d of dates) matrix.set(d, new Array(24).fill(0));

    let max = 0;
    for (const r of rows) {
        const dt = new Date(r.created_at);
        const key = toDateInput(dt);
        const hourArr = matrix.get(key);
        if (!hourArr) continue;
        const h = dt.getHours();
        hourArr[h] += 1;
        if (hourArr[h] > max) max = hourArr[h];
    }

    const headCells = ['<th></th>'];
    for (let h = 0; h < 24; h++) headCells.push(`<th>${pad2(h)}</th>`);
    els.heatmapHead.innerHTML = `<tr>${headCells.join('')}</tr>`;

    const bodyRows = [];
    for (let i = dates.length - 1; i >= 0; i--) {
        const d = dates[i];
        const arr = matrix.get(d);
        const cells = arr.map((v, h) => {
            const level = levelFor(v, max);
            const display = v > 0 ? v : '';
            return `<td class="heatmap-cell" data-level="${level}" title="${d} ${pad2(h)}시: ${v}">${display}</td>`;
        }).join('');
        bodyRows.push(`<tr><th>${d.slice(5)}</th>${cells}</tr>`);
    }
    els.heatmapBody.innerHTML = bodyRows.join('');
}

function levelFor(value, max) {
    if (value <= 0 || max <= 0) return 0;
    const ratio = value / max;
    if (ratio > 0.75) return 4;
    if (ratio > 0.5) return 3;
    if (ratio > 0.25) return 2;
    return 1;
}

function renderBySite(rows, dates) {
    const bySite = new Map();

    for (const r of rows) {
        const site = r.site || '(unknown)';
        const key = formatDateKey(r.created_at);
        if (!dates.includes(key)) continue;
        if (!bySite.has(site)) {
            bySite.set(site, { total: 0, byDate: Object.fromEntries(dates.map(d => [d, 0])) });
        }
        const slot = bySite.get(site);
        slot.total += 1;
        slot.byDate[key] += 1;
    }

    const dateCols = dates.slice().reverse();
    els.siteTableHead.innerHTML = '<th>사이트</th><th>합계</th>' +
        dateCols.map(d => `<th>${d.slice(5)}</th>`).join('');

    const sorted = [...bySite.entries()].sort((a, b) => b[1].total - a[1].total);
    const trs = sorted.map(([site, slot]) => {
        const cells = dateCols.map(d => {
            const v = slot.byDate[d] || 0;
            return `<td>${v || ''}</td>`;
        }).join('');
        return `<tr><td class="site-name" title="${escapeHtml(site)}">${escapeHtml(site)}</td><td><strong>${slot.total}</strong></td>${cells}</tr>`;
    });
    els.siteTableBody.innerHTML = trs.join('');
}

function switchView(name) {
    for (const tab of els.tabs) {
        tab.classList.toggle('active', tab.dataset.view === name);
    }
    for (const [key, node] of Object.entries(els.views)) {
        node.classList.toggle('d-none', key !== name);
    }
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

document.addEventListener('DOMContentLoaded', async () => {
    initDefaultDates();
    await populateFilterOptions();
    els.applyBtn.addEventListener('click', loadStats);
    for (const tab of els.tabs) {
        tab.addEventListener('click', () => switchView(tab.dataset.view));
    }
    loadStats();
});
