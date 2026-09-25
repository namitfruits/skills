#!/usr/bin/env node
// Mở URL bằng Chrome headless qua CDP, chạy defuddle ngay trong tab, in nội dung chính của trang.
//
//   node fetch-page.mjs <url> [--format md|html|json] [-o out] [--raw-html page.html]
//
// Nội dung ra stdout (hoặc file -o), tiến độ và thống kê ra stderr.

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const skillDir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
// buildFrontmatter là hàm CLI defuddle dùng cho --frontmatter; package không export nên lấy theo
// đường dẫn file. Version defuddle được ghim trong package.json để đường dẫn này không đổi.
const { buildFrontmatter } = require(join(skillDir, 'node_modules/defuddle/dist/frontmatter.js'));
const defuddleBundlePath = join(skillDir, 'node_modules/defuddle/dist/index.full.js');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const CHALLENGE_TITLE = /just a moment|attention required|checking your browser/i;
// Trang bắt giải captcha thật (AWS WAF: "Let's confirm you are human"). Chờ bao lâu cũng không tự qua,
// nên phải nhận ra để báo lỗi, không thì defuddle đọc trang captcha như một bài bình thường.
const CAPTCHA_PAGE = `!!(window.gokuProps || document.querySelector('script[src*="captcha.awswaf.com"]'))`;
const FORMATS = ['md', 'html', 'json'];
const USAGE = 'Cách dùng: node fetch-page.mjs <url> [--format md|html|json] [-o out] [--raw-html page.html]';

function parseArguments(argv) {
  const options = { url: null, format: 'md', out: null, rawHtml: null };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '-o' || argument === '--out') options.out = argv[++index];
    else if (argument === '--format') options.format = argv[++index];
    else if (argument === '--raw-html') options.rawHtml = argv[++index];
    else if (!options.url) options.url = argument;
  }
  if (!options.url || !FORMATS.includes(options.format)) {
    console.error(USAGE);
    process.exit(2);
  }
  return options;
}

// md: frontmatter + markdown, giống `defuddle parse --markdown --frontmatter`.
// html: HTML đã làm sạch, không kèm metadata.
// json: cả object defuddle trả về; content là HTML, contentMarkdown là markdown.
function render(result, format) {
  if (format === 'md') return buildFrontmatter(result, result.url) + result.content;
  if (format === 'html') return result.content;
  return JSON.stringify(result, null, 2) + '\n';
}

const log = (...parts) => console.error(...parts);
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitFor(check, timeoutMilliseconds, what) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    const value = check();
    if (value) return value;
    await sleep(100);
  }
  throw new Error(`Hết ${timeoutMilliseconds / 1000}s mà chưa có ${what}`);
}

// Port 0 để Chrome tự chọn cổng trống, rồi đọc cổng thật từ file DevToolsActivePort.
async function launchChrome() {
  const chromePath = CHROME_CANDIDATES.find(existsSync);
  if (!chromePath) throw new Error('Không tìm thấy Chrome. Đặt biến môi trường CHROME_PATH.');
  const profileDir = mkdtempSync(join(tmpdir(), 'fetch-page-'));
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'about:blank',
  ], { stdio: 'ignore' });
  const portFile = join(profileDir, 'DevToolsActivePort');
  const port = await waitFor(
    () => existsSync(portFile) && readFileSync(portFile, 'utf8').split('\n')[0],
    15000, 'DevToolsActivePort',
  );
  // kill() chỉ gửi tín hiệu; Chrome còn ghi vào profile một lúc nữa, xoá ngay sẽ gặp ENOTEMPTY.
  const close = async () => {
    const exited = new Promise(resolve => chromeProcess.once('exit', resolve));
    chromeProcess.kill();
    await Promise.race([exited, sleep(3000)]);
    rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  };
  return { port, close };
}

// Một tab = một websocket. Lệnh gửi {id, method, params}, kết quả về cùng id; event không có id.
async function connectToPage(port) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const pageTarget = targets.find(target => target.type === 'page');
  const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let lastId = 0;
  const pending = new Map();
  const seenEvents = new Set();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(`${message.error.message}`)) : resolve(message.result);
    } else if (message.method) {
      seenEvents.add(message.method);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++lastId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  const evaluate = async (expression, { awaitPromise = false } = {}) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  };

  return { send, evaluate, seenEvents, close: () => socket.close() };
}

// Không chờ Page.loadEventFired: trang báo nhiều quảng cáo có khi chẳng bao giờ bắn event này.
// Chờ DOMContentLoaded, rồi chờ tới khi chữ trên trang thôi đổi (hoặc load tới, hoặc hết 10s).
async function waitUntilSettled(page) {
  await waitFor(() => page.seenEvents.has('Page.domContentEventFired'), 30000, 'DOMContentLoaded');
  const deadline = Date.now() + 10000;
  let previousLength = -1;
  let stableCount = 0;
  while (Date.now() < deadline) {
    const { title, length } = await page.evaluate(
      '({ title: document.title, length: document.body ? document.body.innerText.length : 0 })',
    );
    if (CHALLENGE_TITLE.test(title)) {
      stableCount = 0;
    } else if (page.seenEvents.has('Page.loadEventFired')) {
      return;
    } else {
      stableCount = length > 0 && length === previousLength ? stableCount + 1 : 0;
      if (stableCount >= 2) return;
    }
    previousLength = length;
    await sleep(500);
  }
}

// Plugin WordPress Urvanov/Crayon vẽ code thành bảng (cột số dòng + cột code), defuddle đọc như
// bảng thường. Code thô nằm trong textarea ẩn của mỗi khối → thay cả khối bằng <pre><code>.
const FIX_CODE_HIGHLIGHTERS = `
  document.querySelectorAll('.urvanov-syntax-highlighter-syntax, .crayon-syntax').forEach(block => {
    const plain = block.querySelector('textarea.urvanov-syntax-highlighter-plain, textarea.crayon-plain');
    if (!plain) return;
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = plain.value;
    pre.appendChild(code);
    block.replaceWith(pre);
  });
`;

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const startedAt = Date.now();
  const chrome = await launchChrome();
  try {
    const page = await connectToPage(chrome.port);

    await page.send('Page.enable');
    // Chrome headless khai "HeadlessChrome" trong User-Agent, Cloudflare thấy chữ này là chặn.
    const { userAgent } = await page.send('Browser.getVersion');
    await page.send('Network.setUserAgentOverride', { userAgent: userAgent.replace('HeadlessChrome', 'Chrome') });
    // Khung mặc định của headless chỉ rộng ~756px, site coi là mobile và gập bài sau nút "Read More"
    // bằng display:none — defuddle sẽ xoá phần bị ẩn đó.
    await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    // Cho phép inject bundle defuddle vào cả trang có CSP chặt.
    await page.send('Page.setBypassCSP', { enabled: true });

    const navigation = await page.send('Page.navigate', { url: options.url });
    if (navigation.errorText) throw new Error(`Không mở được trang: ${navigation.errorText}`);
    await waitUntilSettled(page);
    const loadedAt = Date.now();

    const title = await page.evaluate('document.title');
    if (CHALLENGE_TITLE.test(title)) throw new Error(`Vẫn kẹt ở trang chặn bot: "${title}"`);
    if (await page.evaluate(CAPTCHA_PAGE)) throw new Error(`Trang bắt giải captcha, không lấy được nội dung: "${title}"`);

    if (options.rawHtml) writeFileSync(options.rawHtml, await page.evaluate('document.documentElement.outerHTML'));

    await page.evaluate(FIX_CODE_HIGHLIGHTERS);
    await page.evaluate(readFileSync(defuddleBundlePath, 'utf8'));
    const defuddleOptions = {
      md: { markdown: true },
      html: {},
      json: { separateMarkdown: true },
    }[options.format];
    const result = JSON.parse(await page.evaluate(`
      (async () => {
        const DefuddleClass = window.Defuddle.default || window.Defuddle;
        const options = { ...${JSON.stringify(defuddleOptions)}, url: location.href };
        const result = await new DefuddleClass(document, options).parseAsync();
        return JSON.stringify({ ...result, url: location.href });
      })()
    `, { awaitPromise: true }));
    page.close();

    const output = render(result, options.format);
    if (options.out) writeFileSync(options.out, output);
    else process.stdout.write(output);

    log(`title: ${result.title}`);
    log(`url: ${result.url}`);
    log(`wordCount: ${result.wordCount}`);
    log(`thời gian: tải trang ${((loadedAt - startedAt) / 1000).toFixed(1)}s, defuddle ${((Date.now() - loadedAt) / 1000).toFixed(1)}s`);
  } finally {
    await chrome.close();
  }
}

main().catch(error => {
  log(`Lỗi: ${error.message}`);
  process.exit(1);
});
