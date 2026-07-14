/* 國語文課程手冊 EPUB 產生器
   直接讀 ../index.html 的資料陣列，產出與網站同步的 EPUB3（含每週練習與教學 SVG 圖解）。
   用法：node tools/build-ebook.js
   產物：國語文課程手冊.epub（覆蓋 repo 根目錄同名檔）
*/
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { XMLValidator } = require('fast-xml-parser');
const D = require('./diagrams');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------- 取出資料 ---------- */
function extractData() {
  const names = ['GRADES', 'SIG', 'WRITE', 'RHET', 'XUZI', 'LIUSHU', 'PUNC', 'EXAMS', 'TOPICS', 'BOPOMO'];
  const picked = html.split(/\r?\n/).filter(l => /^\s*var (GRADES|SIG|WRITE|RHET|XUZI|LIUSHU|PUNC|EXAMS|TOPICS|BOPOMO)=/.test(l)).map(l => l.trim());
  const mod = { exports: {} };
  new Function('module', picked.join('\n') + '\nmodule.exports={' + names.join(',') + '};')(mod);
  return mod.exports;
}
const { GRADES, SIG, WRITE, RHET, XUZI, LIUSHU, PUNC, EXAMS, TOPICS, BOPOMO } = extractData();

/* ---------- 工具 ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function page(title, body) {
  return '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n' +
    '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="zh-Hant">' +
    '<head><meta charset="utf-8"/><title>' + esc(title) + '</title>' +
    '<link rel="stylesheet" type="text/css" href="style.css"/></head><body>' + body + '</body></html>';
}
const ul = arr => '<ul>' + arr.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const ol = arr => '<ol>' + arr.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';

/* ---------- 各章 ---------- */
function chIntro() {
  const ex = EXAMS.map(e =>
    '<li><b>' + esc(e.stage) + '（' + esc(e.exam) + '）</b>' + '<ul>' + e.pts.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul></li>'
  ).join('');
  const core = GRADES.flatMap(g => g.units).filter(u => u.texts.some(t => t.indexOf('★') === 0));
  const body = '<h1>課程總覽</h1>' +
    '<p>本手冊涵蓋國小一年級到高中三年級共 12 個年級、96 個教學單元，每單元再細分 5 週練習，全書共 <b>480 題每週練習</b>，依 108 課綱國語文領域精神編寫。另附注音教室、16 堂「四小時單堂完課」特色課程、寫作教室、語文常識庫與作文主題靈感庫。</p>' +
    '<p class="note">本手冊由網站資料自動產生，內容與線上版同步。發音、隨堂測驗與考卷產生器等互動功能，請使用線上版。</p>' +
    '<h2>升學考試對照</h2><ul>' + ex + '</ul>';
  return page('課程總覽', body);
}

function chBopomo() {
  const toneRows = BOPOMO.tones.map(t =>
    '<tr><td><b>' + esc(t[0]) + '</b></td><td>' + esc(t[1]) + '</td><td>' + esc(t[2]) + '</td><td>' + esc(t[3]) + '</td></tr>'
  ).join('');
  const cells = arr => arr.map(x => '<span class="bp"><b>' + esc(x[0]) + '</b> ' + esc(x[1]) + '・' + esc(x[2]) + '</span>').join('');
  const body = '<h1>注音教室</h1>' +
    '<p>注音符號是識字與發音的地基。一個字的聲音由三個部分組成：聲母、韻母、聲調。</p>' +
    '<h2>拼音的組成</h2>' + D.pinStructure() +
    '<p>把聲母和韻母「牽在一起」一口氣滑過去，再配上聲調，就拼成一個字。中間若停頓，就變成兩個分開的音。</p>' +
    '<h2>五種聲調</h2>' + D.toneCurves() +
    '<p class="note">上圖為五度標調示意：縱軸是音的高低，一聲高平、二聲上揚、三聲先降後升、四聲下降、輕聲又輕又短。</p>' +
    '<table><thead><tr><th>聲調</th><th>怎麼唸</th><th>例字</th><th>幫助記憶</th></tr></thead><tbody>' + toneRows + '</tbody></table>' +
    '<h2>聲母（21 個）</h2><p class="bpwrap">' + cells(BOPOMO.initials) + '</p>' +
    '<h2>韻母（16 個）</h2><p class="bpwrap">' + cells(BOPOMO.finals) + '</p>' +
    '<h2>拼讀規則</h2>' + ul(BOPOMO.rules) +
    '<p class="note">發音示範音檔請至線上版「注音教室」，採教育部官方錄音。</p>';
  return page('注音教室', body);
}

function chGrade(g) {
  let h = D.gradeBanner(g.grade, g.stage) +
    '<p class="goal">' + esc(g.goal) + '</p>' +
    '<h2>核心能力</h2>' + ul(g.abilities) +
    '<h2>語文重點</h2><p class="txts">' + g.keySkills.map(esc).join('　·　') + '</p>' +
    '<h2>教學單元</h2>';
  g.units.forEach((u, ui) => {
    h += '<div class="unit"><h3>單元 ' + (ui + 1) + '｜' + esc(u.title) + '</h3>' +
      '<p><i>' + esc(u.focus) + '</i></p>' +
      '<p><b>選文：</b>' + esc(u.texts.join('；')) + '</p>' +
      '<p><b>寫作訓練：</b>' + esc(u.writing) + '</p>';
    if (u.guide && u.guide.teach) {
      h += '<div class="seg"><p class="segh"><b>教學講義</b></p><p class="segd">' + esc(u.guide.teach) + '</p></div>';
    }
    if (u.guide && u.guide.read) {
      h += '<p><b>怎麼讀：</b></p>' + ol(u.guide.read);
    }
    if (u.weeks && u.weeks.length) {
      h += '<p class="wkhead"><b>每週練習（' + u.weeks.length + ' 週）</b></p>';
      u.weeks.forEach(w => {
        h += '<div class="week"><p class="wh"><span class="wtag">第 ' + w.w + ' 週</span>' +
          '<span class="wyw">全學年第 ' + w.yw + ' 週</span> ' + esc(w.focus) + '</p>' +
          '<p class="wq">' + esc(w.q) + '</p>' +
          '<p class="wa"><b>參考答案　</b>' + esc(w.a) + '</p></div>';
      });
    }
    h += '</div>';
  });
  h += '<h2>評量方式</h2>' + ul(g.assessment);
  return page(g.grade, h);
}

function chSig(c, i) {
  const asArr = x => Array.isArray(x) ? x : (x ? [x] : []);
  let h = '<h1>特色課程 ' + (i + 1) + '：' + esc(c.title) + '</h1>' +
    '<p><span class="pill">' + esc(c.category) + '</span>　適合：' + esc(c.target) + '</p>' +
    '<p class="goal">' + esc(c.tagline) + '</p>' +
    '<h2>學習目標</h2>' + ul(c.objectives);
  if (c.rundown && c.rundown.length) {
    h += '<h2>時間流程</h2><table><thead><tr><th>時間</th><th>活動</th><th>內容</th></tr></thead><tbody>' +
      c.rundown.map(r => '<tr><td class="nowrap">' + esc(r.time) + '</td><td>' + esc(r.activity) + '</td><td>' + esc(r.detail) + '</td></tr>').join('') +
      '</tbody></table>';
  }
  if (c.materials) h += '<h2>教材</h2>' + ul(asArr(c.materials));
  if (c.output) h += '<h2>學生產出</h2><p>' + esc(c.output) + '</p>';
  if (c.assessment) h += '<h2>講評方式</h2>' + ul(asArr(c.assessment));
  if (c.takeaway) h += '<p class="tk">一句口訣：' + esc(c.takeaway) + '</p>';
  return page('特色課程 ' + (i + 1), h);
}

function chWrite() {
  let h = '<h1>寫作教室</h1><p>十張方法卡，從審題到收尾，把寫作拆成可以練習的步驟。</p>' +
    '<h2>文章的骨架：起承轉合</h2>' + D.qichengzhuanhe() +
    '<p class="note">「轉」是文章翻轉的地方，也是最容易被忽略的一段；沒有「轉」的文章會平淡無味。</p>';
  WRITE.forEach(w => {
    h += '<div class="unit"><h3>' + esc(w.name) + '</h3>' +
      '<p class="note">適用：' + esc(w.for) + '</p>' + ol(w.steps);
    if (w.trap) h += '<p class="tk">常見陷阱：' + esc(w.trap) + '</p>';
    h += '</div>';
  });
  return page('寫作教室', h);
}

function chCommon() {
  const tbl = (head, rows, cols) =>
    '<table><thead><tr>' + head.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(r => '<tr>' + cols.map(ci => '<td>' + esc(r[ci]) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  const body = '<h1>語文常識</h1>' +
    '<h2>修辭格（' + RHET.length + ' 種）</h2>' + tbl(['修辭', '說明', '例句'], RHET, [0, 1, 2]) +
    '<h2>文言虛字（' + XUZI.length + ' 個）</h2>' + tbl(['虛字', '常見用法', '例句'], XUZI, [0, 1, 2]) +
    '<h2>六書</h2>' + D.liushu() +
    tbl(['六書', '說明', '例字'], LIUSHU, [0, 1, 2]) +
    '<h2>標點符號（' + PUNC.length + ' 種）</h2>' + tbl(['符號', '用法', '例句'], PUNC, [0, 1, 2]);
  return page('語文常識', body);
}

function chTopics() {
  let h = '<h1>作文主題靈感庫</h1><p>五個年段各十個好發揮的題目與切入提示。</p>';
  TOPICS.forEach(t => {
    h += '<h2>' + esc(t.stage) + '</h2><p class="note">' + esc(t.note) + '</p><ul>' +
      t.items.map(it => '<li><b>' + esc(it[0]) + '</b>　<span class="hint">' + esc(it[1]) + '</span></li>').join('') + '</ul>';
  });
  return page('作文主題靈感庫', h);
}

/* ---------- 組裝 ---------- */
const CSS = `h1{font-size:1.55em;color:#9E2B25;border-bottom:2.5px solid #9E2B25;padding-bottom:6px;margin:0 0 14px}
h2{font-size:1.14em;color:#7A1F1A;margin:22px 0 6px;border-left:5px solid #A8791C;padding-left:8px}
h3{font-size:1.04em;color:#3a2f2a;margin:16px 0 4px}
p,li{margin:4px 0}
ul,ol{padding-left:22px;margin:6px 0}
table{border-collapse:collapse;width:100%;margin:8px 0;font-size:0.94em}
th,td{border:1px solid #d8cdb8;padding:5px 8px;text-align:left;vertical-align:top}
th{background:#F7EDD8;color:#7A1F1A}
.nowrap{white-space:nowrap}
.goal{color:#555;font-style:italic}
.note{color:#777;font-size:0.9em}
.hint{color:#777}
.txts{color:#444}
.pill{background:#9E2B25;color:#fff;border-radius:10px;padding:1px 9px;font-size:0.85em}
.seg{border:1px solid #e5dcc6;border-left:4px solid #9E2B25;border-radius:6px;padding:6px 10px;margin:8px 0;background:#fbf7ee}
.segh{margin:0}.segd{margin:4px 0 0;color:#333}
.unit{margin:14px 0 18px}
.wkhead{margin:10px 0 4px;color:#7A1F1A}
.week{border:1px solid #e5dcc6;border-radius:8px;padding:7px 11px;margin:7px 0;background:#fdfbf6}
.wh{margin:0 0 4px}
.wtag{background:#2f7d6e;color:#fff;border-radius:9px;padding:1px 8px;font-size:0.82em;margin-right:6px}
.wyw{color:#999;font-size:0.8em;margin-right:6px}
.wq{margin:4px 0}
.wa{margin:4px 0 0;color:#555;font-size:0.94em;background:#F7EDD8;border-radius:6px;padding:6px 9px}
.tk{background:#F7EDD8;padding:8px 12px;border-left:4px solid #A8791C;border-radius:4px}
.bpwrap{line-height:2.2}
.bp{display:inline-block;border:1px solid #d8cdb8;border-radius:8px;padding:3px 9px;margin:3px 5px 3px 0;white-space:nowrap}
.bp b{color:#9E2B25;font-size:1.15em}
body{font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;color:#222;line-height:1.85;margin:0.5em;word-wrap:break-word}`;

function build() {
  const docs = [];
  docs.push(['ch-intro', '課程總覽', chIntro()]);
  docs.push(['ch-bopomo', '注音教室', chBopomo()]);
  GRADES.forEach((g, i) => docs.push(['ch-g' + i, g.grade, chGrade(g)]));
  SIG.forEach((c, i) => docs.push(['ch-s' + i, '特色課程 ' + (i + 1) + '：' + c.title, chSig(c, i)]));
  docs.push(['ch-write', '寫作教室', chWrite()]);
  docs.push(['ch-common', '語文常識', chCommon()]);
  docs.push(['ch-topics', '作文主題靈感庫', chTopics()]);

  // 驗證每份 XHTML 是合法 XML
  const bad = [];
  docs.forEach(([id, , xml]) => {
    const v = XMLValidator.validate(xml, { allowBooleanAttributes: false });
    if (v !== true) bad.push(id + ': ' + JSON.stringify(v.err));
  });

  const navItems = docs.map(([id, title]) => '<li><a href="' + id + '.xhtml">' + esc(title) + '</a></li>').join('');
  const nav = page('目錄', '<nav epub:type="toc"><h1>目錄</h1><ol>' + navItems + '</ol></nav>');
  const toc = page('目錄', '<h1>國語文課程手冊</h1><p>小一到高三 · 12 年級 · 480 題每週練習</p><nav epub:type="landmarks" style="display:none"><ol><li><a epub:type="bodymatter" href="ch-intro.xhtml">開始</a></li></ol></nav><ol class="toc">' + navItems + '</ol>');

  const manifestItems = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="css" href="style.css" media-type="text/css"/>',
    '<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>',
  ].concat(docs.map(([id]) =>
    // 含內嵌 SVG 的頁面加上 properties="svg"
    '<item id="' + id + '" href="' + id + '.xhtml" media-type="application/xhtml+xml"' +
    (['ch-bopomo', 'ch-write', 'ch-common'].includes(id) || /^ch-g\d+$/.test(id) ? ' properties="svg"' : '') + '/>'
  )).join('');
  const spine = ['<itemref idref="toc"/>'].concat(docs.map(([id]) => '<itemref idref="' + id + '"/>')).join('');

  const uuid = 'urn:uuid:' + require('crypto').randomUUID();
  const opf = '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">' +
    '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">' +
    '<dc:identifier id="uid">' + uuid + '</dc:identifier>' +
    '<dc:title>國語文課程手冊：小一到高三</dc:title>' +
    '<dc:language>zh-TW</dc:language>' +
    '<dc:creator>國語文課程地圖</dc:creator>' +
    '<meta property="dcterms:modified">' + new Date().toISOString().replace(/\.\d+Z$/, 'Z') + '</meta>' +
    '</metadata><manifest>' + manifestItems + '</manifest><spine>' + spine + '</spine></package>';

  const container = '<?xml version="1.0" encoding="utf-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>';

  return { docs, nav, toc, opf, container, bad };
}

async function zipEpub(b) {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' }); // 必須第一、不壓縮
  zip.file('META-INF/container.xml', b.container);
  const oebps = zip.folder('OEBPS');
  oebps.file('content.opf', b.opf);
  oebps.file('nav.xhtml', b.nav);
  oebps.file('toc.xhtml', b.toc);
  oebps.file('style.css', CSS);
  b.docs.forEach(([id, , xml]) => oebps.file(id + '.xhtml', xml));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}

/* 合併列印用 HTML：所有章節接在一頁、章間分頁、開頭放可點目錄。
   供 Edge headless --print-to-pdf 產生 PDF。輸出路徑由環境變數 PRINT_HTML 指定。 */
function writePrintHtml(b, dest) {
  const bodyOf = xml => (xml.match(/<body>([\s\S]*)<\/body>/) || [, ''])[1];
  const toc = '<nav class="pdftoc"><h1>國語文課程手冊</h1>' +
    '<p class="sub">小一到高三 · 12 年級 · 96 教學單元 · 480 題每週練習</p><ol>' +
    b.docs.map(([id, title]) => '<li><a href="#' + id + '">' + esc(title) + '</a></li>').join('') +
    '</ol></nav>';
  const sections = b.docs.map(([id, , xml]) => '<section id="' + id + '" class="chap">' + bodyOf(xml) + '</section>').join('');
  const printCss = CSS + '\n@page{margin:16mm 14mm}\n.chap{page-break-before:always}\n' +
    '.pdftoc{page-break-after:always}.pdftoc h1{border:none}.pdftoc .sub{color:#777;margin:-8px 0 16px}' +
    '.pdftoc ol{columns:2;column-gap:26px;font-size:0.95em}.pdftoc a{color:#7A1F1A;text-decoration:none}' +
    '.week,.seg,.unit{page-break-inside:avoid}table{page-break-inside:auto}tr{page-break-inside:avoid}';
  const doc = '<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"/><title>國語文課程手冊</title><style>' +
    printCss + '</style></head><body>' + toc + sections + '</body></html>';
  fs.writeFileSync(dest, doc, 'utf8');
}

(async () => {
  const b = build();
  if (b.bad.length) {
    console.log('✘ XML 驗證失敗：\n  ' + b.bad.join('\n  '));
    process.exit(1);
  }
  console.log('✔ 全部 ' + b.docs.length + ' 章 XHTML 通過 XML 驗證');
  const buf = await zipEpub(b);
  const out = path.join(ROOT, '國語文課程手冊.epub');
  fs.writeFileSync(out, buf);
  console.log('✔ 已輸出', path.basename(out), (buf.length / 1024).toFixed(0) + ' KB');
  console.log('  章節數:', b.docs.length, '| 每週練習:', GRADES.reduce((a, g) => a + g.units.reduce((s, u) => s + (u.weeks ? u.weeks.length : 0), 0), 0), '題');
  if (process.env.PRINT_HTML) {
    writePrintHtml(b, process.env.PRINT_HTML);
    console.log('✔ 已輸出列印用 HTML:', process.env.PRINT_HTML);
  }
})();
