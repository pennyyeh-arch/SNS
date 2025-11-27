const fs = require('fs');
const path = require('path');

// 讀取文件
const filePath = path.join(__dirname, 'routes', 'check.js');
let content = fs.readFileSync(filePath, 'utf8');

// 修復 1: 更新日誌訊息，移除 game02 相關
content = content.replace(/開始檢查 game02 視窗/g, '開始檢查 Streaming Now 下方的直播視窗');
content = content.replace(/game02 視窗檢查結果/g, 'Streaming Now 直播視窗檢查結果');
content = content.replace(/game02 視窗檢查失敗/g, 'Streaming Now 直播視窗檢查失敗');

// 修復 2: 替換新頁面處理邏輯（第 1410-1424 行）
const oldPattern = `        console.log('等?????????about:blank?..');
        await newPage.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
        
        // 等??????到實? URL（???about:blank?        let newPageUrl = newPage.url();
        let waitCount = 0;
        while ((newPageUrl === 'about:blank' || !newPageUrl) && waitCount < 10) {
          await newPage.waitForTimeout(500);
          try {
            newPageUrl = newPage.url();
          } catch (e) {
            console.log('???可?已??:', e.message);
            break;
          }
          waitCount++;
        }`;

const newPattern = `        console.log('立即處理新頁面，避免被關閉...');
        
        // 先快速檢查頁面狀態，不等待載入
        let isClosed = false;
        let newPageUrl = null;
        
        try {
          isClosed = newPage.isClosed();
          if (!isClosed) {
            newPageUrl = newPage.url();
            console.log(\`新頁面初始 URL: \${newPageUrl}\`);
          }
        } catch (e) {
          console.log('檢查新頁面狀態時發生錯誤:', e.message);
          isClosed = true;
        }
        
        // 如果頁面已關閉，立即尋找其他新頁面
        if (isClosed) {
          console.log('⚠️ 新頁面已關閉，立即尋找其他新頁面...');
          const currentPages = context.pages();
          if (currentPages.length > originalPages) {
            newPage = currentPages[currentPages.length - 1];
            try {
              isClosed = newPage.isClosed();
              if (!isClosed) {
                newPageUrl = newPage.url();
                console.log(\`找到另一個新頁面，URL: \${newPageUrl}\`);
              }
            } catch (e) {
              isClosed = true;
            }
          }
        }
        
        if (!isClosed) {
          // 快速循環檢查 URL，不等待完整載入
          let waitCount = 0;
          const maxWait = 15; // 最多等待 7.5 秒
          
          while ((!newPageUrl || newPageUrl === 'about:blank') && waitCount < maxWait) {
            // 每次循環都檢查頁面是否還開啟
            try {
              if (newPage.isClosed()) {
                console.log('⚠️ 新頁面在等待過程中關閉，尋找其他頁面...');
                const currentPages = context.pages();
                if (currentPages.length > originalPages) {
                  newPage = currentPages[currentPages.length - 1];
                  if (!newPage.isClosed()) {
                    newPageUrl = newPage.url();
                    if (newPageUrl && newPageUrl !== 'about:blank') {
                      console.log(\`找到另一個新頁面，URL: \${newPageUrl}\`);
                      break;
                    }
                  }
                } else {
                  break;
                }
              } else {
                newPageUrl = newPage.url();
                if (newPageUrl && newPageUrl !== 'about:blank') {
                  console.log(\`✅ 新頁面已導航到: \${newPageUrl}\`);
                  break;
                }
              }
            } catch (e) {
              if (e.message && (e.message.includes('closed') || e.message.includes('Target page'))) {
                console.log('新頁面已關閉:', e.message);
                const currentPages = context.pages();
                if (currentPages.length > originalPages) {
                  newPage = currentPages[currentPages.length - 1];
                  try {
                    if (!newPage.isClosed()) {
                      newPageUrl = newPage.url();
                      if (newPageUrl && newPageUrl !== 'about:blank') {
                        break;
                      }
                    }
                  } catch (err) {
                    console.log('檢查其他新頁面時發生錯誤:', err.message);
                  }
                }
                break;
              }
            }
            
            // 使用較短的等待時間
            await newPage.waitForTimeout(500);
            waitCount++;
          }
          
          // 如果還沒找到有效 URL，嘗試等待載入狀態（但使用較短的超時）
          if (!newPageUrl || newPageUrl === 'about:blank') {
            try {
              if (!newPage.isClosed()) {
                await newPage.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});
                if (!newPage.isClosed()) {
                  newPageUrl = newPage.url();
                }
              }
            } catch (e) {
              console.log('等待載入狀態時發生錯誤:', e.message);
            }
          }
        }`;

// 使用行號替換（更可靠）
const lines = content.split('\n');
let newContent = '';
let inTargetBlock = false;
let skipCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測目標區塊開始（第 1410 行附近）
  if (line.includes('等待新頁面載入') || line.includes('about:blank')) {
    if (line.includes('console.log') && line.includes('等待')) {
      // 開始替換
      newContent += newPattern.split('\n').join('\n') + '\n';
      skipCount = 14; // 跳過舊的 14 行代碼
      continue;
    }
  }
  
  if (skipCount > 0) {
    skipCount--;
    continue;
  }
  
  newContent += line + '\n';
}

// 如果沒有找到目標，嘗試直接替換
if (!newContent.includes('立即處理新頁面')) {
  // 使用更簡單的方法：找到包含 waitForLoadState 的行並替換
  const lines2 = content.split('\n');
  let newLines = [];
  let replaceNext = false;
  
  for (let i = 0; i < lines2.length; i++) {
    const line = lines2[i];
    
    if (line.includes('等待新頁面載入') || (line.includes('about:blank') && line.includes('console.log'))) {
      // 插入新的代碼
      newLines.push(...newPattern.split('\n'));
      replaceNext = true;
      continue;
    }
    
    if (replaceNext && (line.includes('waitForLoadState') || line.includes('newPageUrl = newPage.url()') && line.includes('let'))) {
      // 跳過舊代碼，直到找到 while 循環結束
      if (line.includes('while') || line.includes('waitCount++')) {
        continue;
      }
      if (line.includes('}') && line.trim().length < 3) {
        replaceNext = false;
        continue;
      }
      continue;
    }
    
    newLines.push(line);
  }
  
  newContent = newLines.join('\n');
}

// 寫回文件
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ 修復完成！');
console.log('已更新：');
console.log('1. 移除 game02 相關日誌');
console.log('2. 修復新頁面檢測邏輯，立即處理避免被關閉');





