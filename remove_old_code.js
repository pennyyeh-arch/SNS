const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// 找到並刪除第 1516-1546 行的舊代碼
// 這些是重複的簡化版本，應該被新的完整邏輯取代

let newLines = [];
let skipLines = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測舊代碼開始：在 } 之後，包含 "let waitCount = 0" 且是簡化版本
  if (i > 1514 && i < 1547 && 
      line.trim().startsWith('let waitCount = 0') && 
      i + 1 < lines.length && 
      lines[i + 1].includes('while ((newPageUrl === \'about:blank\'')) {
    // 開始跳過舊代碼，直到找到 } else { 且下一行是新的處理邏輯
    skipLines = true;
    continue;
  }
  
  // 如果正在跳過，檢查是否到達新代碼
  if (skipLines) {
    // 如果找到 "立即處理新頁面"，停止跳過
    if (line.includes('立即處理新頁面')) {
      skipLines = false;
      newLines.push(line);
      continue;
    }
    // 如果找到另一個 } else { 且下一行是 "立即處理新頁面"，停止跳過
    if (line.includes('} else {') && i + 1 < lines.length && lines[i + 1].includes('立即處理新頁面')) {
      skipLines = false;
      newLines.push(line);
      continue;
    }
    // 繼續跳過
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ 舊代碼已刪除');





