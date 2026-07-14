/* 產生 PDF：先跑 build-ebook.js 輸出合併列印用 HTML，再用 Edge／Chrome 無頭列印成 PDF。
   用法：node tools/build-pdf.js
   需已安裝 Microsoft Edge 或 Google Chrome。 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const printHtml = path.join(os.tmpdir(), 'zh-course-print.html');
const pdfOut = path.join(ROOT, '國語文課程手冊.pdf');

// 1) 產生列印用 HTML（build-ebook.js 讀 PRINT_HTML 環境變數）
execFileSync(process.execPath, [path.join(__dirname, 'build-ebook.js')], {
  stdio: 'inherit',
  env: Object.assign({}, process.env, { PRINT_HTML: printHtml }),
});

// 2) 找瀏覽器
const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = candidates.find(p => { try { return fs.existsSync(p); } catch { return false; } });
if (!browser) {
  console.error('✘ 找不到 Edge 或 Chrome。請安裝其一，或用 CHROME_PATH 環境變數指定路徑。');
  process.exit(1);
}

// 3) 無頭列印成 PDF
const fileUrl = 'file:///' + printHtml.replace(/\\/g, '/');
execFileSync(browser, [
  '--headless', '--disable-gpu', '--no-pdf-header-footer',
  '--print-to-pdf=' + pdfOut, fileUrl,
], { stdio: 'ignore' });

const kb = fs.statSync(pdfOut).size / 1024;
console.log('✔ 已輸出', path.basename(pdfOut), (kb / 1024).toFixed(2) + ' MB（瀏覽器：' + path.basename(browser) + '）');
