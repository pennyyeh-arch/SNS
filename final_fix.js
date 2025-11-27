const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

let newLines = [];
let skipDuplicate = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測重複代碼開始（第 1516 行）
  if (i === 1515 && line.includes('處理新頁面（如果還沒有找到有效 URL）')) {
    // 跳過重複代碼，直到找到 } catch (e) 且是正確的層級
    skipDuplicate = true;
    continue;
  }
  
  // 如果正在跳過重複代碼
  if (skipDuplicate) {
    // 檢查是否到達正確的 catch 塊（第 1625 行附近）
    if (line.includes('} catch (e) {') && i > 1620) {
      // 檢查前面幾行是否包含正確的結構
      if (i - 1 >= 0 && lines[i - 1].trim() === '}') {
        // 這是重複塊的結束，停止跳過
        skipDuplicate = false;
        // 保留這個 catch
        newLines.push(line);
        continue;
      }
    }
    
    // 如果找到最終檢查，停止跳過
    if (line.includes('最終檢查') || line.includes('finalPages')) {
      skipDuplicate = false;
      newLines.push(line);
      continue;
    }
    
    // 繼續跳過
    continue;
  }
  
  // 在第 1513 行後添加返回邏輯（如果找到有效 URL）
  if (i === 1513 && line.trim() === '}') {
    newLines.push(line);
    // 添加檢查和返回邏輯
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
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ 重複代碼已刪除，返回邏輯已添加');





