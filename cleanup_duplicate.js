const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// 找到重複的舊代碼並刪除（第 1516-1546 行附近的舊邏輯）
let newLines = [];
let skipOldCode = false;
let skipCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測舊代碼開始（在 } else { 之後的舊邏輯）
  if (line.includes('} else {') && i > 1510 && i < 1550) {
    // 檢查下一行是否是新代碼的開始
    if (i + 1 < lines.length && lines[i + 1].includes('立即處理新頁面')) {
      // 這是新代碼，保留
      newLines.push(line);
      continue;
    }
    // 檢查是否是舊代碼（包含 waitCount = 0 的簡化版本）
    if (i + 2 < lines.length && lines[i + 2].trim().startsWith('let waitCount = 0') && 
        lines[i + 2].includes('while ((newPageUrl ===')) {
      // 這是舊代碼，跳過
      skipOldCode = true;
      skipCount = 30; // 跳過約 30 行舊代碼
      continue;
    }
  }
  
  if (skipOldCode && skipCount > 0) {
    skipCount--;
    // 檢查是否到達新代碼
    if (line.includes('立即處理新頁面')) {
      skipOldCode = false;
      skipCount = 0;
      newLines.push(line);
    }
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ 重複代碼已清理');





