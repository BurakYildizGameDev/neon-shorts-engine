// src/ui/app.js
import { getModeInstance, GAME_MODES } from '../modes/ModeManager.js';
import { FileSystemSync } from '../exporter/FileSystemSync.js';
import { i18n } from '../i18n/i18n.js';

// Ülke Veritabanı (Devlet Seçimi)
export const COUNTRIES = [
    { id: 'tr', name: 'TÜRKİYE', flag: '🇹🇷', color: '#e30a17', accent: '#ffffff' },
    { id: 'br', name: 'BREZİLYA', flag: '🇧🇷', color: '#009c3b', accent: '#ffdf00' },
    { id: 'az', name: 'AZERBAYCAN', flag: '🇦🇿', color: '#00b9e4', accent: '#ed1b24' },
    { id: 'us', name: 'ABD', flag: '🇺🇸', color: '#0052b4', accent: '#d80027' },
    { id: 'de', name: 'ALMANYA', flag: '🇩🇪', color: '#ffcc00', accent: '#dd0000' },
    { id: 'jp', name: 'JAPONYA', flag: '🇯🇵', color: '#bc002d', accent: '#ffffff' },
    { id: 'ar', name: 'ARJANTİN', flag: '🇦🇷', color: '#74acdf', accent: '#ffffff' },
    { id: 'fr', name: 'FRANSA', flag: '🇫🇷', color: '#002395', accent: '#ed2939' },
    { id: 'gb', name: 'İNGİLTERE', flag: '🇬🇧', color: '#012169', accent: '#c8102e' },
    { id: 'it', name: 'İTALYA', flag: '🇮🇹', color: '#009246', accent: '#ce2b37' },
    { id: 'es', name: 'İSPANYA', flag: '🇪🇸', color: '#c60b1e', accent: '#ffc400' },
    { id: 'kr', name: 'GÜNEY KORE', flag: '🇰🇷', color: '#0f4c81', accent: '#cd2e3a' },
    { id: 'pt', name: 'PORTEKİZ', flag: '🇵🇹', color: '#006600', accent: '#ff0000' },
    { id: 'mx', name: 'MEKSİKA', flag: '🇲🇽', color: '#006847', accent: '#ce1126' }
];

// DOM Elemanları
const badgeNeon = document.getElementById('badgeNeon');
const subtitleText = document.getElementById('subtitleText');
const selectLanguage = document.getElementById('selectLanguage');

const modeButtons = document.querySelectorAll('.btn-mode');
const sectionFactions = document.getElementById('sectionFactions');
const selectFactionFormat = document.getElementById('selectFactionFormat');
const customNamesBox = document.getElementById('customNamesBox');
const inputCustomNames = document.getElementById('inputCustomNames');

const countryPickers2 = document.getElementById('countryPickers2');
const countryPickers4 = document.getElementById('countryPickers4');
const countrySelect1 = document.getElementById('countrySelect1');
const countrySelect2 = document.getElementById('countrySelect2');
const countrySelect4_1 = document.getElementById('countrySelect4_1');
const countrySelect4_2 = document.getElementById('countrySelect4_2');
const countrySelect4_3 = document.getElementById('countrySelect4_3');
const countrySelect4_4 = document.getElementById('countrySelect4_4');

const selectParallelWorkers = document.getElementById('selectParallelWorkers');

const inputDay = document.getElementById('inputDay');
const btnPrevDay = document.getElementById('btnPrevDay');
const btnNextDay = document.getElementById('btnNextDay');

const btnSelectFolder = document.getElementById('btnSelectFolder');
const folderStatus = document.getElementById('folderStatus');
const btnStartRender = document.getElementById('btnStartRender');
const btnBatchRender = document.getElementById('btnBatchRender');
const btnTogglePreview = document.getElementById('btnTogglePreview');

const progressContainer = document.getElementById('progressContainer');
const progressStatusLabel = document.getElementById('progressStatusLabel');
const progressPercent = document.getElementById('progressPercent');
const progressBarFill = document.getElementById('progressBarFill');
const progressFrameCounter = document.getElementById('progressFrameCounter');

const previewCanvas = document.getElementById('previewCanvas');

// Durum Değişkenleri
let currentMode = 'territory';
let currentDay = 1;
let chosenDirectoryHandle = null;
let isPreviewRunning = true;
let previewModeInstance = null;
let previewFrameCount = 0;
let previewAnimId = null;

// Ülke Seçim Kutularını Doldur
function populateCountryOptions(selectElem, defaultId) {
    if (!selectElem) return;
    selectElem.innerHTML = '';
    COUNTRIES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.flag} ${c.name}`;
        if (c.id === defaultId) opt.selected = true;
        selectElem.appendChild(opt);
    });
}

function initCountryPickers() {
    populateCountryOptions(countrySelect1, 'tr');
    populateCountryOptions(countrySelect2, 'br');

    populateCountryOptions(countrySelect4_1, 'tr');
    populateCountryOptions(countrySelect4_2, 'br');
    populateCountryOptions(countrySelect4_3, 'us');
    populateCountryOptions(countrySelect4_4, 'de');
}

// Seçili Ülkeleri/Takımları Çek
function getSelectedTeams() {
    const format = selectFactionFormat.value;

    if (format === 'countries_2') {
        const c1 = COUNTRIES.find(c => c.id === countrySelect1.value) || COUNTRIES[0];
        const c2 = COUNTRIES.find(c => c.id === countrySelect2.value) || COUNTRIES[1];
        return [
            { id: c1.id, name: c1.name, flag: c1.flag, color: c1.color, accent: c1.accent, score: 0 },
            { id: c2.id, name: c2.name, flag: c2.flag, color: c2.color, accent: c2.accent, score: 0 }
        ];
    } else if (format === 'countries_4') {
        const c1 = COUNTRIES.find(c => c.id === countrySelect4_1.value) || COUNTRIES[0];
        const c2 = COUNTRIES.find(c => c.id === countrySelect4_2.value) || COUNTRIES[1];
        const c3 = COUNTRIES.find(c => c.id === countrySelect4_3.value) || COUNTRIES[3];
        const c4 = COUNTRIES.find(c => c.id === countrySelect4_4.value) || COUNTRIES[4];
        return [
            { id: c1.id, name: c1.name, flag: c1.flag, color: c1.color, accent: c1.accent, score: 0 },
            { id: c2.id, name: c2.name, flag: c2.flag, color: c2.color, accent: c2.accent, score: 0 },
            { id: c3.id, name: c3.name, flag: c3.flag, color: c3.color, accent: c3.accent, score: 0 },
            { id: c4.id, name: c4.name, flag: c4.flag, color: c4.color, accent: c4.accent, score: 0 }
        ];
    } else if (format === 'superlig_4') {
        return [
            { id: 'gs', name: 'GALATASARAY', flag: '🦁', color: '#ffb700', accent: '#a6192e', score: 0 },
            { id: 'fb', name: 'FENERBAHÇE', flag: '🟡', color: '#002d72', accent: '#ffe600', score: 0 },
            { id: 'bjk', name: 'BEŞİKTAŞ', flag: '🦅', color: '#ffffff', accent: '#111111', score: 0 },
            { id: 'ts', name: 'TRABZONSPOR', flag: '🌊', color: '#800020', accent: '#00bfff', score: 0 }
        ];
    } else if (format === 'ucl_4') {
        return [
            { id: 'rma', name: 'REAL MADRID', flag: '👑', color: '#ffffff', accent: '#e5a823', score: 0 },
            { id: 'bar', name: 'BARCELONA', flag: '🔵', color: '#a50044', accent: '#004d98', score: 0 },
            { id: 'mci', name: 'MAN CITY', flag: '⚡', color: '#6cabdd', accent: '#1c2c5b', score: 0 },
            { id: 'bay', name: 'BAYERN MÜNİH', flag: '🔴', color: '#dc052d', accent: '#ffffff', score: 0 }
        ];
    } else if (format === 'custom_names') {
        const raw = inputCustomNames.value || 'Ahmet, Mehmet, Can, Ali';
        const names = raw.split(',').map(s => s.trim()).filter(Boolean);
        const colors = ['#ff0055', '#00f0ff', '#ffd700', '#00ff88', '#a855f7', '#ff7700', '#ec4899', '#38bdf8'];
        const emojis = ['⚡', '🔥', '👑', '💎', '🚀', '🎯', '⭐', '💥'];

        return names.slice(0, 4).map((name, idx) => ({
            id: `usr_${idx}`,
            name: name.toUpperCase(),
            flag: emojis[idx % emojis.length],
            color: colors[idx % colors.length],
            accent: '#ffffff',
            score: 0
        }));
    }

    // Klasik 2 Renk Düello
    return [
        { id: 'red', name: 'RED TEAM', flag: '🔴', color: '#ff0055', accent: '#ffffff', score: 0 },
        { id: 'blue', name: 'BLUE TEAM', flag: '🔵', color: '#00d2ff', accent: '#ffffff', score: 0 }
    ];
}

// --- 1. Dil Güncelleme Sistemi (i18n) ---
function applyLanguage() {
    if (badgeNeon) badgeNeon.innerText = i18n.t('badge');
    if (subtitleText) subtitleText.innerText = i18n.t('subtitle');

    // Bölüm Başlıkları
    const titles = document.querySelectorAll('.section-title');
    if (titles[0]) titles[0].innerText = i18n.t('gameType');
    if (titles[1]) titles[1].innerText = i18n.t('teamSelection');
    if (titles[2]) titles[2].innerText = i18n.t('daySeed');
    if (titles[3]) titles[3].innerText = i18n.t('renderSpeedTitle');

    // Mod Butonları
    modeButtons.forEach(btn => {
        const mId = btn.dataset.mode;
        const titleEl = btn.querySelector('.mode-title');
        const subEl = btn.querySelector('.mode-sub');
        if (titleEl) titleEl.innerText = i18n.t(`modes.${mId}.title`);
        if (subEl) subEl.innerText = i18n.t(`modes.${mId}.sub`);
    });

    // Faction Format Seçenekleri
    if (selectFactionFormat) {
        Array.from(selectFactionFormat.options).forEach(opt => {
            const trans = i18n.t(`formats.${opt.value}`);
            if (trans && !trans.startsWith('formats.')) opt.innerText = trans;
        });
    }

    // Butonlar
    btnStartRender.innerText = i18n.t('renderBtn', { mode: currentMode.toUpperCase() });
    btnBatchRender.innerText = i18n.t('batchBtn');
    btnTogglePreview.innerText = isPreviewRunning ? i18n.t('pausePreview') : i18n.t('resumePreview');
    btnSelectFolder.innerText = i18n.t('selectFolder');
    if (!chosenDirectoryHandle) folderStatus.innerText = i18n.t('folderNotSelected');
}

// --- 2. Başlangıç Kurulumu ---
function init() {
    initCountryPickers();
    applyLanguage();
    updateModeUI();
    resetLivePreview();
    startLivePreview();
}

function updateModeUI() {
    modeButtons.forEach(btn => {
        if (btn.dataset.mode === currentMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (currentMode === 'territory') {
        sectionFactions.style.display = 'flex';
    } else {
        sectionFactions.style.display = 'none';
    }

    btnStartRender.innerText = i18n.t('renderBtn', { mode: currentMode.toUpperCase() });
}

// --- 3. Canlı Önizleme Döngüsü ---
function resetLivePreview() {
    const options = (currentMode === 'territory') 
        ? { teams: getSelectedTeams(), lang: i18n.getLanguage() } 
        : { lang: i18n.getLanguage() };
    previewModeInstance = getModeInstance(currentMode, currentDay, options);
    previewFrameCount = 0;
}

function startLivePreview() {
    const ctx = previewCanvas.getContext('2d');
    const DT = 1 / 60;

    function loop() {
        if (isPreviewRunning && previewModeInstance) {
            const currentTime = (previewFrameCount % 1680) * DT;

            previewModeInstance.update(currentTime, DT, null);
            previewModeInstance.render(ctx, currentTime);

            previewFrameCount++;
            if (previewFrameCount >= 1680) {
                resetLivePreview(); // 28 saniyede bir başa sar
            }
        }
        previewAnimId = requestAnimationFrame(loop);
    }

    loop();
}

// --- 4. Kullanıcı Etkileşimleri ---
if (selectLanguage) {
    selectLanguage.addEventListener('change', () => {
        i18n.setLanguage(selectLanguage.value);
        applyLanguage();
        resetLivePreview();
    });
}

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        currentMode = btn.dataset.mode;
        updateModeUI();
        resetLivePreview();
    });
});

selectFactionFormat.addEventListener('change', () => {
    const val = selectFactionFormat.value;
    if (val === 'countries_2') {
        countryPickers2.classList.remove('hidden');
        countryPickers4.classList.add('hidden');
        customNamesBox.classList.add('hidden');
    } else if (val === 'countries_4') {
        countryPickers2.classList.add('hidden');
        countryPickers4.classList.remove('hidden');
        customNamesBox.classList.add('hidden');
    } else if (val === 'custom_names') {
        countryPickers2.classList.add('hidden');
        countryPickers4.classList.add('hidden');
        customNamesBox.classList.remove('hidden');
    } else {
        countryPickers2.classList.add('hidden');
        countryPickers4.classList.add('hidden');
        customNamesBox.classList.add('hidden');
    }
    resetLivePreview();
});

inputCustomNames.addEventListener('input', () => resetLivePreview());

[countrySelect1, countrySelect2, countrySelect4_1, countrySelect4_2, countrySelect4_3, countrySelect4_4].forEach(sel => {
    if (sel) {
        sel.addEventListener('change', () => resetLivePreview());
    }
});

btnPrevDay.addEventListener('click', () => {
    if (currentDay > 1) {
        currentDay--;
        inputDay.value = currentDay;
        resetLivePreview();
    }
});

btnNextDay.addEventListener('click', () => {
    currentDay++;
    inputDay.value = currentDay;
    resetLivePreview();
});

inputDay.addEventListener('change', () => {
    let val = parseInt(inputDay.value, 10);
    if (isNaN(val)) val = 1;
    currentDay = Math.max(1, val);
    inputDay.value = currentDay;
    resetLivePreview();
});

btnTogglePreview.addEventListener('click', () => {
    isPreviewRunning = !isPreviewRunning;
    btnTogglePreview.innerText = isPreviewRunning 
        ? i18n.t('pausePreview') 
        : i18n.t('resumePreview');
});

// User Gesture ile Doğrudan Klasör Seçimi
btnSelectFolder.addEventListener('click', async () => {
    try {
        if ('showDirectoryPicker' in window) {
            chosenDirectoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            folderStatus.innerText = `${i18n.t('folderSelected')} ${chosenDirectoryHandle.name} ✓`;
            folderStatus.style.color = '#00ff88';
        } else {
            folderStatus.innerText = 'DirectoryPicker not supported, direct download active.';
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Klasör seçim hatası:', err);
        }
    }
});

// --- 5. WebCodecs Video Render Yöneticisi ---
async function renderVideo(day, mode) {
    return new Promise((resolve, reject) => {
        progressContainer.classList.remove('hidden');
        progressStatusLabel.innerText = i18n.t('renderingStatus', { mode: mode.toUpperCase(), day });
        progressPercent.innerText = '0%';
        progressBarFill.style.width = '0%';
        progressFrameCounter.innerText = '0 / 1680 Kare';

        btnStartRender.disabled = true;
        btnBatchRender.disabled = true;

        const options = (mode === 'territory') 
            ? { teams: getSelectedTeams(), lang: i18n.getLanguage() } 
            : { lang: i18n.getLanguage() };

        // Taze Worker ayağa kaldır
        const worker = new Worker(new URL('../exporter/RenderWorker.js', import.meta.url), { type: 'module' });

        worker.onmessage = async (e) => {
            const data = e.data;

            if (data.type === 'PROGRESS') {
                progressPercent.innerText = `${data.percent}%`;
                progressBarFill.style.width = `${data.percent}%`;
                progressFrameCounter.innerText = `${data.currentFrame} / ${data.totalFrames} Kare`;
            } else if (data.type === 'COMPLETE') {
                progressStatusLabel.innerText = i18n.t('savingStatus', { day });

                await FileSystemSync.saveVideo(chosenDirectoryHandle, day, data.buffer);
                if (data.metadata) {
                    await FileSystemSync.saveMetadata(chosenDirectoryHandle, day, data.metadata.fullText);
                }

                progressStatusLabel.innerText = i18n.t('completeStatus', { day });
                progressBarFill.style.width = '100%';

                worker.terminate();

                btnStartRender.disabled = false;
                btnBatchRender.disabled = false;
                resolve();
            } else if (data.type === 'ERROR') {
                console.error('[Render Hatası]:', data.error);
                progressStatusLabel.innerText = `HATA: ${data.error}`;
                worker.terminate();
                btnStartRender.disabled = false;
                btnBatchRender.disabled = false;
                reject(new Error(data.error));
            }
        };

        worker.postMessage({
            type: 'START',
            day,
            modeId: mode,
            options
        });
    });
}

// Tek Video Render
btnStartRender.addEventListener('click', async () => {
    try {
        await renderVideo(currentDay, currentMode);
    } catch (err) {
        alert('Render hatası: ' + err.message);
    }
});

// Toplu Paket Render (Multi-Worker Paralel Havuz)
btnBatchRender.addEventListener('click', async () => {
    const startDay = currentDay;
    const endDay = startDay + 6;
    const concurrency = parseInt(selectParallelWorkers.value, 10) || 1;

    if (!confirm(`Gün ${startDay}'den Gün ${endDay}'ye kadar 7 video ${concurrency}x paralel motorla üretilecek. Onaylıyor musunuz?`)) {
        return;
    }

    try {
        const days = [];
        for (let d = startDay; d <= endDay; d++) days.push(d);

        let index = 0;
        const total = days.length;

        async function workerTask() {
            while (index < total) {
                const dayToRender = days[index++];
                currentDay = dayToRender;
                inputDay.value = dayToRender;
                resetLivePreview();
                await renderVideo(dayToRender, currentMode);
            }
        }

        const pool = [];
        const activeWorkers = Math.min(concurrency, total);
        for (let i = 0; i < activeWorkers; i++) {
            pool.push(workerTask());
        }

        await Promise.all(pool);
        alert(`Tebrikler! ${total} adet video ${concurrency}x Multi-Worker havuzuyla başarıyla üretildi ve diske kaydedildi.`);
    } catch (err) {
        alert('Toplu render durduruldu: ' + err.message);
    }
});

init();
