// 修復新頁面檢測和保持開啟的邏輯
// 替換 routes/check.js 中第 1408-1450 行的內容

// 立即處理新頁面，避免被關閉
if (newPage) {
  try {
    console.log('立即處理新頁面，避免被關閉...');
    
    // 先檢查頁面是否已關閉
    let isClosed = false;
    try {
      isClosed = newPage.isClosed();
    } catch (e) {
      isClosed = true;
    }
    
    if (isClosed) {
      console.log('⚠️ 新頁面已關閉，尋找其他頁面...');
      const currentPages = context.pages();
      if (currentPages.length > originalPages) {
        newPage = currentPages[currentPages.length - 1];
        try {
          isClosed = newPage.isClosed();
        } catch (e) {
          isClosed = true;
        }
      }
    }
    
    if (!isClosed) {
      // 立即檢查 URL，不等待完整載入
      let newPageUrl = null;
      try {
        newPageUrl = newPage.url();
      } catch (e) {
        console.log('獲取 URL 時發生錯誤:', e.message);
      }
      
      // 如果還是 about:blank，快速等待導航
      let waitCount = 0;
      const maxWait = 20; // 最多等待 10 秒
      
      while ((!newPageUrl || newPageUrl === 'about:blank') && waitCount < maxWait) {
        // 檢查頁面是否已關閉
        try {
          if (newPage.isClosed()) {
            console.log('⚠️ 新頁面已關閉，尋找其他頁面...');
            const currentPages = context.pages();
            if (currentPages.length > originalPages) {
              newPage = currentPages[currentPages.length - 1];
              if (!newPage.isClosed()) {
                newPageUrl = newPage.url();
                if (newPageUrl && newPageUrl !== 'about:blank') {
                  break;
                }
              }
            } else {
              break;
            }
          } else {
            newPageUrl = newPage.url();
            if (newPageUrl && newPageUrl !== 'about:blank') {
              break;
            }
          }
        } catch (e) {
          if (e.message.includes('closed') || e.message.includes('Target page')) {
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
        
        await newPage.waitForTimeout(500);
        waitCount++;
      }
      
      // 如果還沒找到有效 URL，嘗試等待載入狀態（但不阻塞）
      if (!newPageUrl || newPageUrl === 'about:blank') {
        try {
          await newPage.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => {});
          if (!newPage.isClosed()) {
            newPageUrl = newPage.url();
          }
        } catch (e) {
          console.log('等待載入狀態時發生錯誤:', e.message);
        }
      }
      
      if (newPageUrl && newPageUrl !== 'about:blank') {
        console.log(`✅ 新頁面已載入: ${newPageUrl}`);
        const screenshot4 = path.join(debugDir, `streaming-now-new-window-${timestamp}.png`);
        await newPage.screenshot({ path: screenshot4, fullPage: false }).catch(() => {});
        
        debugInfo.clickMethod = clickMethod;
        debugInfo.newWindowUrl = newPageUrl;
        
        // 確保新頁面保持開啟
        console.log('✅ 新視窗已開啟並保持開啟狀態');
        
        return {
          found: true,
          newWindowOpened: true,
          newWindowUrl: newPageUrl,
          message: `成功開啟新視窗: ${newPageUrl} (使用 ${clickMethod})。視窗保持開啟狀態。`,
          debug: debugInfo
        };
      } else {
        console.log('⚠️ 新頁面仍然是 about:blank 或無法獲取 URL，繼續等待...');
      }
    }
  } catch (e) {
    console.log('處理新頁面時發生錯誤:', e.message);
    // 即使出錯，也檢查是否有其他新頁面
    try {
      const currentPages = context.pages();
      if (currentPages.length > originalPages) {
        const latestPage = currentPages[currentPages.length - 1];
        const latestUrl = latestPage.url();
        if (latestUrl && latestUrl !== 'about:blank') {
          console.log(`✅ 找到另一個新頁面: ${latestUrl}`);
          const screenshot4 = path.join(debugDir, `streaming-now-new-window-${timestamp}.png`);
          await latestPage.screenshot({ path: screenshot4, fullPage: false }).catch(() => {});
          
          debugInfo.clickMethod = clickMethod;
          debugInfo.newWindowUrl = latestUrl;
          
          return {
            found: true,
            newWindowOpened: true,
            newWindowUrl: latestUrl,
            message: `成功開啟新視窗: ${latestUrl} (使用 ${clickMethod})。視窗保持開啟狀態。`,
            debug: debugInfo
          };
        }
      }
    } catch (err) {
      console.log('檢查其他新頁面時發生錯誤:', err.message);
    }
  }
}





