/* 教學用 SVG 圖解（純向量、自足、可縮放、印刷清晰）
   由 build-ebook.js 引用。所有輸出皆為合法 XML（標籤自閉合、含 xmlns）。
   配色沿用網站主題：紅 #9E2B25、金 #A8791C、玉 #2f7d6e、墨 #333。 */

const RED = '#9E2B25', GOLD = '#A8791C', JADE = '#2f7d6e', INK = '#333', LINE = '#d8cdb8';

/* 五種聲調曲線圖：以趙元任「五度標調」畫出調型，配例字。 */
function toneCurves() {
  // [名稱, 例字, 調值序列(1低~5高), 說明]
  const tones = [
    ['一聲', '媽', [5, 5], '高平'],
    ['二聲', '麻', [3, 5], '上揚'],
    ['三聲', '馬', [2, 1, 4], '降升'],
    ['四聲', '罵', [5, 1], '下降'],
    ['輕聲', '嗎', [2], '短促'],
  ];
  const panelW = 104, panelH = 132, gap = 6, padTop = 26, gridH = 74, gridW = 76, padL = 16;
  const total = tones.length;
  const W = total * panelW + (total - 1) * gap + 8;
  const H = panelH + 22;
  const y = lv => padTop + gridH - ((lv - 1) / 4) * gridH; // 調值1~5 -> y
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="五種聲調的調型曲線圖" style="width:100%;max-width:560px;height:auto;display:block;margin:10px auto">`;
  out += `<rect x="0" y="0" width="${W}" height="${H}" fill="#fffdf7" stroke="${LINE}" rx="10"/>`;
  tones.forEach((t, i) => {
    const ox = 4 + i * (panelW + gap);
    // 五條調值格線
    for (let lv = 1; lv <= 5; lv++) {
      const yy = y(lv);
      out += `<line x1="${ox + padL}" y1="${yy}" x2="${ox + padL + gridW}" y2="${yy}" stroke="${LINE}" stroke-width="1" stroke-dasharray="${lv === 1 || lv === 5 ? '0' : '3 3'}"/>`;
    }
    // 名稱與例字
    out += `<text x="${ox + panelW / 2}" y="18" text-anchor="middle" font-size="15" font-weight="700" fill="${RED}">${t[0]}</text>`;
    // 調型曲線
    const seq = t[2];
    const step = seq.length > 1 ? gridW / (seq.length - 1) : 0;
    if (seq.length === 1) {
      // 輕聲：一個短點
      const cx = ox + padL + gridW / 2, cy = y(seq[0]);
      out += `<circle cx="${cx}" cy="${cy}" r="5" fill="${GOLD}"/>`;
    } else {
      const pts = seq.map((lv, k) => `${(ox + padL + k * step).toFixed(1)},${y(lv).toFixed(1)}`).join(' ');
      out += `<polyline points="${pts}" fill="none" stroke="${GOLD}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
      // 箭頭在終點
      const n = seq.length;
      const ex = ox + padL + (n - 1) * step, ey = y(seq[n - 1]);
      const px = ox + padL + (n - 2) * step, py = y(seq[n - 2]);
      const ang = Math.atan2(ey - py, ex - px);
      const a1 = ang + Math.PI * 0.82, a2 = ang - Math.PI * 0.82;
      out += `<polyline points="${(ex + 7 * Math.cos(a1)).toFixed(1)},${(ey + 7 * Math.sin(a1)).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)} ${(ex + 7 * Math.cos(a2)).toFixed(1)},${(ey + 7 * Math.sin(a2)).toFixed(1)}" fill="none" stroke="${GOLD}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    // 例字與說明
    out += `<text x="${ox + panelW / 2}" y="${padTop + gridH + 22}" text-anchor="middle" font-size="18" font-weight="700" fill="${INK}">${t[1]}</text>`;
    out += `<text x="${ox + panelW / 2}" y="${padTop + gridH + 38}" text-anchor="middle" font-size="11" fill="#888">${t[3]}</text>`;
  });
  out += `</svg>`;
  return out;
}

/* 拼音結構圖：聲母 + 韻母 + 聲調 → 字 */
function pinStructure() {
  const W = 520, H = 96;
  const box = (x, label, sub, color) =>
    `<rect x="${x}" y="26" width="96" height="46" rx="9" fill="#fffdf7" stroke="${color}" stroke-width="1.6"/>` +
    `<text x="${x + 48}" y="50" text-anchor="middle" font-size="17" font-weight="700" fill="${color}">${label}</text>` +
    `<text x="${x + 48}" y="66" text-anchor="middle" font-size="11" fill="#888">${sub}</text>`;
  const plus = x => `<text x="${x}" y="55" text-anchor="middle" font-size="22" fill="#aaa">＋</text>`;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="拼音結構：聲母加韻母加聲調等於一個字" style="width:100%;max-width:520px;height:auto;display:block;margin:10px auto">`;
  out += `<rect x="0" y="0" width="${W}" height="${H}" fill="none"/>`;
  out += box(8, 'ㄇ', '聲母', RED) + plus(122);
  out += box(140, 'ㄚ', '韻母', JADE) + plus(254);
  out += box(272, 'ˊ', '聲調', GOLD);
  out += `<text x="400" y="55" text-anchor="middle" font-size="22" fill="#aaa">＝</text>`;
  out += `<rect x="428" y="22" width="84" height="54" rx="9" fill="${RED}"/><text x="470" y="52" text-anchor="middle" font-size="24" font-weight="700" fill="#fff">麻</text><text x="470" y="70" text-anchor="middle" font-size="11" fill="#f6e4c9">ㄇㄚˊ</text>`;
  out += `</svg>`;
  return out;
}

/* 六書：形聲與會意的結構示意 */
function liushu() {
  const W = 520, H = 150;
  const split = (ox, oy, title, a, aLab, b, bLab, whole, wLab) => {
    let s = `<text x="${ox + 118}" y="${oy + 2}" text-anchor="middle" font-size="13" font-weight="700" fill="${RED}">${title}</text>`;
    s += `<rect x="${ox}" y="${oy + 12}" width="60" height="52" rx="8" fill="#fffdf7" stroke="${JADE}" stroke-width="1.6"/><text x="${ox + 30}" y="${oy + 44}" text-anchor="middle" font-size="26" font-weight="700" fill="${JADE}">${a}</text><text x="${ox + 30}" y="${oy + 78}" text-anchor="middle" font-size="11" fill="#888">${aLab}</text>`;
    s += `<text x="${ox + 78}" y="${oy + 44}" text-anchor="middle" font-size="20" fill="#aaa">＋</text>`;
    s += `<rect x="${ox + 96}" y="${oy + 12}" width="60" height="52" rx="8" fill="#fffdf7" stroke="${GOLD}" stroke-width="1.6"/><text x="${ox + 126}" y="${oy + 44}" text-anchor="middle" font-size="26" font-weight="700" fill="${GOLD}">${b}</text><text x="${ox + 126}" y="${oy + 78}" text-anchor="middle" font-size="11" fill="#888">${bLab}</text>`;
    s += `<text x="${ox + 174}" y="${oy + 44}" text-anchor="middle" font-size="20" fill="#aaa">→</text>`;
    s += `<rect x="${ox + 192}" y="${oy + 12}" width="52" height="52" rx="8" fill="${RED}"/><text x="${ox + 218}" y="${oy + 46}" text-anchor="middle" font-size="28" font-weight="700" fill="#fff">${whole}</text><text x="${ox + 218}" y="${oy + 78}" text-anchor="middle" font-size="11" fill="#888">${wLab}</text>`;
    return s;
  };
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="六書中形聲與會意的組字結構" style="width:100%;max-width:520px;height:auto;display:block;margin:10px auto">`;
  out += `<rect x="0" y="0" width="${W}" height="${H}" fill="#fffdf7" stroke="${LINE}" rx="10"/>`;
  out += split(20, 18, '形聲：一半表義、一半表音', '氵', '表義（水）', '工', '表音（ㄍㄨㄥ）', '江', 'ㄐㄧㄤ');
  out += split(20, 90, '會意：合兩字之義成新義', '人', '一個人', '木', '一棵樹', '休', '靠樹休息');
  out += `</svg>`;
  return out;
}

/* 起承轉合：四段結構流程，轉為重點 */
function qichengzhuanhe() {
  const steps = [
    ['起', '開場・拋出情境', JADE],
    ['承', '延續・鋪陳細節', JADE],
    ['轉', '翻轉・意外變化', RED],
    ['合', '收束・回應開頭', GOLD],
  ];
  const bw = 108, gap = 26, H = 108, W = steps.length * bw + (steps.length - 1) * gap + 16;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="起承轉合四段結構，轉為關鍵" style="width:100%;max-width:560px;height:auto;display:block;margin:10px auto">`;
  steps.forEach((s, i) => {
    const x = 8 + i * (bw + gap);
    const emph = s[0] === '轉';
    out += `<rect x="${x}" y="${emph ? 20 : 28}" width="${bw}" height="${emph ? 60 : 48}" rx="10" fill="${emph ? s[2] : '#fffdf7'}" stroke="${s[2]}" stroke-width="${emph ? 0 : 1.6}"/>`;
    out += `<text x="${x + bw / 2}" y="${emph ? 48 : 52}" text-anchor="middle" font-size="22" font-weight="700" fill="${emph ? '#fff' : s[2]}">${s[0]}</text>`;
    out += `<text x="${x + bw / 2}" y="${emph ? 66 : 68}" text-anchor="middle" font-size="10.5" fill="${emph ? '#f6e4c9' : '#888'}">${s[1]}</text>`;
    if (i < steps.length - 1) {
      const ax = x + bw + gap / 2;
      out += `<polyline points="${ax - 7},46 ${ax + 5},52 ${ax - 7},58" fill="none" stroke="#bbb" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  });
  out += `</svg>`;
  return out;
}

/* 各學段章名的裝飾橫幅（毛筆感底線），給 12 個年級章視覺變化 */
function gradeBanner(gradeName, stage) {
  const W = 520, H = 60;
  const stageColor = { '國小低年級': '#2f7d6e', '國小中年級': '#2f7d6e', '國小高年級': '#3a6ea5', '國中': '#8a5a1c', '高中': RED }[stage] || RED;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${gradeName}章名" style="width:100%;max-width:520px;height:auto;display:block;margin:2px auto 8px">`;
  out += `<text x="12" y="38" font-size="26" font-weight="700" fill="${stageColor}">${gradeName}</text>`;
  out += `<text x="${W - 12}" y="24" text-anchor="end" font-size="12" fill="#aaa">${stage}</text>`;
  // 毛筆感底線：一條略帶起伏、末端收尖的路徑
  out += `<path d="M12 48 Q ${W * 0.35} 44 ${W * 0.62} 47 T ${W - 40} 46 l 22 -1 -20 3 z" fill="${stageColor}" opacity="0.85"/>`;
  out += `</svg>`;
  return out;
}

module.exports = { toneCurves, pinStructure, liushu, qichengzhuanhe, gradeBanner };
