// 設備方向偵測變數
let isOrientationSupported = false;
let lastOrientation = { alpha: 0, beta: 0, gamma: 0 };
let orientationInitialized = false;
const SHEET_ID = '1LMTaAiF-V-k7M4I-nFFVHBdGhrgvBcMldg39uhn70WM';
const SHEET_NAME = '表單回應 1';
const API_KEY = 'AIzaSyB9GfgAWI3ljgrEm3wl0VtKrXYVbGuv7ZI';
const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?alt=json&key=${API_KEY}`;

async function fetchSheetData() {
    const res = await fetch(API_URL);
    const data = await res.json();
    console.log('Google Sheets 取得資料：', data);
    const rows = data.values;
    return rows.slice(1).map(row => ({
        frontName: row[1],
        frontPhone: row[2],
        frontEmail: row[3],
        backName: row[4],
        backPhone: row[5],
        backEmail: row[6],
        skills: row[7],
        brief: row[8],
        styleId: row[9] || 'default',
        customLink: row[10] || ''
    }));
}

function maskEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) return '';
    const [name, domain] = email.split('@');
    return (name && name.length > 0 ? name[0] : '*') + "***@" + (domain || '');
}

// 更新金屬效果
function updateMetallicEffect(alpha, beta, gamma) {
    const card = document.getElementById('business-card');
    if (!card) return;
    
    // 將角度轉換為適合的漸層角度
    const metalAngle = ((alpha || 0) + 135) % 360;
    const reflectionAngle = ((gamma || 0) * 2 + 45) % 360;
    
    // 根據傾斜程度調整反光強度
    const intensity = Math.abs(beta || 0) / 90; // 0-1之間
    const reflection = Math.min(0.6, 0.2 + intensity * 0.4);
    
    // 更新CSS自定義屬性
    card.style.setProperty('--metal-angle', `${metalAngle}deg`);
    card.style.setProperty('--reflection-angle', `${reflectionAngle}deg`);
    card.style.setProperty('--reflection-opacity', reflection);
}

// 初始化設備方向偵測
async function ensureDeviceOrientationStarted() {
    if (orientationInitialized) return true;
    if (typeof DeviceOrientationEvent === 'undefined') return false;
    try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            const state = await DeviceOrientationEvent.requestPermission();
            if (state !== 'granted') {
                console.log('設備方向權限被拒絕');
                return false;
            }
        }
        startOrientationListening();
        orientationInitialized = true;
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

// 開始監聽設備方向
function startOrientationListening() {
    isOrientationSupported = true;
    
    window.addEventListener('deviceorientation', (event) => {
        const { alpha, beta, gamma } = event;
        
        // 防止過度更新，只在角度變化超過閾值時更新
        const threshold = 2;
        if (Math.abs((alpha || 0) - lastOrientation.alpha) > threshold ||
            Math.abs((beta || 0) - lastOrientation.beta) > threshold ||
            Math.abs((gamma || 0) - lastOrientation.gamma) > threshold) {
            
            lastOrientation = { alpha: alpha || 0, beta: beta || 0, gamma: gamma || 0 };
            updateMetallicEffect(alpha, beta, gamma);
        }
    });
    
    console.log('設備方向偵測已啟動');
}



async function fetchCardList() {
    const data = await fetchSheetData();
    const listElem = document.getElementById('card-list');
    listElem.innerHTML = '';
    data.forEach(card => {
        const urlKey = card.frontEmail.split('@')[0];
        const div = document.createElement('div');
        div.className = 'card-summary';
        div.innerHTML = `
            <h3>${card.frontName}</h3>
            <p>${card.brief}</p>
            <a href="card.html?user=${urlKey}">檢視名片</a>
        `;
        listElem.appendChild(div);
    });
}

async function loadCardData() {
    const params = new URLSearchParams(window.location.search);
    const userKey = params.get('user');
    const data = await fetchSheetData();
    const cardData = data.find(c => c.frontEmail && c.frontEmail.split('@')[0] === userKey);
    if (!cardData) {
        document.body.innerHTML = '<p style="color:white;text-align:center;margin-top:50px;">找不到該名片</p>';
        return;
    }
    // SEO meta
    const titleElem = document.getElementById('page-title');
    if (titleElem) titleElem.textContent = `${cardData.frontName} - 名片`;

    // 填入現有 DOM 結構
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value || ''; };
    setText('front-name', cardData.frontName);
    setText('front-phone', cardData.frontPhone);
    setText('front-email', maskEmail(cardData.frontEmail));
    setText('front-skills', cardData.skills);
    setText('front-brief', cardData.brief);
    setText('back-name', cardData.backName);
    setText('back-phone', cardData.backPhone);
    setText('back-email', maskEmail(cardData.backEmail));

    // 事件：翻轉 + iOS 權限 gate（第一次點擊同時請求）
    const card = document.getElementById('business-card');
    if (card) {
        card.addEventListener('click', async (e) => {
            e.currentTarget.classList.toggle('flipped');
            if (!orientationInitialized) {
                await ensureDeviceOrientationStarted();
            }
        });
        // 預設靜態反光透明度
        card.style.setProperty('--reflection-opacity', 0.45);
    }

    // 分享與複製
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: `${cardData.frontName}的名片`,
                    url: window.location.href
                });
            } else {
                alert('此瀏覽器不支援分享功能');
            }
        });
    }
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(`${cardData.frontName}\n${cardData.frontPhone}\n${cardData.frontEmail}`);
            alert('聯絡資訊已複製');
        });
    }

    // 音樂播放器
    const audio = document.getElementById('music-player');
    if (audio && typeof audio.load === 'function') audio.load();

    // 若資料指示採用金屬風格或 HTML 已有對應類別，則啟用動態反光（非 iOS 瀏覽器可即刻啟動）
    if (cardData.styleId === 'metallic' || document.querySelector('.business-card')) {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function') {
            ensureDeviceOrientationStarted();
        }
    }
}

// 自動啟動
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCardData);
} else {
    loadCardData();
}

