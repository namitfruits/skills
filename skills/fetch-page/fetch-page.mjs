#!/usr/bin/env node
// Mở URL bằng Chrome headless qua CDP, chạy defuddle ngay trong tab, in nội dung chính của trang.
//
//   node fetch-page.mjs <url> [--format md|html|json] [-o out] [--raw-html page.html] [--html page.html] [--debug]
//
// Nội dung ra stdout (hoặc file -o), tiến độ và thống kê ra stderr. Các lỗi defuddle hay mắc và cách
// sửa nằm trong page-fixes.mjs.

import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { PROBLEMS } from './page-fixes.mjs';

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
const USAGE = 'Cách dùng: node fetch-page.mjs <url> [--format md|html|json] [-o out] [--raw-html page.html] [--html page.html] [--debug]';
// Chặn trên cho vòng lặp sửa lỗi, phòng khi fix này làm lộ ra lỗi khác rồi cứ thế nối nhau.
const MAX_ROUNDS = 5;

function parseArguments(argv) {
  const options = { url: null, format: 'md', out: null, rawHtml: null, html: null, debug: false };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === '-o' || argument === '--out') options.out = argv[++index];
    else if (argument === '--format') options.format = argv[++index];
    else if (argument === '--raw-html') options.rawHtml = argv[++index];
    else if (argument === '--html') options.html = argv[++index];
    else if (argument === '--debug') options.debug = true;
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
  if (format === 'md') return buildFrontmatter(result, result.url) + result.contentMarkdown;
  if (format === 'html') return result.content;
  return JSON.stringify(result, null, 2) + '\n';
}

const log = (...parts) => console.error(...parts);

// Lần fetch có vấn đề mà chưa giải quyết được thì ghi lại để dò sau, trong logs/ của thư mục skill (ở
// project nào gọi skill cũng ghi về một chỗ):
//   log.jsonl  — mỗi lỗi một dòng, append vào, mỗi dòng một object phẳng: time, url, finalUrl (chỉ khi
//                redirect), error, html. Một lần fetch còn nhiều lỗi thì ghi nhiều dòng, chung một html.
//   page-raw/  — HTML của trang trước mọi fix; mở lại được bằng --html để dò.
//   fix.jsonl  — lỗi đã được fix sửa, để tổng hợp site nào cần fix nào (xem recordFixes). Tách khỏi
//                log.jsonl để mỗi dòng log.jsonl đều là một việc cần dò.
const LOG_DIR = join(skillDir, 'logs');

// url là URL lúc gọi, để chạy lại được; finalUrl chỉ ghi khi trang redirect sang chỗ khác.
function recordFailure({ url, finalUrl, rawHtml, errors }) {
  const time = new Date().toISOString();
  const html = join('page-raw', `${time.replace(/[:.]/g, '-')}-${new URL(finalUrl).hostname}.html`);
  mkdirSync(join(LOG_DIR, 'page-raw'), { recursive: true });
  writeFileSync(join(LOG_DIR, html), rawHtml);
  const lines = errors.map(error => JSON.stringify({ time, url, ...(finalUrl !== url && { finalUrl }), error, html }));
  appendFileSync(join(LOG_DIR, 'log.jsonl'), lines.join('\n') + '\n');
  log(`đã ghi lỗi vào ${join(LOG_DIR, 'log.jsonl')}, HTML ở ${join(LOG_DIR, html)}`);
}

// Mỗi fix đã sửa được một lỗi thì append một dòng phẳng vào fix.jsonl: time, url, finalUrl (chỉ khi
// redirect), error, fix, changes (số chỗ fix đã sửa). Không lưu HTML, vì lỗi đã sửa thì không cần dò.
function recordFixes({ url, finalUrl, fixed }) {
  const time = new Date().toISOString();
  const lines = fixed.map(item => JSON.stringify({ time, url, ...(finalUrl !== url && { finalUrl }), ...item }));
  mkdirSync(LOG_DIR, { recursive: true });
  appendFileSync(join(LOG_DIR, 'fix.jsonl'), lines.join('\n') + '\n');
}
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
  const listeners = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(`${message.error.message}`)) : resolve(message.result);
    } else if (message.method) {
      seenEvents.add(message.method);
      listeners.get(message.method)?.(message.params);
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

  const on = (method, listener) => listeners.set(method, listener);

  return { send, evaluate, on, seenEvents, close: () => socket.close() };
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

// Gửi một hàm trong page-fixes.mjs vào tab và chạy nó.
const runInPage = (page, fn, ...args) => page.evaluate(`(${fn})(${args.map(arg => JSON.stringify(arg)).join(', ')})`);

// Luôn lấy cả HTML (content) lẫn markdown (contentMarkdown): detect trong PROBLEMS đọc HTML, còn
// --format md in markdown. debug: defuddle trả thêm danh sách khối nó xoá, xoá ở bước nào.
const runDefuddle = async (page, debug) => JSON.parse(await page.evaluate(`
  (async () => {
    const DefuddleClass = window.Defuddle.default || window.Defuddle;
    const options = { separateMarkdown: true, debug: ${debug}, url: location.href };
    const result = await new DefuddleClass(document, options).parseAsync();
    return JSON.stringify({ ...result, url: location.href });
  })()
`, { awaitPromise: true }));

// Vòng lặp: defuddle → detect mọi problem → có lỗi thì chạy các fix chưa thử của lỗi đó → defuddle lại.
// Dừng khi hết lỗi, khi không fix nào sửa được gì, hoặc hết MAX_ROUNDS. Mỗi fix chỉ thử một lần.
// Fix sửa thẳng vào DOM nên không lùi lại được; thay vào đó giữ kết quả ít lỗi nhất (bằng nhau thì lấy
// vòng sau, vì nó đã qua nhiều fix hơn). Lỗi còn lại thì vẫn trả kết quả, kèm cảnh báo.
// Trả về: unfixed — lỗi còn lại; fixed — fix đã sửa được gì mà lỗi của nó không còn ở kết quả cuối.
async function extractWithFixes(page, debug) {
  const tried = new Set();
  const applied = [];
  let best = null;
  for (let round = 1; ; round++) {
    const result = await runDefuddle(page, debug);
    const found = [];
    for (const problem of PROBLEMS) {
      const detail = await runInPage(page, problem.detect, result.content);
      if (detail) found.push({ problem, detail });
    }
    if (!best || found.length <= best.found.length) best = { result, found };
    if (!found.length) {
      if (round > 1) log(`vòng ${round}: hết lỗi`);
      break;
    }
    found.forEach(({ problem, detail }) => log(`vòng ${round}: ${problem.name} — ${detail}`));
    if (round === MAX_ROUNDS) break;

    let fixed = 0;
    for (const { problem, detail } of found) {
      for (const fix of problem.fixes.filter(fix => !tried.has(fix))) {
        tried.add(fix);
        // Fix ném lỗi giữa chừng thì DOM có thể đã bị sửa dở. Không dừng cả lần fetch: bỏ fix đó, đi
        // tiếp; kết quả sửa dở mà tệ hơn thì bước giữ kết quả ít lỗi nhất sẽ không chọn nó.
        let count = 0;
        try {
          count = await runInPage(page, fix.run);
        } catch (error) {
          log(`vòng ${round}: fix bị lỗi, bỏ qua: ${fix.name} — ${error.message.split('\n')[0]}`);
        }
        if (count) {
          log(`vòng ${round}: đã sửa: ${fix.name} (${count})`);
          applied.push({ problem, error: `${problem.name} — ${detail}`, fix: fix.name, changes: count });
        }
        fixed += count;
      }
    }
    if (!fixed) break;
  }
  const unfixed = best.found.map(({ problem, detail }) => `${problem.name} — ${detail}`);
  unfixed.forEach(reason => log(`cảnh báo: chưa sửa được ${reason}`));
  const fixed = applied
    .filter(({ problem }) => !best.found.some(item => item.problem === problem))
    .map(({ error, fix, changes }) => ({ error, fix, changes }));
  return { result: best.result, unfixed, fixed };
}

// In các khối có chữ mà defuddle xoá: bước nào, selector nào, đoạn đầu của chữ. Bỏ qua khối dưới 8 từ
// (icon, nút, nhãn) cho danh sách đọc được.
function logRemovals(debug) {
  log(`debug: defuddle lấy thân bài từ ${debug.contentSelector}`);
  for (const removal of debug.removals) {
    const text = (removal.text || '').replace(/\s+/g, ' ').trim();
    if (text.split(' ').length < 8) continue;
    log(`debug: xoá ở ${removal.step}${removal.selector ? ` (${removal.selector})` : ''}, ${removal.reason}: "${text.slice(0, 80)}"`);
  }
}

// Serialize cả doctype: thiếu nó thì trang mở lại bằng --html chạy ở quirks mode, bố cục khác đi.
const RAW_HTML = `(document.doctype ? new XMLSerializer().serializeToString(document.doctype) + '\\n' : '') + document.documentElement.outerHTML`;

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const startedAt = Date.now();
  log(`mở: ${options.url}`);
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
    // --html: mở lại một trang đã lưu bằng --raw-html. Chrome vẫn đi tới URL thật nhưng nhận file đã lưu
    // thay cho trang, nên đường dẫn tương đối, CSS, ảnh vẫn đúng. Tắt JS để trang không tự dựng lại DOM.
    if (options.html) {
      const body = readFileSync(options.html).toString('base64');
      page.on('Fetch.requestPaused', ({ requestId }) => page.send('Fetch.fulfillRequest', {
        requestId, responseCode: 200, body,
        responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }],
      }));
      await page.send('Fetch.enable', { patterns: [{ urlPattern: options.url.replace(/[*?\\]/g, '\\$&'), resourceType: 'Document' }] });
      await page.send('Emulation.setScriptExecutionDisabled', { value: true });
    }

    const navigation = await page.send('Page.navigate', { url: options.url });
    if (navigation.errorText) throw new Error(`Không mở được trang: ${navigation.errorText}`);
    await waitUntilSettled(page);
    const loadedAt = Date.now();

    const title = await page.evaluate('document.title');
    // Lấy HTML thô trước mọi fix: cần cho --raw-html, và cho recordFailure khi có vấn đề.
    const rawHtml = await page.evaluate(RAW_HTML);
    if (options.rawHtml) writeFileSync(options.rawHtml, rawHtml);
    // --html là chạy lại trang đã lưu để dò, không ghi vào log.jsonl hay fix.jsonl.
    const shouldRecord = !options.html;

    const blocked = CHALLENGE_TITLE.test(title) ? `Vẫn kẹt ở trang chặn bot: "${title}"`
      : await page.evaluate(CAPTCHA_PAGE) ? `Trang bắt giải captcha, không lấy được nội dung: "${title}"`
      : null;
    if (blocked) {
      const error = new Error(blocked);
      if (shouldRecord) {
        log(`Lỗi: ${blocked}`);
        error.logged = true;
        recordFailure({ url: options.url, finalUrl: await page.evaluate('location.href'), rawHtml, errors: [blocked] });
      }
      throw error;
    }

    await page.evaluate(readFileSync(defuddleBundlePath, 'utf8'));
    const { result, unfixed, fixed } = await extractWithFixes(page, options.debug);
    page.close();
    // Bật debug làm defuddle giữ lại vài thứ nó vốn bỏ (wordCount lệch vài từ), nên chỉ dùng để dò lỗi.
    if (options.debug) logRemovals(result.debug);

    const output = render(result, options.format);
    if (options.out) writeFileSync(options.out, output);
    else process.stdout.write(output);

    log(`title: ${result.title}`);
    log(`url: ${result.url}`);
    log(`wordCount: ${result.wordCount}`);
    log(`thời gian: tải trang ${((loadedAt - startedAt) / 1000).toFixed(1)}s, defuddle ${((Date.now() - loadedAt) / 1000).toFixed(1)}s`);
    if (fixed.length && shouldRecord) recordFixes({ url: options.url, finalUrl: result.url, fixed });
    if (unfixed.length && shouldRecord) recordFailure({ url: options.url, finalUrl: result.url, rawHtml, errors: unfixed });
  } finally {
    await chrome.close();
  }
}

main().catch(error => {
  if (!error.logged) log(`Lỗi: ${error.message}`);
  process.exit(1);
});
