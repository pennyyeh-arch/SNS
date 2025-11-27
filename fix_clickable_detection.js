const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
let content = fs.readFileSync(filePath, 'utf8');

// 改進可點擊元素檢測邏輯
// 1. 檢查是否有 href 屬性（鏈接）
// 2. 檢查是否有 target="_blank"
// 3. 檢查是否有 onclick 事件
// 4. 檢查父元素或子元素是否可點擊
// 5. 擴大搜索範圍，不僅僅是 "Streaming Now" 下方，而是包含整個容器

// 找到 UI 元素搜索的 evaluate 部分並改進
const oldSearchLogic = `      // ??索??內尋找??????
      const candidates = [];
      const allElements = document.querySelectorAll('div, a, button, li, [role="button"], [class*="card" i], [class*="item" i], [class*="stream" i]');
      
      allElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        
        // 檢查???否??索??內
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        
        if (
          centerX >= searchArea.left &&
          centerX <= searchArea.right &&
          rect.y >= searchArea.top &&
          rect.y + rect.height <= searchArea.bottom
        ) {
          // 檢查???否????
          const style = window.getComputedStyle(el);
          const isClickable = 
            el.tagName === 'A' ||
            el.tagName === 'BUTTON' ||
            el.getAttribute('role') === 'button' ||
            style.cursor === 'pointer' ||
            el.onclick !== null ||
            el.getAttribute('onclick') !== null ||
            el.classList.toString().toLowerCase().includes('click') ||
            el.classList.toString().toLowerCase().includes('card') ||
            el.classList.toString().toLowerCase().includes('item');
          
          if (isClickable) {
            candidates.push({
              element: el,
              tagName: el.tagName,
              className: el.className || '',
              id: el.id || '',
              rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              },
              // ??????? Streaming Now 且面積適中???
              score: (rect.y - (sy + sh)) + Math.abs(rect.width - sw) * 0.1
            });
          }
        }
      });`;

const newSearchLogic = `      // 在搜索區域內尋找可點擊元素
      const candidates = [];
      const allElements = document.querySelectorAll('div, a, button, li, [role="button"], [class*="card" i], [class*="item" i], [class*="stream" i], [class*="viewer" i], [class*="live" i]');
      
      allElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        
        // 檢查元素是否在搜索區域內（擴大範圍）
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        
        if (
          centerX >= searchArea.left - 50 && // 擴大左側範圍
          centerX <= searchArea.right + 50 && // 擴大右側範圍
          rect.y >= searchArea.top &&
          rect.y + rect.height <= searchArea.bottom
        ) {
          // 改進可點擊判斷邏輯
          const style = window.getComputedStyle(el);
          const href = el.getAttribute('href');
          const target = el.getAttribute('target');
          const hasOnClick = el.onclick !== null || el.getAttribute('onclick') !== null;
          
          // 檢查元素本身
          let isClickable = 
            el.tagName === 'A' ||
            el.tagName === 'BUTTON' ||
            el.getAttribute('role') === 'button' ||
            style.cursor === 'pointer' ||
            hasOnClick ||
            href !== null ||
            target === '_blank';
          
          // 如果元素本身不可點擊，檢查父元素
          if (!isClickable && el.parentElement) {
            const parentStyle = window.getComputedStyle(el.parentElement);
            const parentHref = el.parentElement.getAttribute('href');
            const parentTarget = el.parentElement.getAttribute('target');
            const parentOnClick = el.parentElement.onclick !== null || el.parentElement.getAttribute('onclick') !== null;
            
            isClickable = 
              el.parentElement.tagName === 'A' ||
              el.parentElement.tagName === 'BUTTON' ||
              el.parentElement.getAttribute('role') === 'button' ||
              parentStyle.cursor === 'pointer' ||
              parentOnClick ||
              parentHref !== null ||
              parentTarget === '_blank';
          }
          
          // 如果還不可點擊，檢查是否有子元素是鏈接
          if (!isClickable) {
            const linkChild = el.querySelector('a[href], a[target="_blank"]');
            if (linkChild) {
              isClickable = true;
            }
          }
          
          // 檢查是否包含特定類名（可能是直播相關）
          const classNames = el.className ? el.className.toString().toLowerCase() : '';
          if (!isClickable) {
            isClickable = 
              classNames.includes('click') ||
              classNames.includes('card') ||
              classNames.includes('item') ||
              classNames.includes('stream') ||
              classNames.includes('live') ||
              classNames.includes('viewer') ||
              classNames.includes('player');
          }
          
          if (isClickable) {
            // 計算優先級分數
            // 優先：有 href、target="_blank"、onclick 的元素
            let priority = 0;
            if (href || target === '_blank') priority += 100;
            if (hasOnClick) priority += 50;
            if (el.tagName === 'A') priority += 30;
            if (el.tagName === 'BUTTON') priority += 20;
            
            // 距離 Streaming Now 越近越好
            const distanceFromTop = (rect.y - (sy + sh));
            
            candidates.push({
              element: el,
              tagName: el.tagName,
              className: el.className || '',
              id: el.id || '',
              href: href || '',
              target: target || '',
              hasOnClick: hasOnClick,
              rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              },
              // 優先級：優先權分數 - 距離（越小越好）
              score: -priority + distanceFromTop * 0.1
            });
          }
        }
      });`;

// 使用行號定位替換
const lines = content.split('\n');
let newLines = [];
let inSearchLogic = false;
let searchStart = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測搜索邏輯開始
  if (line.includes('在搜索區域內尋找可點擊元素') || 
      (line.includes('索') && line.includes('內尋找') && i > 1200 && i < 1210)) {
    inSearchLogic = true;
    searchStart = i;
    // 插入新的搜索邏輯
    newLines.push(...newSearchLogic.split('\n'));
    // 跳過舊代碼直到找到 sort
    while (i < lines.length && i < searchStart + 60) {
      if (lines[i].includes('sort') && lines[i].includes('candidates')) {
        i++; // 跳過 sort 行
        break;
      }
      i++;
    }
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ 可點擊元素檢測邏輯已改進');





