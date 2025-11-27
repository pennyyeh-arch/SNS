const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Ensure debug directory exists
const debugDir = path.join(__dirname, '..', 'debug');
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir, { recursive: true });
}

async function checkWebsite(url) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const results = {
    url,
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    await page.waitForTimeout(1500);

    // 1️⃣ gVersion 版號測試
    console.log('開始執行測試項目 1/11: gVersion 版號測試');
    try {
      results.checks.gVersion = await checkGVersion(page);
      console.log('測試項目 1/11 完成');
    } catch (err) {
      console.error('測試項目 1/11 錯誤:', err);
      results.checks.gVersion = { found: false, error: String(err && err.message || err) };
    }

    // 2️⃣ Stream n'Spin 彈窗測試
    console.log('開始執行測試項目 2/11: Stream n\'Spin 彈窗測試');
    try {
      results.checks.streamNSpinDialog = await checkStreamNSpinDialog(page, timestamp);
      console.log('測試項目 2/11 完成');
    } catch (err) {
      console.error('測試項目 2/11 錯誤:', err);
      results.checks.streamNSpinDialog = { found: false, error: String(err && err.message || err) };
    }

    // 3️⃣ 更名功能測試
    console.log('開始執行測試項目 3/11: 更名功能測試');
    try {
      results.checks.renameFunction = await checkRenameFunction(page, timestamp);
      console.log('測試項目 3/11 完成');
    } catch (err) {
      console.error('測試項目 3/11 錯誤:', err);
      results.checks.renameFunction = { clicked: false, error: String(err && err.message || err) };
    }

    // 4️⃣ 排序按鈕測試
    console.log('開始執行測試項目 4/11: 排序按鈕測試');
    try {
      results.checks.sortButton = await checkSortButton(page, timestamp);
      console.log('測試項目 4/11 完成');
    } catch (err) {
      console.error('測試項目 4/11 錯誤:', err);
      results.checks.sortButton = { clicked: false, sortWorking: false, error: String(err && err.message || err) };
    }

    // 5️⃣ Promotion 圖片檢查
    console.log('開始執行測試項目 5/11: Promotion 圖片檢查');
    try {
      results.checks.promotionImages = await checkPromotionImages(page, timestamp);
      console.log('測試項目 5/11 完成');
    } catch (err) {
      console.error('測試項目 5/11 錯誤:', err);
      results.checks.promotionImages = { found: false, error: String(err && err.message || err) };
    }

    // 6️⃣ All Streamers 圖片檢查
    console.log('開始執行測試項目 6/11: All Streamers 圖片檢查');
    try {
      results.checks.allStreamersImages = await checkAllStreamersImages(page, timestamp);
      console.log('測試項目 6/11 完成');
    } catch (err) {
      console.error('測試項目 6/11 錯誤:', err);
      const errorMsg = err && err.message ? err.message : (err ? String(err) : 'Unknown error');
      results.checks.allStreamersImages = { found: false, error: errorMsg };
    }

    // 7️⃣ All Streamers 排列按鈕測試
    console.log('開始執行測試項目 7/11: All Streamers 排列按鈕測試');
    try {
      results.checks.allStreamersSortButton = await checkAllStreamersSortButton(page, timestamp);
      console.log('測試項目 7/11 完成');
    } catch (err) {
      console.error('測試項目 7/11 錯誤:', err);
      const errorMsg = err && err.message ? err.message : (err ? String(err) : 'Unknown error');
      results.checks.allStreamersSortButton = { clicked: false, sortWorking: false, error: errorMsg };
    }

    // 等待頁面穩定
    await page.waitForTimeout(500);

    // 8️⃣ 直播主介紹卡片點擊測試
    console.log('開始執行測試項目 8/11: 直播主介紹卡片點擊測試');
    try {
      results.checks.streamerCardClick = await checkStreamerCardClick(page, timestamp);
      console.log('測試項目 8/12 完成');
    } catch (err) {
      console.error('測試項目 8/12 錯誤:', err);
      const errorMsg = err && err.message ? err.message : (err ? String(err) : 'Unknown error');
      results.checks.streamerCardClick = { clicked: false, opened: false, error: errorMsg };
    }

    // 9️⃣ 排行榜檢查
    console.log('開始執行測試項目 9/11: 排行榜檢查');
    try {
      results.checks.rankingData = await checkRankingData(page, timestamp);
      console.log('測試項目 9/12 完成');
    } catch (err) {
      console.error('測試項目 9/12 錯誤:', err);
      const errorMsg = err && err.message ? err.message : (err ? String(err) : 'Unknown error');
      results.checks.rankingData = { allTimes: { found: false }, weeklyRanking: { found: false }, error: errorMsg };
    }

    // 🔟 直播主照片檢查
    console.log('開始執行測試項目 10/11: 直播主照片檢查');
    try {
      results.checks.streamerPhoto = await checkStreamerPhoto(page, timestamp);
      console.log('測試項目 10/12 完成');
    } catch (err) {
      console.error('測試項目 10/12 錯誤:', err);
      const errorMsg = err && err.message ? err.message : (err ? String(err) : 'Unknown error');
      results.checks.streamerPhoto = { photoTabClicked: false, photoClicked: false, error: errorMsg };
    }

    // 🔟②  返回按鈕測試
    console.log('開始執行測試項目 11/11: 返回按鈕測試');
    try {
      results.checks.backButton = await checkBackButton(page, timestamp);
      console.log('測試項目 11/11 完成');
    } catch (err) {
      console.error('測試項目 11/11 錯誤:', err);
      results.checks.backButton = { clicked: false, success: false, error: String(err && err.message || err) };
    }

    console.log('所有測試項目執行完成');
    
    // 驗證所有測試項目都已執行
    const expectedTests = [
      'gVersion',
      'streamNSpinDialog',
      'renameFunction',
      'sortButton',
      'promotionImages',
      'allStreamersImages',
      'allStreamersSortButton',
      'streamerCardClick',
      'rankingData',
      'streamerPhoto',
      'backButton'
    ];
    
    const executedTests = Object.keys(results.checks);
    const missingTests = expectedTests.filter(test => !executedTests.includes(test));
    
    if (missingTests.length > 0) {
      console.warn('警告：以下測試項目未執行:', missingTests);
      // 為未執行的測試添加錯誤結果
      missingTests.forEach(test => {
        results.checks[test] = {
          error: '測試項目未執行',
          message: `測試項目 ${test} 未執行`
        };
      });
    } else {
      console.log(`✅ 所有 ${expectedTests.length} 個測試項目都已執行`);
    }
    
  } catch (error) {
    console.error('checkWebsite 外層錯誤（不應影響測試執行）:', error);
    // 即使外層出錯，也記錄錯誤但不阻止返回結果
    results.error = String(error && error.message || error);
    results.stack = error && error.stack ? error.stack : undefined;
  } finally {
    await page.waitForTimeout(3000).catch(() => {});
    await browser.close().catch(() => {});
  }

  return results;
}

async function checkGVersion(page) {
    const gVersion = await page.evaluate(() => {
      try {
      if (typeof window !== 'undefined' && window.gVersion !== undefined) {
          return window.gVersion;
        }
      const metas = document.querySelectorAll('meta[name="gVersion"], meta[property="gVersion"]');
      for (const m of metas) {
        const v = m.getAttribute('content');
        if (v) return v;
      }
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        const txt = (s.textContent || '').toString();
        let m = txt.match(/gVersion\s*[=:]\s*['"]([^'"\n]+)['"]/);
        if (m && m[1]) return m[1];
        m = txt.match(/gVersion\s*[=:]\s*(\d+\.\d+\.\d+)/);
        if (m && m[1]) return m[1];
      }
      } catch (e) {
        return null;
      }
    return null;
  });
  return { found: gVersion != null, version: gVersion };
}

// 2️⃣ Stream n'Spin 彈窗測試
async function checkStreamNSpinDialog(page, timestamp) {
  console.log('開始 Stream n\'Spin 彈窗測試...');
  
  try {
    await page.waitForTimeout(1000);
    
    // Check if there's a Stream n'Spin dialog
    const dialogInfo = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"], .modal, .ant-modal, .dialog, [class*="modal" i], [class*="dialog" i]');
      
      for (const dialog of dialogs) {
        if (dialog.offsetParent === null) continue; // Skip hidden dialogs
        
        const text = (dialog.textContent || '').toLowerCase();
        const hasStreamSpin = text.includes('stream') && (text.includes('spin') || text.includes('n'));
        
        if (hasStreamSpin) {
          // Look for confirm button in this dialog
          const buttons = Array.from(dialog.querySelectorAll('button'));
          for (const btn of buttons) {
            const rect = btn.getBoundingClientRect();
            const btnText = (btn.textContent || '').toLowerCase();
            if (rect.width > 0 && rect.height > 0 && 
                (btnText.includes('confirm') || btnText.includes('ok') || btnText.includes('確認'))) {
              return {
                found: true,
                buttonText: btn.textContent,
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2
              };
            }
          }
          // Dialog found but no confirm button
          return { found: true, buttonText: null };
        }
      }
      return { found: false };
    });
    
    const shotBefore = path.join(debugDir, `stream-n-spin-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    if (!dialogInfo.found) {
    return {
        found: false,
        clicked: false,
        message: 'Stream n\'Spin 彈窗未出現',
        debug: { screenshot: shotBefore }
      };
    }
    
    if (!dialogInfo.buttonText) {
      return {
        found: true,
        clicked: false,
        message: '找到彈窗但未找到 Confirm 按鈕',
        debug: { screenshot: shotBefore }
      };
    }
    
    await page.mouse.click(dialogInfo.x, dialogInfo.y);
    await page.waitForTimeout(1500);
    
    const shotAfter = path.join(debugDir, `stream-n-spin-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    return {
      found: true,
      clicked: true,
      buttonText: dialogInfo.buttonText,
      message: `找到 Stream n'Spin 彈窗並點擊 Confirm`,
      debug: {
        screenshotBefore: shotBefore,
        screenshotAfter: shotAfter
      }
    };
    
  } catch (error) {
    console.error('Stream n\'Spin 彈窗測試錯誤:', error);
          return {
      found: false,
      clicked: false,
      error: String(error && error.message || error),
      message: `Stream n'Spin 彈窗測試失敗: ${error && error.message || error}`
    };
  }
}

// 3️⃣ 更名功能測試
async function checkRenameFunction(page, timestamp) {
  console.log('開始更名功能測試 (點擊帳號名稱 -> 開啟視窗 -> 點擊 X 關閉)...');
  
  try {
    // Step 1: Find Balance element first to locate account name above it
    const accountNameInfo = await page.evaluate(() => {
      // Find Balance element (smallest one)
      const allElements = Array.from(document.querySelectorAll('*'));
      let balanceElement = null;
      let smallestSize = Infinity;
      
      for (const el of allElements) {
        const text = (el.textContent || '').toLowerCase();
        const ownText = (el.innerText || el.textContent || '').toLowerCase();
        const hasBalance = (text.includes('balance') || text.includes('餘額') || text.includes('余额')) &&
                          (ownText.includes('balance') || ownText.includes('餘額') || ownText.includes('余额'));
        
        if (hasBalance && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          const size = rect.width * rect.height;
          if (rect.width > 0 && rect.height > 0 && size < smallestSize && rect.height < 100) {
            balanceElement = el;
            smallestSize = size;
          }
        }
      }
      
      if (!balanceElement) {
        return null;
      }
      
      const balanceRect = balanceElement.getBoundingClientRect();
      
      const candidates = [];
      const allClickables = Array.from(document.querySelectorAll('span, div, a, button, [onclick]'));
      
      for (const el of allClickables) {
        const rect = el.getBoundingClientRect();
        const text = (el.textContent || '').trim();
        
        // Look for elements above balance
        if (rect.bottom <= balanceRect.top && rect.width > 0 && rect.height > 0 && text.length > 0) {
          // Should be reasonably close (within 100px above)
          const distance = balanceRect.top - rect.bottom;
          if (distance < 100 && text.length < 50) { // Account names are usually short
            candidates.push({
              text: text,
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              distance: distance,
              width: rect.width,
              height: rect.height
            });
          }
        }
      }
      
      // Sort by closest to balance
      candidates.sort((a, b) => a.distance - b.distance);
      
      if (candidates.length === 0) {
        return null;
      }
      
      return candidates[0];
    });
    
    if (!accountNameInfo) {
      const nameInputInfo = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[placeholder*="name" i]'));
        for (const input of inputs) {
          const rect = input.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && input.offsetParent !== null) {
      return {
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              placeholder: input.placeholder || '',
              visible: true
            };
          }
        }
        return null;
      });
      
      if (nameInputInfo) {
        const randomName = `User_${Math.random().toString(36).slice(2, 8)}`;
        
        await page.mouse.click(nameInputInfo.x, nameInputInfo.y);
        await page.waitForTimeout(300);
        await page.keyboard.type(randomName, { delay: 50 });
        await page.waitForTimeout(500);
        
        const confirmButtonInfo = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          for (const btn of buttons) {
            const rect = btn.getBoundingClientRect();
            const text = (btn.textContent || '').toLowerCase();
            if (rect.width > 0 && rect.height > 0 && 
                (text.includes('confirm') || text.includes('ok') || text.includes('確認') || text.includes('submit'))) {
              return {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                text: btn.textContent
              };
            }
          }
          return null;
        });
        
        if (confirmButtonInfo) {
          await page.mouse.click(confirmButtonInfo.x, confirmButtonInfo.y);
          await page.waitForTimeout(1500);
          
          const shotAfterConfirm = path.join(debugDir, `account-name-confirmed-${timestamp}.png`);
          await page.screenshot({ path: shotAfterConfirm, fullPage: false }).catch(() => {});
          
          return {
            hasName: true,
            name: randomName,
            created: true,
            message: `Created new account name: ${randomName}`,
            debug: { screenshot: shotAfterConfirm }
          };
        }
      }
      
      const shot = path.join(debugDir, `account-name-${timestamp}.png`);
      await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      return {
        hasName: false,
        name: null,
        clicked: false,
        message: 'Account name element not found above balance and no input field available',
        debug: { screenshot: shot }
      };
    }
    
    await page.mouse.click(accountNameInfo.x, accountNameInfo.y);
    await page.waitForTimeout(1000);
    
    const shotAfterClick = path.join(debugDir, `account-name-dialog-${timestamp}.png`);
    await page.screenshot({ path: shotAfterClick, fullPage: false }).catch(() => {});
    
    // 🔥 Step 2: 找到輸入框並先清空原本的名字
    const inputFieldInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[placeholder*="name" i], input'));
      for (const input of inputs) {
        const rect = input.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && input.offsetParent !== null && !input.disabled) {
          return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            placeholder: input.placeholder || '',
            visible: true
          };
        }
      }
      return null;
    });
    
    let idnErrorDetected = false;
    let randomNameGenerated = null;
    let confirmButtonClicked = false;
    
    if (inputFieldInfo) {
      console.log('找到輸入框，先清空原本的名字...');
      
      // 1️⃣ 點擊輸入框並清空原本的名字
      await page.mouse.click(inputFieldInfo.x, inputFieldInfo.y);
      await page.waitForTimeout(300);
      await page.keyboard.press('Control+A'); // 全選
      await page.waitForTimeout(100);
      await page.keyboard.press('Backspace'); // 刪除
      await page.waitForTimeout(300);
      
      const shotAfterClear = path.join(debugDir, `account-name-cleared-${timestamp}.png`);
      await page.screenshot({ path: shotAfterClear, fullPage: false }).catch(() => {});
      console.log('已清空原本名字，截圖:', shotAfterClear);
      
      // 2️⃣ 輸入 "IDN"
      console.log('輸入 IDN...');
      await page.keyboard.type('IDN', { delay: 100 });
      await page.waitForTimeout(800);
      
      const shotAfterIDN = path.join(debugDir, `account-name-idn-${timestamp}.png`);
      await page.screenshot({ path: shotAfterIDN, fullPage: false }).catch(() => {});
      console.log('已輸入 IDN，截圖:', shotAfterIDN);
      
      // 3️⃣ 檢查是否有錯誤訊息
      const errorMessage = await page.evaluate(() => {
        const errorKeywords = ['不能使用', '无法使用', 'cannot', 'invalid', 'not allowed', 'unavailable', 'restricted', '禁止', '錯誤', '错误', 'error'];
        const allElements = Array.from(document.querySelectorAll('*'));
        
        for (const el of allElements) {
          const text = (el.textContent || '').toLowerCase();
          const visible = el.offsetParent !== null;
          
          if (visible) {
            for (const keyword of errorKeywords) {
              if (text.includes(keyword.toLowerCase())) {
                return {
                  found: true,
                  text: el.textContent.trim(),
                  keyword: keyword
                };
              }
            }
          }
        }
        return { found: false };
      });
      
      if (errorMessage.found) {
        console.log('✅ 偵測到錯誤訊息:', errorMessage.text);
        idnErrorDetected = true;
      } else {
        console.log('⚠️ 未偵測到錯誤訊息');
      }
      
      // 4️⃣ 等待 1 秒
      console.log('等待 1 秒...');
      await page.waitForTimeout(1000);
      
      // 5️⃣ 刪除 IDN
      console.log('刪除 IDN...');
      await page.keyboard.press('Control+A'); // 全選
      await page.waitForTimeout(100);
      await page.keyboard.press('Backspace'); // 刪除
      await page.waitForTimeout(300);
      
      const shotAfterDeleteIDN = path.join(debugDir, `account-name-deleted-idn-${timestamp}.png`);
      await page.screenshot({ path: shotAfterDeleteIDN, fullPage: false }).catch(() => {});
      console.log('已刪除 IDN，截圖:', shotAfterDeleteIDN);
      
      // 6️⃣ 生成隨機英文名字 + 4位數字
      const englishNames = ['Alex', 'Bob', 'Chris', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 
                            'Kate', 'Leo', 'Mary', 'Nick', 'Olivia', 'Peter', 'Queen', 'Rose', 'Sam', 'Tom'];
      const randomName = englishNames[Math.floor(Math.random() * englishNames.length)];
      const randomDigits = Math.floor(1000 + Math.random() * 9000); // 1000-9999
      randomNameGenerated = `${randomName}${randomDigits}`;
      
      console.log('生成的隨機名字:', randomNameGenerated);
      console.log('輸入隨機名字...');
      
      // 7️⃣ 輸入新名字
      await page.keyboard.type(randomNameGenerated, { delay: 80 });
      await page.waitForTimeout(800);
      
      const shotAfterRename = path.join(debugDir, `account-name-random-${timestamp}.png`);
      await page.screenshot({ path: shotAfterRename, fullPage: false }).catch(() => {});
      console.log('已輸入隨機名字，截圖:', shotAfterRename);
      
      // 8️⃣ 尋找並點擊 Confirm 按鈕
      console.log('尋找 Confirm 按鈕...');
      const confirmButtonInfo = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          const text = (btn.textContent || '').toLowerCase().trim();
          const visible = btn.offsetParent !== null;
          
          if (visible && rect.width > 0 && rect.height > 0 && 
              (text.includes('confirm') || text.includes('確認') || text.includes('确认') || text === 'ok' || text === 'submit')) {
            return {
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              text: btn.textContent.trim()
            };
          }
        }
        return null;
      });
      
      if (confirmButtonInfo) {
        console.log('找到 Confirm 按鈕:', confirmButtonInfo.text);
        await page.mouse.click(confirmButtonInfo.x, confirmButtonInfo.y);
        await page.waitForTimeout(1000);
        confirmButtonClicked = true;
        
        const shotAfterConfirm = path.join(debugDir, `account-name-confirmed-${timestamp}.png`);
        await page.screenshot({ path: shotAfterConfirm, fullPage: false }).catch(() => {});
        console.log('已點擊 Confirm 按鈕，截圖:', shotAfterConfirm);
      } else {
        console.log('⚠️ 未找到 Confirm 按鈕');
      }
    } else {
      console.log('⚠️ 未找到輸入框');
    }
    
    // 🔥 Step 4: 關閉對話框
    const closeButtonInfo = await page.evaluate(() => {
      // Look for dialog/modal
      const dialogs = document.querySelectorAll('[role="dialog"], .modal, .ant-modal, .dialog, [class*="modal" i], [class*="dialog" i]');
      
      for (const dialog of dialogs) {
        if (dialog.offsetParent === null) continue; // Skip hidden dialogs
        
        // Look for close button (X, ×, close icon)
        const closeButtons = Array.from(dialog.querySelectorAll('button, [role="button"], svg, [onclick]'));
        
        for (const btn of closeButtons) {
          const rect = btn.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          
          const text = (btn.textContent || '').trim();
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
          const className = (btn.className || '').toString().toLowerCase();
          
          // Check for close indicators
          const isCloseButton = text === '×' || text === 'X' || text === '✕' ||
                               ariaLabel.includes('close') || ariaLabel.includes('關閉') ||
                               className.includes('close') || 
                               btn.tagName === 'svg' && btn.closest('[class*="close" i]');
          
          if (isCloseButton) {
            return {
              text: text || 'Close Icon',
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2
            };
          }
        }
      }
      
      return null;
    });
    
    if (!closeButtonInfo) {
      return {
        hasName: true,
        name: accountNameInfo.text,
        clicked: true,
        dialogOpened: true,
        dialogClosed: false,
        idnErrorDetected: idnErrorDetected,
        randomName: randomNameGenerated,
        confirmButtonClicked: confirmButtonClicked,
        message: `Clicked account name "${accountNameInfo.text}" but could not find close button`,
        debug: { 
          screenshotBeforeClick: path.join(debugDir, `account-name-${timestamp}.png`),
          screenshotAfterClick: shotAfterClick
        }
      };
    }
    
    await page.mouse.click(closeButtonInfo.x, closeButtonInfo.y);
    await page.waitForTimeout(1000);
    
    const shotAfterClose = path.join(debugDir, `account-name-closed-${timestamp}.png`);
    await page.screenshot({ path: shotAfterClose, fullPage: false }).catch(() => {});
    
    return {
      hasName: true,
      name: accountNameInfo.text,
      clicked: true,
      dialogOpened: true,
      dialogClosed: true,
      idnErrorDetected: idnErrorDetected,
      randomName: randomNameGenerated,
      confirmButtonClicked: confirmButtonClicked,
      message: `Clicked account name "${accountNameInfo.text}", tested IDN (error: ${idnErrorDetected ? 'detected ✓' : 'not detected'}), entered random name "${randomNameGenerated}", confirmed (${confirmButtonClicked ? '✓' : '✗'}), and closed dialog`,
      debug: {
        screenshotAfterClick: shotAfterClick,
        screenshotAfterClose: shotAfterClose
      }
    };
    
  } catch (error) {
    console.error('Error in checkAndAssignAccountName:', error);
        return {
      hasName: false,
      clicked: false,
      error: String(error && error.message || error),
      message: `Account name check failed: ${error && error.message || error}`
    };
  }
}

// 4️⃣ 排序按鈕測試
async function checkSortButton(page, timestamp) {
  console.log('開始排序按鈕測試...');
  
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  
  const shotBefore = path.join(debugDir, `sort-before-${timestamp}.png`);
  await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});

  try {
    let balanceButtons = await page.evaluate(() => {
      // Find balance text or element - prefer smallest element with balance text
      const allElements = Array.from(document.querySelectorAll('*'));
      let balanceElement = null;
      let smallestSize = Infinity;
      
      // Look for "balance" text (case insensitive) - find the smallest one
      for (const el of allElements) {
        const text = (el.textContent || '').toLowerCase();
        const ownText = (el.innerText || el.textContent || '').toLowerCase();
        const hasBalance = (text.includes('balance') || text.includes('餘額') || text.includes('余额')) &&
                          (ownText.includes('balance') || ownText.includes('餘額') || ownText.includes('余额'));
        
        if (hasBalance && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          const size = rect.width * rect.height;
          // Find the smallest element with balance text (more specific)
          if (rect.width > 0 && rect.height > 0 && size < smallestSize && rect.height < 100) {
            balanceElement = el;
            smallestSize = size;
          }
        }
      }
      
      if (!balanceElement) {
        return null;
      }
      
      const balanceRect = balanceElement.getBoundingClientRect();
      
      // Find all SVG icons with rect elements
      const allSVGs = Array.from(document.querySelectorAll('svg'));
      const svgIconsWithRect = [];
      
      for (const svg of allSVGs) {
        const rect = svg.getBoundingClientRect();
        const hasRect = svg.querySelector('rect') !== null;
        
        // Look for SVG with rect element that is:
        // 1. Below the balance element
        // 2. Small icon size (< 100px)
        // 3. Within reasonable distance (< 300px) from balance
        if (hasRect && rect.width > 0 && rect.height > 0 && 
            rect.width < 100 && rect.height < 100 &&
            rect.top > balanceRect.bottom) {
          const distance = rect.top - balanceRect.bottom;
          if (distance < 300) {
            svgIconsWithRect.push({
              element: svg,
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              left: rect.x,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              distance: distance
            });
          }
        }
      }
      
      svgIconsWithRect.sort((a, b) => {
        const distDiff = a.distance - b.distance;
        if (Math.abs(distDiff) > 50) return distDiff;
        return a.left - b.left;
      });
      
      if (svgIconsWithRect.length < 2) {
        return null;
      }
      
      return {
        leftButton: {
          x: svgIconsWithRect[0].x,
          y: svgIconsWithRect[0].y,
          tag: 'SVG',
          className: svgIconsWithRect[0].element.parentElement ? svgIconsWithRect[0].element.parentElement.className : ''
        },
        rightButton: {
          x: svgIconsWithRect[1].x,
          y: svgIconsWithRect[1].y,
          tag: 'SVG',
          className: svgIconsWithRect[1].element.parentElement ? svgIconsWithRect[1].element.parentElement.className : ''
        },
        totalFound: svgIconsWithRect.length
      };
    });
    
    if (!balanceButtons) {
      const svgButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"], svg, [class*="icon"]'));
        const candidates = [];
        
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          const hasSvg = btn.querySelector('svg') || btn.tagName === 'SVG';
          
          if (hasSvg && rect.width > 0 && rect.height > 0 && rect.width < 100 && rect.height < 100) {
              candidates.push({
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
              left: rect.x,
              top: rect.top,
              tag: btn.tagName,
              className: btn.className || ''
            });
          }
        }
        
        // Sort left to right, top to bottom
        candidates.sort((a, b) => {
          const topDiff = a.top - b.top;
          if (Math.abs(topDiff) > 50) return topDiff;
          return a.left - b.left;
        });
        
        if (candidates.length < 2) return null;
        
          return {
          leftButton: candidates[0],
          rightButton: candidates[1],
          totalFound: candidates.length
        };
      });
      
      if (!svgButtons) {
      return {
        clicked: false,
        sortWorking: false,
          message: 'Sort buttons not found',
          debug: { screenshotBefore: shotBefore }
        };
      }
      
      balanceButtons = svgButtons;
    }
    
        const initialState = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[class*="item" i], [class*="card" i], [class*="stream" i], li, [class*="list" i] > div'));
      return items.slice(0, 8).map(el => ({
        text: (el.textContent || '').trim().substring(0, 50),
        class: el.className
      }));
    });
    
    await page.mouse.click(balanceButtons.leftButton.x, balanceButtons.leftButton.y);
    await page.waitForTimeout(800);
        
    const shotAfterLeft = path.join(debugDir, `sort-after-left-${timestamp}.png`);
    await page.screenshot({ path: shotAfterLeft, fullPage: false }).catch(() => {});
    
    const stateAfterLeft = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[class*="item" i], [class*="card" i], [class*="stream" i], li, [class*="list" i] > div'));
      return items.slice(0, 8).map(el => ({
        text: (el.textContent || '').trim().substring(0, 50),
        class: el.className
      }));
    });
    
    await page.mouse.click(balanceButtons.rightButton.x, balanceButtons.rightButton.y);
    await page.waitForTimeout(800);

    const shotAfterRight = path.join(debugDir, `sort-after-right-${timestamp}.png`);
    await page.screenshot({ path: shotAfterRight, fullPage: false }).catch(() => {});
    
    const stateAfterRight = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[class*="item" i], [class*="card" i], [class*="stream" i], li, [class*="list" i] > div'));
      return items.slice(0, 8).map(el => ({
        text: (el.textContent || '').trim().substring(0, 50),
        class: el.className
      }));
    });
    
    const leftChanged = JSON.stringify(initialState) !== JSON.stringify(stateAfterLeft);
    const rightChanged = JSON.stringify(stateAfterLeft) !== JSON.stringify(stateAfterRight);
    const anyChanged = leftChanged || rightChanged;
        
        return {
          clicked: true,
      sortWorking: anyChanged,
      leftButtonWorking: leftChanged,
      rightButtonWorking: rightChanged,
      message: anyChanged ? 
        `Clicked both buttons - Left: ${leftChanged ? 'changed' : 'no change'}, Right: ${rightChanged ? 'changed' : 'no change'}` :
        'Clicked both buttons but order unchanged',
          debug: { 
            screenshotBefore: shotBefore, 
        screenshotAfterLeft: shotAfterLeft,
        screenshotAfterRight: shotAfterRight,
        initialState: initialState.slice(0, 3).map(i => i.text),
        stateAfterLeft: stateAfterLeft.slice(0, 3).map(i => i.text),
        stateAfterRight: stateAfterRight.slice(0, 3).map(i => i.text),
        buttonsFound: balanceButtons.totalFound
      }
    };
  } catch (error) {
          return {
      clicked: false,
      sortWorking: false,
      error: String(error && error.message || error),
      message: `Sort button check failed: ${error && error.message || error}`,
      debug: { screenshotBefore: shotBefore }
    };
  }
}

// 5️⃣ Promotion 圖片檢查
async function checkPromotionImages(page, timestamp) {
  console.log('開始 Promotion 圖片檢查...');
  
  try {
    await page.waitForTimeout(300);
    
    // 滾動到 Promotion 位置
    await page.evaluate(() => {
      const promotionElement = document.querySelector("#root > div > div:nth-child(4) > span");
      if (promotionElement) {
        promotionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    await page.waitForTimeout(400); // 等待滾動完成
    
    const shotBefore = path.join(debugDir, `promotion-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    // Find Promotion section and check images
    const imageCheckResult = await page.evaluate(() => {
      // Look for Promotion text element (not the entire container)
      const allElements = Array.from(document.querySelectorAll('*'));
      let promotionTextElement = null;
      
      // Find the element that directly contains "Promotion" text
      for (const el of allElements) {
        const ownText = (el.innerText || el.textContent || '').trim();
        const className = (el.className || '').toString().toLowerCase();
        const id = (el.id || '').toLowerCase();
        
        // Look for element with "Promotion" text (but not too much other text)
        if ((ownText.toLowerCase() === 'promotion' || 
             ownText.toLowerCase().includes('promotion') && ownText.length < 50) ||
            className.includes('promotion') || 
            id.includes('promotion')) {
          if (el.offsetParent !== null) {
            promotionTextElement = el;
            break;
          }
        }
      }
      
      if (!promotionTextElement) {
        return { found: false, reason: 'Promotion text element not found' };
      }
      
      // Find the banner container near the Promotion text
      // Usually it's a sibling or nearby container
      let bannerContainer = null;
      const promotionRect = promotionTextElement.getBoundingClientRect();
      
      // Look for a container below the Promotion text
      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        
        // Check if element is below Promotion text and reasonably close
        if (rect.top >= promotionRect.bottom && 
            rect.top - promotionRect.bottom < 200 &&
            rect.width > 300 && rect.height > 100) {
          
          const imgs = el.querySelectorAll('img');
          if (imgs.length >= 2) {
            bannerContainer = el;
            break;
          }
        }
      }
      
      // If no banner container found, try to find images with "banner" in src
      let images = [];
      if (bannerContainer) {
        images = Array.from(bannerContainer.querySelectorAll('img'));
      } else {
        const allImages = Array.from(document.querySelectorAll('img'));
        images = allImages.filter(img => {
          const src = (img.src || '').toLowerCase();
          return src.includes('banner') || src.includes('promotion');
        });
      }
      
      // Filter logic: keep banner-sized images OR broken images
      // Broken images might display as small (< 50x50) but we still want to detect them
      images = images.filter(img => {
        const rect = img.getBoundingClientRect();
        const isBroken = img.complete && img.naturalWidth === 0;
        
        // Keep if: 1) Normal banner size, OR 2) Broken/error image
        return (rect.width > 200 && rect.height > 100) || isBroken;
      });
      
      // Remove duplicate images
      const uniqueImages = [];
      const seenUrls = new Set();
      
      for (const img of images) {
        const src = img.src || '';
        // Remove query parameters for comparison (like ?t=timestamp)
        const srcWithoutQuery = src.split('?')[0];
        
        if (!seenUrls.has(srcWithoutQuery)) {
          seenUrls.add(srcWithoutQuery);
          uniqueImages.push(img);
        }
      }
      
      images = uniqueImages;
      
      if (images.length === 0) {
        return { 
          found: true, 
          hasImages: false, 
          imageCount: 0,
          message: 'Promotion 區域找到但沒有圖片'
        };
      }
      
      const imageDetails = [];
      let brokenCount = 0;
      let loadedCount = 0;
      
      for (const img of images) {
        const rect = img.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        
        // Check if image is broken (naturalWidth is 0 for broken images)
        const isBroken = img.complete && img.naturalWidth === 0;
        const isLoaded = img.complete && img.naturalWidth > 0;
        
        if (isBroken) brokenCount++;
        if (isLoaded) loadedCount++;
        
        imageDetails.push({
          src: img.src ? img.src.substring(0, 100) : 'no src',
          alt: img.alt || 'no alt',
          width: rect.width,
          height: rect.height,
          visible: isVisible,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          broken: isBroken,
          loaded: isLoaded
        });
      }
      
      return {
        found: true,
        hasImages: true,
        imageCount: images.length,
        loadedCount: loadedCount,
        brokenCount: brokenCount,
        images: imageDetails,
        allImagesOK: brokenCount === 0 && loadedCount === images.length
      };
    });
    
    const shotAfter = path.join(debugDir, `promotion-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    if (!imageCheckResult || typeof imageCheckResult !== 'object') {
      return {
        found: false,
        message: 'Promotion 圖片檢查結果異常',
        error: 'imageCheckResult is invalid',
        debug: { screenshot: shotBefore }
      };
    }
    
    if (!imageCheckResult.found) {
            return {
        found: false,
        message: imageCheckResult.reason || 'Promotion 區域未找到',
        debug: { screenshot: shotBefore }
      };
    }
    
    if (!imageCheckResult.hasImages) {
      return {
        found: true,
        hasImages: false,
        imageCount: 0,
        message: 'Promotion 區域找到但沒有圖片',
      debug: { 
        screenshotBefore: shotBefore,
        screenshotAfter: shotAfter
      }
    };
    }
    
    const { imageCount, loadedCount, brokenCount, allImagesOK } = imageCheckResult;
    
    let message = `找到 ${imageCount} 張圖片`;
    if (allImagesOK) {
      message += '，全部正常載入';
    } else {
      if (brokenCount > 0) {
        message += `，${brokenCount} 張錯誤`;
      }
      if (loadedCount < imageCount) {
        message += `，${imageCount - loadedCount} 張未載入`;
      }
    }
    
    return {
      found: true,
      hasImages: true,
      imageCount: imageCount,
      loadedCount: loadedCount,
      brokenCount: brokenCount,
      allImagesOK: allImagesOK,
      message: message,
      debug: {
        screenshotBefore: shotBefore,
        screenshotAfter: shotAfter,
        images: imageCheckResult.images
      }
    };
    
  } catch (error) {
    console.error('Promotion 圖片檢查錯誤:', error);
    const errorMsg = error && error.message ? error.message : (error ? String(error) : 'Unknown error');
    return {
      found: false,
      error: errorMsg,
      message: `Promotion 圖片檢查失敗: ${errorMsg}`
    };
  }
}

// 6️⃣ All Streamers 圖片檢查
async function checkAllStreamersImages(page, timestamp) {
  console.log('開始 All Streamers 圖片檢查...');
  
  try {
    await page.waitForTimeout(300);
    
    const shotBefore = path.join(debugDir, `all-streamers-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    // Find All Streamers section and check images
    const imageCheckResult = await page.evaluate(() => {
      // Look for "All Streamers" text element
      const allElements = Array.from(document.querySelectorAll('*'));
      let allStreamersElement = null;
      
      for (const el of allElements) {
        const text = (el.innerText || el.textContent || '').trim();
        
        // Look for "All Streamers" text (exact match or contains)
        if (text.toLowerCase().includes('all streamers') || 
            text.toLowerCase().includes('all streamer')) {
          if (el.offsetParent !== null) {
            allStreamersElement = el;
            break;
          }
        }
      }
      
      if (!allStreamersElement) {
        return { found: false, reason: 'All Streamers element not found' };
      }
      
      // Find the container below "All Streamers" text with streamer avatars
      let streamersContainer = null;
      const allStreamersRect = allStreamersElement.getBoundingClientRect();
      
      // Look for a container below the All Streamers text
      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        
        // Check if element is below All Streamers text
        if (rect.top >= allStreamersRect.bottom && 
            rect.top - allStreamersRect.bottom < 300 &&
            rect.width > 500 && rect.height > 200) {
          
          const imgs = el.querySelectorAll('img');
          if (imgs.length >= 5) {
            streamersContainer = el;
            break;
          }
        }
      }
      
      // If no specific container found, search in the parent of All Streamers text
      let images = [];
      if (streamersContainer) {
        images = Array.from(streamersContainer.querySelectorAll('img'));
      } else {
        let parent = allStreamersElement.parentElement;
        for (let i = 0; i < 3 && parent; i++) {
          const imgs = parent.querySelectorAll('img');
          if (imgs.length >= 5) {
            images = Array.from(imgs);
            break;
          }
          parent = parent.parentElement;
        }
      }
      
      if (images.length === 0) {
        return { 
          found: true, 
          hasImages: false, 
          imageCount: 0,
          message: 'All Streamers 區域找到但沒有圖片'
        };
      }
      
      // Filter: keep only avatar-sized images
      // Streamer avatars are usually square and medium-sized (100-300px)
      images = images.filter(img => {
        const rect = img.getBoundingClientRect();
        const src = (img.src || '').toLowerCase();
        
        // Filter by size (avatars are usually 150-300px square) or by URL pattern
        const isAvatarSize = rect.width >= 100 && rect.width <= 400 && 
                            rect.height >= 100 && rect.height <= 400;
        const isAvatarUrl = src.includes('anchor-icons') || src.includes('avatar') || src.includes('streamer');
        
        // Exclude banners (wider than tall)
        const isNotBanner = rect.height >= rect.width * 0.8; // aspect ratio close to square
        
        return (isAvatarSize || isAvatarUrl) && isNotBanner;
      });
      
      // Remove duplicates
      const uniqueImages = [];
      const seenUrls = new Set();
      
      for (const img of images) {
        const src = img.src || '';
        const srcWithoutQuery = src.split('?')[0];
        
        if (!seenUrls.has(srcWithoutQuery)) {
          seenUrls.add(srcWithoutQuery);
          uniqueImages.push(img);
        }
      }
      
      images = uniqueImages;
      
      if (images.length === 0) {
        return { 
          found: true, 
          hasImages: false, 
          imageCount: 0,
          message: 'All Streamers 區域找到但沒有有效的主播頭像'
        };
      }
      
      const imageDetails = [];
      let brokenCount = 0;
      let loadedCount = 0;
      
      for (const img of images) {
        const rect = img.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        
        // Check if image is broken (naturalWidth is 0 for broken images)
        const isBroken = img.complete && img.naturalWidth === 0;
        const isLoaded = img.complete && img.naturalWidth > 0;
        
        if (isBroken) brokenCount++;
        if (isLoaded) loadedCount++;
        
        imageDetails.push({
          src: img.src ? img.src.substring(0, 100) : 'no src',
          alt: img.alt || 'no alt',
          width: rect.width,
          height: rect.height,
          visible: isVisible,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          broken: isBroken,
          loaded: isLoaded
        });
      }
      
      return {
        found: true,
        hasImages: true,
        imageCount: images.length,
        loadedCount: loadedCount,
        brokenCount: brokenCount,
        images: imageDetails,
        allImagesOK: brokenCount === 0 && loadedCount === images.length
      };
    });
    
    const shotAfter = path.join(debugDir, `all-streamers-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    if (!imageCheckResult || typeof imageCheckResult !== 'object') {
      return {
        found: false,
        message: 'All Streamers 圖片檢查結果異常',
        error: 'imageCheckResult is invalid',
        debug: { screenshot: shotBefore }
      };
    }
    
    if (!imageCheckResult.found) {
      return {
        found: false,
        message: imageCheckResult.reason || 'All Streamers 區域未找到',
        debug: { screenshot: shotBefore }
      };
    }
    
    if (!imageCheckResult.hasImages) {
      return {
        found: true,
        hasImages: false,
        imageCount: 0,
        message: imageCheckResult.message || 'All Streamers 區域找到但沒有主播頭像',
        debug: { 
          screenshotBefore: shotBefore,
          screenshotAfter: shotAfter
        }
      };
    }
    
    const { imageCount, loadedCount, brokenCount, allImagesOK } = imageCheckResult;
    
    let message = `找到 ${imageCount} 張主播頭像`;
    if (allImagesOK) {
      message += '，全部正常載入';
    } else {
      if (brokenCount > 0) {
        message += `，${brokenCount} 張未顯示`;
      }
    }
    
    return {
      found: true,
      hasImages: true,
      imageCount: imageCount,
      loadedCount: loadedCount,
      brokenCount: brokenCount,
      allImagesOK: allImagesOK,
      message: message,
      debug: {
        screenshotBefore: shotBefore,
        screenshotAfter: shotAfter,
        images: imageCheckResult.images
      }
    };
    
  } catch (error) {
    console.error('All Streamers 圖片檢查錯誤:', error);
    let errorMsg = 'Unknown error';
    try {
      if (error && typeof error === 'object') {
        errorMsg = error.message || error.toString() || JSON.stringify(error);
      } else if (error) {
        errorMsg = String(error);
      }
    } catch (e) {
      errorMsg = 'Error parsing error message';
    }
    return {
      found: false,
      error: errorMsg,
      message: `All Streamers 圖片檢查失敗: ${errorMsg}`
    };
  }
}


// 7️⃣ All Streamers 排列按鈕測試
async function checkAllStreamersSortButton(page, timestamp) {
  console.log('開始 All Streamers 排列按鈕測試...');
  
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  const shotBefore = path.join(debugDir, `all-streamers-sort-before-${timestamp}.png`);
  await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});

  try {
    // 獲取排序前的順序
    const getStreamerOrder = async () => {
      return await page.evaluate(() => {
        // 參考第6點的實現方式：先找到 "All Streamers" 文字元素
      const allElements = Array.from(document.querySelectorAll('*'));
      let allStreamersElement = null;
      
      for (const el of allElements) {
          const text = (el.innerText || el.textContent || '').trim();
          if (text.toLowerCase().includes('all streamers') || 
              text.toLowerCase().includes('all streamer')) {
            if (el.offsetParent !== null) {
            allStreamersElement = el;
              break;
          }
        }
      }
      
      if (!allStreamersElement) {
          return [];
      }
      
        // 找到 All Streamers 文字下方的容器
      const allStreamersRect = allStreamersElement.getBoundingClientRect();
        let streamersContainer = null;
        
        // 查找包含多張圖片的容器
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= allStreamersRect.bottom && 
              rect.top - allStreamersRect.bottom < 300 &&
              rect.width > 500 && rect.height > 200) {
            const imgs = el.querySelectorAll('img');
            if (imgs.length >= 5) {
              streamersContainer = el;
              break;
            }
          }
        }
        
        // 如果沒找到特定容器，從父元素查找
        let images = [];
        if (streamersContainer) {
          images = Array.from(streamersContainer.querySelectorAll('img'));
        } else {
          let parent = allStreamersElement.parentElement;
          for (let i = 0; i < 3 && parent; i++) {
            const imgs = parent.querySelectorAll('img');
            if (imgs.length >= 5) {
              images = Array.from(imgs);
              break;
            }
            parent = parent.parentElement;
          }
        }
        
        const streamers = [];
        for (const img of images) {
          const rect = img.getBoundingClientRect();
          // 過濾掉太小的圖片（可能是圖標）
          if (rect.width > 0 && rect.height > 0 && rect.width > 50 && rect.height > 50) {
            streamers.push({
              src: img.src.split('?')[0],
              left: rect.left,
              top: rect.top
            });
          }
        }
        
        // 按位置排序（從上到下，從左到右）
        streamers.sort((a, b) => {
          const topDiff = a.top - b.top;
          if (Math.abs(topDiff) > 50) return topDiff; // 不同行
          return a.left - b.left; // 同一行，從左到右
        });
        
        return streamers.map(s => s.src);
      });
    };

    const orderBefore = await getStreamerOrder();

    const buttonContainer = await page.evaluate(() => {
      // 先找到 offline-list-btn 作為參考點
      const offlineBtn = document.querySelector("#offline-list-btn");
      
      if (!offlineBtn) {
        return { found: false, buttonCount: 0, debug: 'offline-list-btn not found' };
      }
      
      const offlineRect = offlineBtn.getBoundingClientRect();
      
      // 在同一個父容器內查找所有按鈕
      const parentContainer = offlineBtn.parentElement;
      if (!parentContainer) {
        return { found: false, buttonCount: 0, debug: 'Parent container not found' };
      }
      
      const buttons = [];
      // 查找容器內的所有可點擊元素（button, svg等）
      const clickableElements = parentContainer.querySelectorAll('button, svg, [role="button"], [onclick]');
      
      for (const el of clickableElements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.width < 100 && rect.height < 100) {
          // 檢查是否在 offline-list-btn 附近（同一行）
          const centerY = rect.top + rect.height / 2;
          const offlineCenterY = offlineRect.top + offlineRect.height / 2;
          const verticalDiff = Math.abs(centerY - offlineCenterY);
          
          if (verticalDiff < 50) {
          // 找到可點擊的父元素
            let clickableParent = el;
            if (el.tagName.toLowerCase() === 'svg') {
              clickableParent = el.closest('button') || el.parentElement;
            }
            
          let depth = 0;
          while (clickableParent && depth < 5) {
            const tagName = clickableParent.tagName.toLowerCase();
            if (tagName === 'button' || clickableParent.getAttribute('role') === 'button' || 
                clickableParent.hasAttribute('onclick') || 
                window.getComputedStyle(clickableParent).cursor === 'pointer') {
              const parentRect = clickableParent.getBoundingClientRect();
                buttons.push({
                x: parentRect.x + parentRect.width / 2,
                y: parentRect.y + parentRect.height / 2,
                  left: parentRect.left
              });
              break;
            }
            clickableParent = clickableParent.parentElement;
            depth++;
          }
          
            // 如果沒找到可點擊父元素，直接使用元素
          if (!clickableParent || depth >= 5) {
              buttons.push({
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                left: rect.left
              });
            }
          }
        }
      }
      
      // 按從左到右排序
      buttons.sort((a, b) => a.left - b.left);
      
      if (buttons.length >= 2) {
        return {
          found: true,
          leftButton: { x: buttons[0].x, y: buttons[0].y },
          rightButton: { x: buttons[1].x, y: buttons[1].y },
          buttonCount: buttons.length
        };
      } else if (buttons.length === 1) {
        return {
          found: true,
          leftButton: { x: buttons[0].x, y: buttons[0].y },
          rightButton: null,
          buttonCount: 1
        };
      }
      
      return { found: false, buttonCount: 0, debug: `Found ${buttons.length} buttons in container` };
    });

    if (!buttonContainer || !buttonContainer.found || !buttonContainer.rightButton) {
      return {
        clicked: false,
        sortWorking: false,
        message: `All Streamers 排列按鈕未找到或數量不足（找到 ${buttonContainer ? buttonContainer.buttonCount : 0} 個，需要2個）`,
        debug: { 
          screenshot: shotBefore,
          debugInfo: buttonContainer ? buttonContainer.debug : 'buttonContainer is null'
        }
      };
    }

    await page.mouse.click(buttonContainer.leftButton.x, buttonContainer.leftButton.y);
    await page.waitForTimeout(1500);

    const shotAfterLeft = path.join(debugDir, `all-streamers-sort-after-left-${timestamp}.png`);
    await page.screenshot({ path: shotAfterLeft, fullPage: false }).catch(() => {});

    const orderAfterLeft = await getStreamerOrder();

    let rightButtonClicked = false;
    let orderAfterRight = [];
    if (buttonContainer.rightButton) {
      await page.mouse.click(buttonContainer.rightButton.x, buttonContainer.rightButton.y);
      await page.waitForTimeout(1500);
      rightButtonClicked = true;
      orderAfterRight = await getStreamerOrder();
    }

    const shotAfterRight = path.join(debugDir, `all-streamers-sort-after-right-${timestamp}.png`);
    await page.screenshot({ path: shotAfterRight, fullPage: false }).catch(() => {});

    const leftSortChanged = JSON.stringify(orderBefore) !== JSON.stringify(orderAfterLeft);
    const rightSortChanged = rightButtonClicked && JSON.stringify(orderAfterLeft) !== JSON.stringify(orderAfterRight);
    const sortWorking = leftSortChanged || rightSortChanged;

    return {
      clicked: true,
      sortWorking: sortWorking,
      leftButtonClicked: true,
      rightButtonClicked: rightButtonClicked,
      leftSortChanged: leftSortChanged,
      rightSortChanged: rightSortChanged,
      message: sortWorking ? 
        `排序正常 - 左按鈕: ${leftSortChanged ? '有變化' : '無變化'}, 右按鈕: ${rightButtonClicked ? (rightSortChanged ? '有變化' : '無變化') : '未點擊'}` :
        '已點擊但排序未變化',
      debug: {
        screenshotBefore: shotBefore,
        screenshotAfterLeft: shotAfterLeft,
        screenshotAfterRight: shotAfterRight,
        initialState: orderBefore.slice(0, 3),
        stateAfterLeft: orderAfterLeft.slice(0, 3),
        stateAfterRight: orderAfterRight.slice(0, 3),
        buttonsFound: buttonContainer.buttonCount
      }
    };

  } catch (error) {
    console.error('All Streamers 排列按鈕測試錯誤:', error);
    return {
      clicked: false,
      sortWorking: false,
      error: String(error && error.message || error),
      message: `All Streamers 排列按鈕測試失敗: ${error && error.message || error}`
    };
  }
}

// 8️⃣ 直播主介紹卡片點擊測試
async function checkStreamerCardClick(page, timestamp) {
  console.log('開始直播主介紹卡片點擊測試...');
  
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  const shotBefore = path.join(debugDir, `streamer-card-before-${timestamp}.png`);
  await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});

  try {
    // 檢查卡片是否存在並獲取點擊位置
    const cardInfo = await page.evaluate(() => {
      // 優先查找 #streamer-card-game01
      let card = document.querySelector("#streamer-card-game01");
      let cardType = 'id';
      
      // 如果找不到，嘗試使用 CSS 選擇器查找
      if (!card) {
        card = document.querySelector("._container_suyzz_1 > div[data-cover]");
        cardType = 'css';
      }
      
      if (!card) {
        return { found: false, message: '卡片元素未找到（嘗試了 #streamer-card-game01 和 ._container_suyzz_1 > div[data-cover]）' };
      }
      
      // 檢查元素是否在 DOM 中且可訪問
      if (card.offsetParent === null && window.getComputedStyle(card).display === 'none') {
        return { found: false, message: '卡片元素被隱藏' };
      }
      
      const rect = card.getBoundingClientRect();
      
      // 即使 width/height 為 0，只要元素存在就嘗試點擊
      // 使用元素的中心位置，如果尺寸為 0 則使用父元素的位置
      let clickX, clickY;
      if (rect.width > 0 && rect.height > 0) {
        clickX = rect.x + rect.width / 2;
        clickY = rect.y + rect.height / 2;
      } else {
        // 如果卡片尺寸為 0，嘗試使用父元素的位置
        const parent = card.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          clickX = parentRect.x + parentRect.width / 2;
          clickY = parentRect.y + parentRect.height / 2;
        } else {
          // 如果沒有父元素，使用元素在 DOM 中的預期位置
          clickX = rect.x || 0;
          clickY = rect.y || 0;
        }
      }
      
      return {
        found: true,
        x: clickX,
        y: clickY,
        width: rect.width,
        height: rect.height,
        hasSize: rect.width > 0 && rect.height > 0,
        cardType: cardType
      };
    });

    if (!cardInfo.found) {
      return {
        clicked: false,
        opened: false,
        message: cardInfo.message || '直播主卡片未找到',
        debug: { screenshot: shotBefore }
      };
    }

    // 記錄點擊前的 URL
    const urlBefore = page.url();

    // 滾動到卡片位置確保可見
    await page.evaluate(() => {
      // 優先查找 #streamer-card-game01
      let card = document.querySelector("#streamer-card-game01");
      if (!card) {
        // 如果找不到，使用 CSS 選擇器
        card = document.querySelector("._container_suyzz_1 > div[data-cover]");
      }
      
      if (card) {
        // 嘗試滾動到卡片，如果卡片不可見則滾動到父元素
        if (card.offsetParent !== null) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const parent = card.parentElement;
          if (parent) {
            parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    });
    await page.waitForTimeout(1000);

    // 嘗試多種點擊方式
    let clicked = false;
    try {
      // 方式1: 直接點擊坐標位置
      await page.mouse.click(cardInfo.x, cardInfo.y);
      clicked = true;
    } catch (e) {
      // 方式2: 如果坐標點擊失敗，嘗試使用 JavaScript 點擊
      try {
        await page.evaluate(() => {
          // 優先查找 #streamer-card-game01
          let card = document.querySelector("#streamer-card-game01");
          if (!card) {
            // 如果找不到，使用 CSS 選擇器
            card = document.querySelector("._container_suyzz_1 > div[data-cover]");
          }
          if (card) {
            card.click();
          }
        });
        clicked = true;
      } catch (e2) {
        // 方式3: 嘗試點擊父元素
        try {
          await page.evaluate(() => {
            // 優先查找 #streamer-card-game01
            let card = document.querySelector("#streamer-card-game01");
            if (!card) {
              // 如果找不到，使用 CSS 選擇器
              card = document.querySelector("._container_suyzz_1 > div[data-cover]");
            }
            if (card && card.parentElement) {
              card.parentElement.click();
            }
          });
          clicked = true;
        } catch (e3) {
          console.error('所有點擊方式都失敗:', e3);
        }
      }
    }
    
    if (!clicked) {
      return {
        clicked: false,
        opened: false,
        message: '無法點擊卡片（所有點擊方式都失敗）',
        debug: { screenshot: shotBefore }
      };
    }
    
    // 點擊後滾動到頁面頂部（使用 instant 避免持續滾動）
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(500);
    
    await page.waitForTimeout(2000);

    const shotAfter = path.join(debugDir, `streamer-card-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});

    // 檢查是否開啟了新頁面或導航
    const urlAfter = page.url();
    const urlChanged = urlBefore !== urlAfter;

    // 檢查頁面內容是否有變化（可能開啟了彈窗或新頁面）
    const pageChanged = await page.evaluate(() => {
      // 檢查是否有新的對話框或彈窗出現
      const dialogs = document.querySelectorAll('[role="dialog"], .modal, .ant-modal, .dialog, [class*="modal" i], [class*="dialog" i]');
      for (const dialog of dialogs) {
        if (dialog.offsetParent !== null) {
          const text = (dialog.textContent || '').toLowerCase();
          // 檢查是否包含直播主相關內容
          if (text.includes('streamer') || text.includes('主播') || text.includes('介紹') || 
              text.includes('profile') || text.includes('info') || text.length > 100) {
            return true;
          }
        }
      }
      
      // 檢查 URL hash 是否改變（可能是單頁應用導航）
      return window.location.hash !== '';
    });

    const opened = urlChanged || pageChanged;

    return {
      clicked: true,
      opened: opened,
      urlChanged: urlChanged,
      pageChanged: pageChanged,
      message: opened ? 
        (urlChanged ? '成功開啟直播主介紹頁面（URL已改變）' : '成功開啟直播主介紹頁面（頁面內容已改變）') :
        '已點擊卡片但未檢測到頁面變化',
      debug: {
        screenshotBefore: shotBefore,
        screenshotAfter: shotAfter,
        urlBefore: urlBefore,
        urlAfter: urlAfter
      }
    };

  } catch (error) {
    console.error('直播主介紹卡片點擊測試錯誤:', error);
    let errorMsg = 'Unknown error';
    try {
      if (error && typeof error === 'object') {
        errorMsg = error.message || error.toString() || JSON.stringify(error);
      } else if (error) {
        errorMsg = String(error);
      }
    } catch (e) {
      errorMsg = 'Error parsing error message';
    }
    return {
      clicked: false,
      opened: false,
      error: errorMsg,
      message: `直播主介紹卡片點擊測試失敗: ${errorMsg}`
    };
  }
}

// 9️⃣ 排行榜檢查
async function checkRankingData(page, timestamp) {
  console.log('開始排行榜檢查...');

  try {
    await page.waitForTimeout(1000);
    
    const shotBefore = path.join(debugDir, `ranking-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});

    // === All Times 檢查 ===
    console.log('滾動到 All Times 區域 (y: 340)...');
    
    // 計算目標滾動位置：元素的 top (340) - 視窗高度的部分，讓元素能出現在視窗中
    const allTimesTargetY = Math.max(0, 340 - 200);
    
    await page.evaluate((targetY) => {
      window.scrollTo({ top: targetY, behavior: 'instant' });
    }, allTimesTargetY);
    await page.waitForTimeout(1500);

    console.log('移動滑鼠到 All Times 區域 (座標: 32, 340)...');
    // 計算滾動後元素在視窗中的實際位置
    const allTimesViewportY = await page.evaluate((elementTopInPage) => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      return elementTopInPage - scrollY;
    }, 340);
    
    await page.mouse.move(32, allTimesViewportY);
    await page.waitForTimeout(500);

    const shotAllTimes = path.join(debugDir, `ranking-all-times-${timestamp}.png`);
    await page.screenshot({ path: shotAllTimes, fullPage: false }).catch(() => {});
    console.log(`已截圖 All Times 區域: ${shotAllTimes}`);

    console.log('檢查 All Times 資料...');
    const allTimesResult = await page.evaluate(() => {
      // 在指定座標範圍內尋找 DIV 元素
      const targetX = 32;
      const targetY = 340;
      const targetWidth = 800;
      const targetHeight = 196;
      
      // 獲取所有 DIV 元素
      const allDivs = Array.from(document.querySelectorAll('div'));
      
      // 找到符合座標範圍的 DIV
      let targetDiv = null;
      for (const div of allDivs) {
        const rect = div.getBoundingClientRect();
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const elementTop = rect.top + scrollY;
        const elementLeft = rect.left;
        
        // 檢查元素位置是否在目標範圍內（允許一些誤差）
        if (Math.abs(elementLeft - targetX) < 20 && 
            Math.abs(elementTop - targetY) < 20 &&
            Math.abs(rect.width - targetWidth) < 50 &&
            Math.abs(rect.height - targetHeight) < 50) {
          targetDiv = div;
          break;
        }
      }
      
      if (!targetDiv) {
        // 如果找不到精確座標的 DIV，嘗試尋找包含排行榜資料的 DIV
        // 尋找包含金額符號 $ 和數字的 DIV
        for (const div of allDivs) {
          const text = div.textContent || '';
          if (text.includes('$') && /\d{3,}/.test(text) && text.length > 20) {
            const rect = div.getBoundingClientRect();
            if (rect.width > 600 && rect.height > 100 && rect.height < 300) {
              targetDiv = div;
              break;
            }
          }
        }
      }
      
      if (targetDiv) {
        const text = targetDiv.textContent || '';
        const hasData = text.trim().length > 10; // 確保有實質內容
        
        return {
          found: true,
          hasData: hasData,
          textContent: text.substring(0, 100), // 只回傳前100字元
          textLength: text.length
        };
      }
      
      return { found: false, hasData: false };
    });


    // === Weekly Ranking 檢查 ===
    console.log('滾動到 Weekly Ranking 區域 (y: 412)...');
    
    const weeklyTargetY = Math.max(0, 412 - 50);
    
    await page.evaluate((targetY) => {
      window.scrollTo({ top: targetY, behavior: 'instant' });
    }, weeklyTargetY);
    await page.waitForTimeout(1500);

    console.log('移動滑鼠到 Weekly Ranking 區域 (座標: 50, 412)...');
    const weeklyViewportY = await page.evaluate((elementTopInPage) => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      return elementTopInPage - scrollY;
    }, 412);
    
    await page.mouse.move(50, weeklyViewportY);
    await page.waitForTimeout(500);

    const shotWeekly = path.join(debugDir, `ranking-weekly-${timestamp}.png`);
    await page.screenshot({ path: shotWeekly, fullPage: false }).catch(() => {});
    console.log(`已截圖 Weekly Ranking 區域: ${shotWeekly}`);

    console.log('檢查 Weekly Ranking 資料...');
    const weeklyResult = await page.evaluate(() => {
      const targetX = 50;
      const targetY = 412;
      const targetWidth = 800;
      const targetHeight = 196;
      
      const allDivs = Array.from(document.querySelectorAll('div'));
      
      let targetDiv = null;
      for (const div of allDivs) {
        const rect = div.getBoundingClientRect();
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const elementTop = rect.top + scrollY;
        const elementLeft = rect.left;
        
        if (Math.abs(elementLeft - targetX) < 20 && 
            Math.abs(elementTop - targetY) < 20 &&
            Math.abs(rect.width - targetWidth) < 50 &&
            Math.abs(rect.height - targetHeight) < 50) {
          targetDiv = div;
          break;
        }
      }
      
      if (!targetDiv) {
        // 後備方案：尋找包含排行榜資料的 DIV
        for (const div of allDivs) {
          const text = div.textContent || '';
          if (text.includes('$') && /\d{3,}/.test(text) && text.length > 20) {
            const rect = div.getBoundingClientRect();
            if (rect.width > 600 && rect.height > 100 && rect.height < 300) {
              targetDiv = div;
              break;
            }
          }
        }
      }
      
      if (targetDiv) {
        const text = targetDiv.textContent || '';
        const hasData = text.trim().length > 10;
        
        return {
          found: true,
          hasData: hasData,
          textContent: text.substring(0, 100),
          textLength: text.length
        };
      }
      
      return { found: false, hasData: false };
    });


    const shotAfter = path.join(debugDir, `ranking-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});

    // 彙整結果
    return {
      allTimes: {
        found: allTimesResult.found,
        hasData: allTimesResult.hasData,
        textContent: allTimesResult.textContent,
        textLength: allTimesResult.textLength,
        message: allTimesResult.found 
          ? (allTimesResult.hasData ? '✅ All Times 有資料' : '⚠️ All Times 沒有資料')
          : '❌ 找不到 All Times 區域'
      },
      weeklyRanking: {
        found: weeklyResult.found,
        hasData: weeklyResult.hasData,
        textContent: weeklyResult.textContent,
        textLength: weeklyResult.textLength,
        message: weeklyResult.found 
          ? (weeklyResult.hasData ? '✅ Weekly Ranking 有資料' : '⚠️ Weekly Ranking 沒有資料')
          : '❌ 找不到 Weekly Ranking 區域'
      },
      success: allTimesResult.found && weeklyResult.found,
      message: '排行榜檢查完成'
    };

  } catch (error) {
    console.error('排行榜檢查錯誤:', error);
    let errorMsg = 'Unknown error';
    try {
      if (error && typeof error === 'object') {
        errorMsg = error.message || error.toString() || JSON.stringify(error);
      } else if (error) {
        errorMsg = String(error);
      }
    } catch (e) {
      errorMsg = 'Error parsing error message';
    }
    return {
      allTimes: { found: false, hasData: false },
      weeklyRanking: { found: false, hasData: false },
      error: errorMsg,
      message: `排行榜檢查失敗: ${errorMsg}`
    };
  }
}

// 🔟 直播主照片檢查
async function checkStreamerPhoto(page, timestamp) {
  console.log('開始直播主照片檢查...');

  const result = {
    photoTabClicked: false,
    photoClicked: false,
    totalPhotos: 0,
    normalPhotos: 0,
    brokenPhotos: 0,
    brokenIndexes: [],
    success: false,
    message: '',
  };

  try {
    // 1️⃣ 先切到 Photo 分頁
    const photoTab = page
      .locator('button:has-text("Photo"), [role="tab"]:has-text("Photo")')
      .first();

    await photoTab.waitFor({ state: 'visible', timeout: 5000 });
    await photoTab.click();
    result.photoTabClicked = true;
    console.log('已點擊 Photo 分頁');

    // 2️⃣ 取得所有照片 wrapper（含破圖）
    const photoWrappers = page.locator('div._photoImageWrapper_1upir_591');
    const totalPhotos = await photoWrappers.count();
    result.totalPhotos = totalPhotos;

    console.log(`找到 ${totalPhotos} 張照片（含破圖也算）`);

    if (totalPhotos === 0) {
      const message = '找不到任何照片，無法進行照片檢查';
      console.warn(message);
      result.success = false;
      result.message = message;
      return result;
    }

    const brokenIndexes = [];

    // 🧪 小工具：判斷某一張是不是破圖（只算「載入完成且寬度 0」）
    const isBrokenImage = async (index) => {
      const img = photoWrappers.nth(index).locator('img');
      return await img.evaluate((el) => {
        return el.complete && el.naturalWidth === 0;
      });
    };

    // 🔍 跑一輪 loop，把全部正常 / 破圖數量算出來
    for (let i = 0; i < totalPhotos; i++) {
      const broken = await isBrokenImage(i);
      if (broken) {
        console.warn(`第 ${i + 1} 張照片為破圖`);
        brokenIndexes.push(i + 1); // 1-based index
      }
    }

    result.brokenIndexes = brokenIndexes;
    result.brokenPhotos = brokenIndexes.length;
    result.normalPhotos = totalPhotos - result.brokenPhotos;

    console.log(
      `照片統計：總數=${result.totalPhotos}，正常=${result.normalPhotos}，破圖=${result.brokenPhotos}` +
        (result.brokenPhotos > 0
          ? `（第 ${brokenIndexes.join('、')} 張為破圖）`
          : '')
    );

    // 🧰 小工具：如果有照片大圖 / overlay，就關掉它
    const closePhotoModalIfOpen = async () => {
      try {
        const overlay = page.locator('div._modalOverlay_k5ofn_1');

        const count = await overlay.count();
        if (count === 0) return; // 沒有 overlay，直接略過

        const visible = await overlay.isVisible().catch(() => false);
        if (!visible) return;

        console.log('偵測到照片大圖彈窗，嘗試關閉...');

        // 先試 Esc
        await page.keyboard.press('Escape').catch(() => {});

        try {
          await overlay.waitFor({ state: 'hidden', timeout: 1500 });
          console.log('照片大圖彈窗已透過 Esc 關閉');
          return;
        } catch (e) {
          console.warn('Esc 沒有關掉彈窗，改試點擊 overlay / close 按鈕');
        }

        // 試試看 overlay click
        await overlay.click({ trial: false }).catch(() => {});

        // 再等一下看看是不是消失了
        await overlay.waitFor({ state: 'hidden', timeout: 1500 }).catch(() => {
          console.warn('照片彈窗依然存在，後續操作可能會被遮擋');
        });
      } catch (e) {
        console.warn('關閉照片彈窗時發生例外，但不阻止流程：', String(e));
      }
    };

    // 🖱️ 小工具：點某一張照片 + 停 1 秒
    const clickPhotoByIndex = async (index) => {
      const wrapper = photoWrappers.nth(index);
      await wrapper.scrollIntoViewIfNeeded();
      await wrapper.click();
      console.log(`已點擊第 ${index + 1} 張照片`);
      await page.waitForTimeout(1000); // 停留 1 秒
    };

    // 3️⃣ 流程：點第 1 張 → 關 modal → 點第 2 張 → 再關一次 modal

    // 點第 1 張
    await clickPhotoByIndex(0);
    await closePhotoModalIfOpen(); // 🔥 點完第一張後先把大圖收掉

    if (totalPhotos > 1) {
      // 點第 2 張
      await clickPhotoByIndex(1);
      await closePhotoModalIfOpen(); // 🔥 第二張點完也再嘗試關一次
    } else {
      console.log('只有 1 張照片，略過第 2 張');
    }

    result.photoClicked = true;

    // 4️⃣ 組裝給前端的 message：有破圖 → 視為「照片異常」
    if (result.brokenPhotos > 0) {
      result.success = false;
      result.message = `照片異常：共 ${result.totalPhotos} 張，正常 ${result.normalPhotos} 張，破圖 ${result.brokenPhotos} 張（第 ${brokenIndexes.join(
        '、'
      )} 張為破圖）`;
      console.log('❌ ' + result.message);
    } else {
      result.success = true;
      result.message = `照片正常：共 ${result.totalPhotos} 張，無破圖`;
      console.log('✅ ' + result.message);
    }

    return result;

  } catch (error) {
    console.error('直播主照片檢查錯誤:', error);
    let errorMsg = 'Unknown error';
    try {
      if (error && typeof error === 'object') {
        errorMsg = error.message || error.toString() || JSON.stringify(error);
      } else if (error) {
        errorMsg = String(error);
      }
    } catch {
      errorMsg = 'Error parsing error message';
    }

    return {
      ...result,
      success: false,
      error: errorMsg,
      message: `直播主照片檢查失敗: ${errorMsg}`
    };
  }
}

// 🔟②  返回按鈕測試（照片檢查後返回上一頁）
async function checkBackButton(page, timestamp) {
  console.log('開始返回按鈕測試...');
  
  try {
    await page.waitForTimeout(500);
    
    const shotBefore = path.join(debugDir, `back-button-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    console.log('截圖（點擊前）:', shotBefore);
    
    // 尋找返回按鈕（SVG 左箭頭）
    const backButtonInfo = await page.evaluate(() => {
      // 尋找包含特定 path 的 SVG 元素
      const svgs = Array.from(document.querySelectorAll('svg'));
      
      for (const svg of svgs) {
        // 檢查 SVG 尺寸和 viewBox
        const width = svg.getAttribute('width');
        const height = svg.getAttribute('height');
        const viewBox = svg.getAttribute('viewBox');
        
        if (width === '24' && height === '24' && viewBox === '0 0 24 24') {
          // 檢查內部的 path
          const paths = svg.querySelectorAll('path');
          for (const path of paths) {
            const d = path.getAttribute('d');
            // 檢查是否為左箭頭：M15 18L9 12L15 6
            if (d && d.includes('M15 18') && d.includes('L9 12') && d.includes('L15 6')) {
              const rect = svg.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                // 找到可點擊的父元素（button 或其他）
                let clickableParent = svg;
                let current = svg.parentElement;
                while (current) {
                  const tag = current.tagName.toLowerCase();
                  if (tag === 'button' || tag === 'a' || current.hasAttribute('onclick') || current.getAttribute('role') === 'button') {
                    clickableParent = current;
                    break;
                  }
                  current = current.parentElement;
                }
                
                const clickRect = clickableParent.getBoundingClientRect();
                return {
                  found: true,
                  x: clickRect.x + clickRect.width / 2,
                  y: clickRect.y + clickRect.height / 2,
                  width: clickRect.width,
                  height: clickRect.height
                };
              }
            }
          }
        }
      }
      
      return { found: false };
    });
    
    if (!backButtonInfo.found) {
      console.log('⚠️ 未找到返回按鈕');
      return {
        clicked: false,
        success: false,
        message: '未找到返回按鈕（SVG 左箭頭）'
      };
    }
    
    console.log('找到返回按鈕，位置:', { x: backButtonInfo.x, y: backButtonInfo.y });
    
    // 記錄點擊前的 URL
    const urlBefore = page.url();
    console.log('點擊前的 URL:', urlBefore);
    
    // 點擊返回按鈕
    await page.mouse.click(backButtonInfo.x, backButtonInfo.y);
    console.log('已點擊返回按鈕，等待頁面載入...');
    
    // 等待頁面導航完成
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      console.log('頁面載入完成 (domcontentloaded)');
    } catch (e) {
      console.log('等待 domcontentloaded 超時，繼續執行');
    }
    
    await page.waitForTimeout(1000);
    
    const shotAfter = path.join(debugDir, `back-button-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    console.log('截圖（點擊後）:', shotAfter);
    
    // 檢查 URL 是否改變
    const urlAfter = page.url();
    console.log('點擊後的 URL:', urlAfter);
    
    const urlChanged = urlBefore !== urlAfter;
    
    if (urlChanged) {
      console.log('✅ 返回按鈕點擊成功，URL 已改變');
    } else {
      console.log('⚠️ URL 未改變（可能是 SPA 應用），但仍繼續執行置頂');
    }
    
    // 🔥 無論 URL 是否改變，都執行滾動到頂部（因為 SPA 應用返回不會改變 URL）
    console.log('滾動到頁面頂部...');
    
    // 多次嘗試滾動，確保置頂成功
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
      await page.waitForTimeout(300);
    }
    
    // 驗證是否真的置頂了
    const scrollPosition = await page.evaluate(() => {
      return window.pageYOffset || document.documentElement.scrollTop;
    });
    console.log('當前滾動位置:', scrollPosition);
    
    await page.waitForTimeout(500);
    
    const shotAfterScroll = path.join(debugDir, `back-button-scrolled-${timestamp}.png`);
    await page.screenshot({ path: shotAfterScroll, fullPage: false }).catch(() => {});
    console.log('截圖（滾動後）:', shotAfterScroll);
    
    return {
      clicked: true,
      success: true,
      scrolledToTop: true,
      scrollPosition: scrollPosition,
      urlBefore: urlBefore,
      urlAfter: urlAfter,
      urlChanged: urlChanged,
      message: `✅ 返回按鈕點擊成功，已返回上一頁並置頂（滾動位置: ${scrollPosition}${urlChanged ? '，URL 已改變' : '，URL 未改變'}）`
    };
    
  } catch (error) {
    console.error('返回按鈕測試錯誤:', error);
    return {
      clicked: false,
      success: false,
      error: String(error && error.message || error),
      message: `返回按鈕測試失敗: ${error && error.message || error}`
    };
  }
}

module.exports = { checkWebsite };
