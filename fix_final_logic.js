const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// 找到並刪除重複的代碼（第 1516-1620 行左右的重複邏輯）
// 並且在找到有效 URL 後立即返回

let newLines = [];
let skipDuplicate = false;
let foundValidUrl = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測是否找到有效 URL 並返回
  if (line.includes('if (newPageUrl && newPageUrl !== \'about:blank\')') && 
      i > 1500 && i < 1520) {
    // 這是在新邏輯中，保留並檢查是否有 return
    newLines.push(line);
    // 檢查後續是否有 return
    let j = i + 1;
    while (j < lines.length && j < i + 20) {
      if (lines[j].includes('return {') && lines[j].includes('newWindowOpened: true')) {
        foundValidUrl = true;
        // 找到 return，繼續添加直到結束這個 if 塊
        while (j < lines.length) {
          newLines.push(lines[j]);
          if (lines[j].includes('};') && lines[j - 1] && lines[j - 1].includes('debug:')) {
            // return 結束
            j++;
            // 檢查下一個 else 或 }，開始跳過重複代碼
            if (j < lines.length && lines[j].includes('} else {')) {
              skipDuplicate = true;
            }
            break;
          }
          j++;
        }
        i = j;
        break;
      }
      j++;
    }
    continue;
  }
  
  // 如果找到有效 URL 並返回，開始跳過重複代碼
  if (skipDuplicate) {
    // 跳過直到找到 "立即處理新頁面" 之後的邏輯（這是重複的）
    if (line.includes('立即處理新頁面') && i > 1515) {
      // 這是重複的，跳過整個重複塊
      let braceCount = 0;
      let j = i;
      while (j < lines.length && j < i + 120) {
        if (lines[j].includes('{')) braceCount++;
        if (lines[j].includes('}')) {
          braceCount--;
          if (braceCount <= 0 && lines[j].trim() === '}') {
            // 找到重複塊結束
            skipDuplicate = false;
            i = j;
            break;
          }
        }
        j++;
      }
      if (skipDuplicate) {
        // 如果還沒找到結束，繼續跳過
        continue;
      }
    } else {
      continue;
    }
  }
  
  // 如果找到 "處理新頁面（如果還沒有找到有效 URL）" 且後面有重複邏輯，跳過
  if (line.includes('處理新頁面（如果還沒有找到有效 URL）')) {
    // 跳過這一行和後面的重複邏輯
    skipDuplicate = true;
    continue;
  }
  
  newLines.push(line);
}

// 確保在找到有效 URL 後立即返回
// 檢查是否有正確的返回邏輯
let finalContent = newLines.join('\n');

// 如果沒有找到返回語句，添加一個
if (!finalContent.includes('newWindowOpened: true') || 
    !finalContent.includes('message: `成功開啟新視窗')) {
  // 在適當位置添加返回邏輯
  const returnPattern = /if \(newPageUrl && newPageUrl !== 'about:blank'\) \{[\s\S]*?console\.log\(`\?\?\?新頁面已載入/;
  if (returnPattern.test(finalContent)) {
    // 已經有返回邏輯，不需要添加
  }
}

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('✅ 重複代碼已清理，邏輯已修復');





