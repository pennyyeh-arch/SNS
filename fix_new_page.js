// 修復新頁面處理邏輯
// 將第 1410-1424 行替換為以下代碼

        console.log('立即處理新頁面，避免被關閉...');
        
        // 先快速檢查頁面狀態，不等待載入
        let isClosed = false;
        let newPageUrl = null;
        
        try {
          isClosed = newPage.isClosed();
          if (!isClosed) {
            newPageUrl = newPage.url();
            console.log(`新頁面初始 URL: ${newPageUrl}`);
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
                console.log(`找到另一個新頁面，URL: ${newPageUrl}`);
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
                      console.log(`找到另一個新頁面，URL: ${newPageUrl}`);
                      break;
                    }
                  }
                } else {
                  break;
                }
              } else {
                newPageUrl = newPage.url();
                if (newPageUrl && newPageUrl !== 'about:blank') {
                  console.log(`✅ 新頁面已導航到: ${newPageUrl}`);
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
        }





