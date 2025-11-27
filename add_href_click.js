const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let newLines = [];
let skipOldClick = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測點擊邏輯開始（在 originalPages 定義之後）
  if (line.includes('let newPage = null') && i > 1390 && i < 1400) {
    newLines.push(line);
    newLines.push('    let clickMethod = \'normal\';');
    newLines.push('    ');
    newLines.push('    // 方法 0: 如果元素有 href，直接導航');
    newLines.push('    if (uiElement.href && (uiElement.href.startsWith(\'http\') || uiElement.href.startsWith(\'//\'))) {');
    newLines.push('      try {');
    newLines.push('        console.log(`嘗試方法 0: 直接導航到 href: ${uiElement.href}`);');
    newLines.push('        newPage = await context.newPage();');
    newLines.push('        await newPage.goto(uiElement.href, { waitUntil: \'domcontentloaded\', timeout: 10000 });');
    newLines.push('        clickMethod = \'href-navigation\';');
    newLines.push('        console.log(\'✅ 方法 0 成功: 直接導航到新頁面\');');
    newLines.push('      } catch (error) {');
    newLines.push('        console.log(\'方法 0 失敗:\', error.message);');
    newLines.push('        debugInfo.clickAttempts.push({ method: \'href-navigation\', error: error.message });');
    newLines.push('        if (newPage && !newPage.isClosed()) {');
    newLines.push('          await newPage.close().catch(() => {});');
    newLines.push('        }');
    newLines.push('        newPage = null;');
    newLines.push('      }');
    newLines.push('    }');
    newLines.push('    ');
    continue;
  }
  
  // 跳過舊的 clickMethod 定義
  if (line.includes('let clickMethod') && i > 1390 && i < 1395) {
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ href 直接導航邏輯已添加');





