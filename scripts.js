const SHEET_ID = '1LMTaAiF-V-k7M4I-nFFVHBdGhrgvBcMldg39uhn70WM';    // Google試算表ID
const SHEET_NAME = '表單回應 1';                                       // 工作表名稱如「工作表1」，請依你的sheet實際名稱修改
const API_KEY = 'AIzaSyB9GfgAWI3ljgrEm3wl0VtKrXYVbGuv7ZI';                                     // <-- 填入你的API KEY

const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?alt=json&key=${API_KEY}`;

async function fetchCardData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const rows = data.values;
    const header = rows[0];
    const records = rows.slice(1);

    const listElem = document.getElementById('card-list');
    listElem.innerHTML = '';

    records.forEach(row => {
      const email = row[2];    // D欄 email（正面）
      const urlKey = email.split('@')[0];

      // 卡片元素
      const card = document.createElement('div');
      card.className = 'card-container';
      card.innerHTML = `
        <div class="card" onclick="this.classList.toggle('flipped')">
          <div class="front">
            <h2>${row[0]}</h2>
            <p>簡述：${row[8]}</p>
            <p>電話：${row[1]}</p>
            <p>Email：<span class="js-email">${maskEmail(email)}</span></p>
            <p>技能：${row[7]}</p>
            <button onclick="shareCard('${email}'); event.stopPropagation()">分享</button>
            <button onclick="copyText('${email}'); event.stopPropagation()">複製Email</button>
          </div>
          <div class="back">
            <h2>${row[4]}</h2>
            <p>電話：${row[5]}</p>
            <p>Email：<span class="js-email">${maskEmail(row[6])}</span></p>
            ${row[10] ? `<a href="${row[10]}" target="_blank">自訂連結</a>` : ''}
          </div>
        </div>
        <p style="text-align:center;">網址：https://hallowjason.github.io/online-business-card/${urlKey}</p>
      `;
      listElem.appendChild(card);
    });
  } catch (e) {
    document.getElementById('card-list').innerHTML =
      "資料讀取失敗，請確認Google試算表設定為公開，API KEY正確。<br>" + e;
  }
}

// Email混淆：防爬蟲
function maskEmail(email) {
  return email.replace(/@/, ' [at] ');
}

// 分享功能（Web Share API，僅部分瀏覽器支援）
function shareCard(email) {
  const urlKey = email.split('@')[0];
  const shareUrl = `https://hallowjason.github.io/online-business-card/${urlKey}`;
  if (navigator.share) {
    navigator.share({
      title: '分享名片',
      url: shareUrl,
    });
  } else {
    alert('此瀏覽器不支援App分享');
  }
}

// 複製功能
function copyText(text) {
  navigator.clipboard.writeText(text);
  alert('已複製Email');
}

// 頁面載入自動fetch資料
document.addEventListener('DOMContentLoaded', fetchCardData);
