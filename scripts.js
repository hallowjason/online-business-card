const SHEET_ID = '1LMTaAiF-V-k7M4I-nFFVHBdGhrgvBcMldg39uhn70WM';
const SHEET_NAME = '表單回應 1';
const API_KEY = 'AIzaSyB9GfgAWI3ljgrEm3wl0VtKrXYVbGuv7ZI';
const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?alt=json&key=${API_KEY}`;

async function fetchSheetData() {
    const res = await fetch(API_URL);
    const data = await res.json();
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
    const [name, domain] = email.split('@');
    return name[0] + "***@" + domain;
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

async function loadSingleCard() {
    const params = new URLSearchParams(window.location.search);
    const userKey = params.get('user');
    const data = await fetchSheetData();
    const cardData = data.find(c => c.frontEmail.split('@')[0] === userKey);
    if (!cardData) {
        document.body.innerHTML = '<p>找不到該名片</p>';
        return;
    }
    // 主題套用
    document.body.classList.add(`theme-${cardData.styleId}`);
    // 前後內容
    document.getElementById('card-front').innerHTML = `
        <h2>${cardData.frontName}</h2>
        <p>電話：${cardData.frontPhone}</p>
        <p>Email：${maskEmail(cardData.frontEmail)}</p>
        <p>技能：${cardData.skills}</p>
    `;
    document.getElementById('card-back').innerHTML = `
        <h2>${cardData.backName}</h2>
        <p>電話：${cardData.backPhone}</p>
        <p>Email：${maskEmail(cardData.backEmail)}</p>
        ${cardData.customLink ? `<p><a href="${cardData.customLink}" target="_blank">自訂連結</a></p>` : ''}
    `;
    // SEO meta
    document.getElementById('page-title').textContent = `${cardData.frontName} - 名片`;
    // 翻轉事件
    document.getElementById('business-card').addEventListener('click', e => {
        e.currentTarget.classList.toggle('flipped');
    });
    // 分享與複製
    document.getElementById('share-btn').addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: `${cardData.frontName}的名片`,
                url: window.location.href
            });
        } else {
            alert('此瀏覽器不支援分享功能');
        }
    });
    document.getElementById('copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(`${cardData.frontName}\n${cardData.frontPhone}\n${cardData.frontEmail}`);
        alert('聯絡資訊已複製');
    });
}

