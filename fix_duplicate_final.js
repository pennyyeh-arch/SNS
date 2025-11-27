const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

let newLines = [];
let skipDuplicate = false;
let inDuplicateBlock = false;
let braceLevel = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測重複代碼開始（第 1516 行之後的 "處理新頁面（如果還沒有找到有效 URL）"）
  if (i > 1515 && i < 1625 && line.includes('處理新頁面（如果還沒有找到有效 URL）')) {
    // 開始跳過重複代碼
    skipDuplicate = true;
    inDuplicateBlock = true;
    continue;
  }
  
  // 如果正在跳過重複代碼
  if (skipDuplicate) {
    // 計算大括號以找到塊結束
    if (line.includes('{')) braceLevel++;
    if (line.includes('}')) {
      braceLevel--;
      // 如果找到匹配的結束大括號且是 try-catch 或 if 的結束
      if (braceLevel <= 0 && (line.trim() === '}' || line.trim() === '      }')) {
        // 檢查下一行是否是 catch 或最終檢查
        if (i + 1 < lines.length && 
            (lines[i + 1].includes('} catch') || 
             lines[i + 1].includes('最終檢查') ||
             lines[i + 1].includes('finalPages'))) {
          // 結束重複塊
          skipDuplicate = false;
          inDuplicateBlock = false;
          braceLevel = 0;
          // 繼續處理下一行
          continue;
        }
      }
    }
    
    // 繼續跳過
    continue;
  }
  
  // 在找到有效 URL 後添加返回邏輯
  if (i > 1500 && i < 1520 && 
      line.includes('await newPage.waitForLoadState') && 
      line.includes('timeout: 2000')) {
    newLines.push(line);
    
    // 檢查是否需要在這裡添加返回邏輯
    let j = i + 1;
    let foundReturn = false;
    while (j < lines.length && j < i + 15) {
      if (lines[j].includes('return {') && lines[j].includes('newWindowOpened')) {
        foundReturn = true;
        break;
      }
      j++;
    }
    
    // 如果沒有找到返回，添加返回邏輯
    if (!foundReturn) {
      // 在 waitForLoadState 之後添加檢查和返回
      let k = i + 1;
      while (k < lines.length && k < i + 10) {
        if (lines[k].includes('}') && lines[k - 1] && lines[k - 1].includes('} catch')) {
          // 在 catch 塊結束後添加返回邏輯
          newLines.push('          ');
          newLines.push('          // 如果找到有效 URL，立即返回');
          newLines.push('          if (newPageUrl && newPageUrl !== \'about:blank\') {');
          newLines.push('            console.log(`✅ 新頁面已載入: ${newPageUrl}`);');
          newLines.push('            const screenshot4 = path.join(debugDir, `streaming-now-new-window-${timestamp}.png`);');
          newLines.push('            await newPage.screenshot({ path: screenshot4, fullPage: false }).catch(() => {});');
          newLines.push('            ');
          newLines.push('            debugInfo.clickMethod = clickMethod;');
          newLines.push('            debugInfo.newWindowUrl = newPageUrl;');
          newLines.push('            ');
          newLines.push('            console.log(\'✅ 新視窗已開啟並保持開啟狀態\');');
          newLines.push('            ');
          newLines.push('            return {');
          newLines.push('              found: true,');
          newLines.push('              newWindowOpened: true,');
          newLines.push('              newWindowUrl: newPageUrl,');
          newLines.push('              message: `成功開啟新視窗: ${newPageUrl} (使用 ${clickMethod})。視窗保持開啟狀態。`,');
          newLines.push('              debug: debugInfo');
          newLines.push('            };');
          newLines.push('          }');
          break;
        }
        k++;
      }
    }
    
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ 重複代碼已清理，返回邏輯已添加');





