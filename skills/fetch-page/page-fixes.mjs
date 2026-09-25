// Các lỗi defuddle hay mắc và cách sửa. Mọi hàm ở đây chạy TRONG TAB: fetch-page.mjs gửi mã nguồn của
// hàm qua `fn.toString()`, nên hàm không được dùng biến hay import nằm ngoài nó.
//
// Mỗi problem gồm:
//   detect(contentHtml) — đọc kết quả defuddle (HTML) và DOM của trang, trả về chuỗi mô tả lỗi, hoặc ''
//                         nếu không có. Viết theo hiện tượng nhìn thấy trong kết quả, không theo site,
//                         để gặp biến thể lạ thì ít nhất cũng báo được.
//   fixes[].run()       — sửa DOM của trang cho defuddle đọc lại, trả về số chỗ đã sửa; 0 = không phải
//                         nguyên nhân này. Mỗi fix là một nguyên nhân đã gặp thật, ghi kèm site gặp lần đầu.
//   fixes[].name        — nói cụ thể fix làm gì với phần tử nào ("gỡ X khỏi Y", "thay X bằng Y"), vì nó
//                         được in ra log: đọc log là biết trang đã bị đổi ở đâu, không cần mở code.
//
// Fix không thêm chữ: chữ vốn có trong trang, fix chỉ sửa thẻ, thuộc tính bọc quanh nó.

export const PROBLEMS = [
  {
    // Plugin highlight vẽ code thành bảng: một ô chứa dãy số dòng 1, 2, 3…, ô bên cạnh chứa code.
    // Defuddle đọc như bảng thường → markdown ra bảng hai cột, code dồn một dòng. Bảng số liệu có STT thì
    // mỗi ô một số, không có ô nào chứa cả dãy, nên không bị bắt nhầm.
    name: 'code bị vẽ thành bảng',
    detect: contentHtml => {
      const content = new DOMParser().parseFromString(contentHtml, 'text/html');
      const isLineNumbers = cell => {
        const numbers = cell.textContent.trim().split(/\s+/);
        return numbers.length >= 2 && numbers.every((number, index) => number === String(index + 1));
      };
      const tables = [...content.querySelectorAll('table')]
        .filter(table => [...table.querySelectorAll('td, th')].some(cell => isLineNumbers(cell) && cell.parentElement.children.length > 1));
      return tables.length ? `${tables.length} bảng` : '';
    },
    fixes: [
      {
        // machinelearningmastery.com: Urvanov/Crayon (WordPress). Code thô nằm trong textarea ẩn của mỗi
        // khối → thay cả khối bằng <pre><code>.
        name: 'thay khối code Urvanov/Crayon bằng <pre><code> lấy từ textarea ẩn',
        run: () => {
          let count = 0;
          document.querySelectorAll('.urvanov-syntax-highlighter-syntax, .crayon-syntax').forEach(block => {
            const plain = block.querySelector('textarea.urvanov-syntax-highlighter-plain, textarea.crayon-plain');
            if (!plain) return;
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = plain.value;
            pre.appendChild(code);
            block.replaceWith(pre);
            count++;
          });
          return count;
        },
      },
    ],
  },
  {
    // Defuddle bỏ mất chữ: <p> đang hiện trên trang, nằm chung cha với một <p> defuddle giữ, mà chữ
    // không có trong kết quả. "Chung cha" là điều kiện chính: sidebar, bình luận, "bài liên quan"
    // defuddle bỏ là đúng, và chúng thường nằm ở container khác thân bài. Coi là lỗi khi phần bị bỏ từ
    // 50 từ và từ 20% thân bài trở lên, để một đoạn "Read more" lẻ bị bỏ không làm báo động.
    // Đoạn bị mất được gắn data-fetch-page-missing để fix biết chỗ mà sửa.
    name: 'thiếu chữ',
    detect: contentHtml => {
      const normalize = text => text.replace(/\s+/g, ' ').trim();
      const countWords = text => normalize(text).split(' ').filter(Boolean).length;
      const isVisible = element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
      const keptText = normalize(new DOMParser().parseFromString(contentHtml, 'text/html').body.textContent);

      document.querySelectorAll('[data-fetch-page-missing]').forEach(element => element.removeAttribute('data-fetch-page-missing'));
      const paragraphs = [...document.body.querySelectorAll('p')]
        .filter(p => countWords(p.textContent) >= 8 && isVisible(p))
        .map(p => ({ p, words: countWords(p.textContent), kept: keptText.includes(normalize(p.textContent).slice(0, 60)) }));
      const bodies = new Set(paragraphs.filter(item => item.kept).map(item => item.p.parentElement));
      const inBody = paragraphs.filter(item => bodies.has(item.p.parentElement));
      const missing = inBody.filter(item => !item.kept);
      missing.forEach(item => item.p.setAttribute('data-fetch-page-missing', ''));

      const sum = items => items.reduce((total, item) => total + item.words, 0);
      const bodyWords = sum(inBody);
      const missingWords = sum(missing);
      if (missingWords < 50 || missingWords < bodyWords * 0.2) return '';
      return `defuddle bỏ ${missingWords}/${bodyWords} từ (${missing.length} đoạn) đang hiện trong thân bài`;
    },
    fixes: [
      {
        // tomshardware.com: paywall Kiosq (Future plc) gắn aria-hidden="true" lên mọi khối từ đoạn thứ 3
        // dù chữ vẫn hiện; defuddle xoá mọi [aria-hidden="true"] trừ khi class có chữ "paywall" → mất nửa
        // bài. Gỡ aria-hidden khỏi các khối đang hiện, có chữ, nằm cùng container với đoạn bị mất — gồm cả
        // danh sách, không chỉ <p>.
        name: 'gỡ aria-hidden khỏi các khối có chữ đang hiện, cùng container với đoạn bị mất',
        run: () => {
          const isVisible = element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
          const containers = new Set([...document.querySelectorAll('[data-fetch-page-missing]')].map(p => p.parentElement));
          let count = 0;
          for (const container of containers) {
            for (const child of container.children) {
              if (child.getAttribute('aria-hidden') === 'true' && child.textContent.trim() && isVisible(child)) {
                child.removeAttribute('aria-hidden');
                count++;
              }
            }
          }
          return count;
        },
      },
    ],
  },
];
