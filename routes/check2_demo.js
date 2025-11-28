const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const debugDir = path.join(__dirname, '..', 'debug');
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir, { recursive: true });
}

async function checkWebsite(url) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const results = { url, timestamp: new Date().toISOString(), checks: {} };

  try {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await page.waitForTimeout(1500);

    try {
      results.checks.streamNSpinDialog = await checkStreamNSpinDialog(page, timestamp);
    } catch (err) {
      results.checks.streamNSpinDialog = { found: false, error: String(err && err.message || err) };
    }

    try {
      results.checks.streamingNowClick = await checkStreamingNowClick(page, context, timestamp);
      // 將 gift 數據提升到 results.checks 層級
      if (results.checks.streamingNowClick?.giftData) {
        results.checks.gift = results.checks.streamingNowClick.giftData;
      }
      // 將 checks 對象中的數據提升到 results.checks 層級
      if (results.checks.streamingNowClick?.checks) {
        if (results.checks.streamingNowClick.checks.betPlus28) {
          results.checks.betPlus28 = results.checks.streamingNowClick.checks.betPlus28;
        }
        if (results.checks.streamingNowClick.checks.betMinus28) {
          results.checks.betMinus28 = results.checks.streamingNowClick.checks.betMinus28;
        }
        if (results.checks.streamingNowClick.checks.gift) {
          results.checks.gift = results.checks.streamingNowClick.checks.gift;
        }
      }
    } catch (err) {
      results.checks.streamingNowClick = { clicked: false, error: String(err && err.message || err) };
    }


  } catch (error) {
    console.error('測試執行過程中發生錯誤:', error);
    results.error = String(error && error.message || error);
    results.stack = error && error.stack ? error.stack : undefined;
  } finally {
    try {
    const allTestsPassed = results.checks.streamingNowClick?.newPageOpened && 
                          results.checks.streamingNowClick?.gVersion?.found &&
                          results.checks.streamingNowClick?.howToPlayClosed &&
                            results.checks.streamingNowClick?.maxButton3M?.success &&
                            results.checks.streamingNowClick?.minButton200?.success &&
                            results.checks.betPlus28?.success &&
                            results.checks.betMinus28?.success &&
                            results.checks.streamingNowClick?.spinRoundPlus4?.success &&
                            results.checks.streamingNowClick?.spinRoundMinus5?.success &&
                            results.checks.streamingNowClick?.playButton?.success &&
                            results.checks.gift?.success &&
                            results.checks.streamingNowClick?.chatInput?.success;
      
      if (allTestsPassed) {
        console.log('✅✅✅ 所有測試完成！瀏覽器保持開啟，停留在新視窗...');
        console.log('⚠️  請手動關閉瀏覽器');
      } else {
        console.log('⚠️  測試未完全成功，瀏覽器保持開啟 60 秒以供檢查...');
        console.log(`   1️⃣ Stream n'Spin 彈窗: ${results.checks.streamNSpinDialog?.clicked ? '✅' : '❌'}`);
      console.log(`   2️⃣ 點擊 LIVE 卡片: ${results.checks.streamingNowClick?.clicked ? '✅' : '❌'}`);
      console.log(`   3️⃣ 新視窗開啟: ${results.checks.streamingNowClick?.newPageOpened ? '✅' : '❌'}`);
      console.log(`   4️⃣ gVersion 檢測: ${results.checks.streamingNowClick?.gVersion?.found ? '✅' : '❌'}`);
      console.log(`   5️⃣ Cara Bermain 關閉: ${results.checks.streamingNowClick?.howToPlayClosed ? '✅' : '❌'}`);
        console.log(`   7️⃣ MAX 按鈕（3M）: ${results.checks.streamingNowClick?.maxButton3M?.success ? '✅' : '❌'}`);
        console.log(`   8️⃣ MIN 按鈕（200）: ${results.checks.streamingNowClick?.minButton200?.success ? '✅' : '❌'}`);
        if (results.checks.betPlus28) {
          const r = results.checks.betPlus28;
          const icon = r.success ? '✅' : '❌';
          console.log(`   9️⃣ + 按鈕 28 次: ${icon}`);
        } else {
          console.log('   9️⃣ + 按鈕 28 次: ❌ (未執行)');
        }
        if (results.checks.betMinus28) {
          const r = results.checks.betMinus28;
          const icon = r.success ? '✅' : '❌';
          console.log(`   🔟 - 按鈕 28 次: ${icon}`);
        } else {
          console.log('   🔟 - 按鈕 28 次: ❌ (未執行)');
        }
        console.log(`   1️⃣1️⃣ Spin Round + 按鈕 4 次: ${results.checks.streamingNowClick?.spinRoundPlus4?.success ? '✅' : '❌'}`);
        console.log(`   1️⃣2️⃣ Spin Round - 按鈕 5 次: ${results.checks.streamingNowClick?.spinRoundMinus5?.success ? '✅' : '❌'}`);
        console.log(`   1️⃣3️⃣ 點擊綠色 PLAY 鈕: ${results.checks.streamingNowClick?.playButton?.success ? '✅' : '❌'}`);
        
        // 送禮測試使用新結構
        if (results.checks.gift) {
            const g = results.checks.gift;
            const icon = g.success ? '✅' : '❌';
            console.log(`   1️⃣4️⃣ 送禮測試: ${icon}`);
        } else {
            console.log('   1️⃣4️⃣ 送禮測試: ❌ (未執行)');
        }
        
        console.log(`   1️⃣5️⃣ 聊天視窗輸入: ${results.checks.streamingNowClick?.chatInput?.success ? '✅' : '❌'}`);
        console.log('⏱️  60秒後自動關閉，或請手動關閉瀏覽器...');
        await page.waitForTimeout(60000).catch(() => {});
        await browser.close().catch(() => {});
        console.log('Browser closed after 60 seconds');
      }
    } catch (finallyError) {
      console.error('finally 區塊執行錯誤:', finallyError);
      // 確保瀏覽器被關閉
      try {
        await browser.close().catch(() => {});
      } catch (closeError) {
        console.error('關閉瀏覽器時發生錯誤:', closeError);
      }
    }
  }

  return results;
}

async function checkGVersion(page) {
  // 嘗試多次檢測，最多等待 5 秒
  for (let i = 0; i < 5; i++) {
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
      } catch (e) {}
      return null;
    });
    
    if (gVersion != null) {
      return { found: true, version: gVersion };
    }
    
    if (i < 4) {
      await page.waitForTimeout(1000);
    }
  }
  
  return { found: false, version: null, message: 'gVersion 未找到' };
}

async function checkStreamNSpinDialog(page, timestamp) {
  try {
    await page.waitForTimeout(1000);
    const dialogInfo = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"], .modal, .ant-modal, .dialog, [class*="modal" i], [class*="dialog" i]');
      
      for (const dialog of dialogs) {
        if (dialog.offsetParent === null) continue;
        
        const text = (dialog.textContent || '').toLowerCase();
        if (text.includes('stream') && (text.includes('spin') || text.includes('n'))) {
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
          return { found: true, buttonText: null };
        }
      }
      return { found: false };
    });
    
    const shotBefore = path.join(debugDir, `test2-stream-n-spin-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    if (!dialogInfo.found) {
      return { found: false, clicked: false, message: 'Stream n\'Spin 彈窗未出現', debug: { screenshot: shotBefore } };
    }
    
    if (!dialogInfo.buttonText) {
      return { found: true, clicked: false, message: '找到彈窗但未找到 Confirm 按鈕', debug: { screenshot: shotBefore } };
    }
    
    await page.mouse.click(dialogInfo.x, dialogInfo.y);
    await page.waitForTimeout(1500);
    
    const shotAfter = path.join(debugDir, `test2-stream-n-spin-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    return {
      found: true,
      clicked: true,
      buttonText: dialogInfo.buttonText,
      message: '找到 Stream n\'Spin 彈窗並點擊 Confirm',
      debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter }
    };
    
  } catch (error) {
    return {
      found: false,
      clicked: false,
      error: String(error && error.message || error),
      message: `Stream n'Spin 彈窗測試失敗: ${error && error.message || error}`
    };
  }
}

async function checkStreamingNowClick(page, context, timestamp) {
  // 狀態追蹤物件
  const spinMetrics = {
    balanceBeforePlay: null,
    giftAmount: 0,
    betAmount: 200 // 預設值
  };

  try {
    // 減少初始等待時間，使用更高效的等待策略
    await page.waitForTimeout(2000);
    
    // 使用 instant 滾動以加快速度，並同時搜尋元素
    const streamingNowInfo = await page.evaluate(() => {
      // 先找到 Streaming Now 元素
      const streamingNow = Array.from(document.querySelectorAll('*')).find(el => {
        const text = (el.textContent || '').trim();
        return text === 'Streaming Now' || text.startsWith('Streaming Now');
      });
      
      if (!streamingNow) return { found: false, error: 'Streaming Now element not found' };
      
      const streamingNowRect = streamingNow.getBoundingClientRect();
      // 使用 instant 滾動以加快速度
      window.scrollTo({ top: Math.max(0, (window.pageYOffset || document.documentElement.scrollTop) + streamingNowRect.top - 150), behavior: 'instant' });
      
      // 立即開始搜尋卡片，不需要額外等待
      const allElements = Array.from(document.querySelectorAll('*'));
      
      const promotionElement = allElements.find(el => {
        const text = (el.textContent || '').trim();
        if ((text === 'Promotion' || text.startsWith('Promotion')) && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.top > streamingNowRect.bottom;
        }
        return false;
      });
      
      const searchRangeBottom = promotionElement ? promotionElement.getBoundingClientRect().top : streamingNowRect.bottom + 500;
      
      // 優化：只搜尋可能的卡片容器（div, article, section 等）
      const cardSelectors = ['div', 'article', 'section', 'a'];
      const allCards = [];
      
      for (const selector of cardSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 150 && rect.width < 600 && 
              rect.height > 150 && rect.height < 500 &&
              rect.top >= streamingNowRect.bottom && 
              rect.top < searchRangeBottom &&
              el.offsetParent !== null &&
              (el.querySelector('img') || el.querySelector('video'))) {
            allCards.push({ el, rect });
          }
        }
      }
      
      const clickableElements = [];
      for (const card of allCards) {
        let hasLiveTag = false;
        // 優化：只檢查直接子元素和常見的標籤容器
        const cardChildren = Array.from(card.el.querySelectorAll(':scope > *, :scope > * > span, :scope > * > div'));
        
        for (const child of cardChildren) {
          const childRect = child.getBoundingClientRect();
          const styles = window.getComputedStyle(child);
          const bgColor = styles.backgroundColor;
          
          const isRedBg = bgColor && (bgColor.includes('rgb(255') || bgColor.includes('rgb(240') || bgColor.includes('rgb(220') || bgColor.includes('rgb(200'));
          const isSmallTag = childRect.width > 15 && childRect.width < 100 && childRect.height > 10 && childRect.height < 60;
          
          if (isRedBg && isSmallTag) {
            hasLiveTag = true;
            break;
          }
        }
        
        if (hasLiveTag) {
          clickableElements.push({
            el: card.el,
            text: (card.el.textContent || '').trim().substring(0, 50),
            tag: card.el.tagName,
            x: card.rect.x + card.rect.width / 2,
            y: card.rect.y + card.rect.height / 2,
            isLiveCard: true,
            cardX: Math.round(card.rect.x)
          });
        }
      }
      
      if (clickableElements.length === 0 && allCards.length > 0) {
        allCards.sort((a, b) => a.rect.x - b.rect.x);
        const card = allCards[0];
        clickableElements.push({
          el: card.el,
          text: (card.el.textContent || '').trim().substring(0, 50),
          tag: card.el.tagName,
          x: card.rect.x + card.rect.width / 2,
          y: card.rect.y + card.rect.height / 2,
          isLiveCard: false,
          cardX: Math.round(card.rect.x)
        });
      }
      
      clickableElements.sort((a, b) => {
        if (a.isLiveCard && !b.isLiveCard) return -1;
        if (!a.isLiveCard && b.isLiveCard) return 1;
        return a.cardX - b.cardX;
      });
      
      if (clickableElements.length === 0) return { found: true, hasClickable: false };
      
      return { found: true, hasClickable: true, ...clickableElements[0] };
    });
    
    // 減少等待時間，只等待必要的渲染完成
    await page.waitForTimeout(500);
    
    if (!streamingNowInfo?.found) {
      const shot = path.join(debugDir, `test2-error-${timestamp}.png`);
      await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      return { clicked: false, message: 'Streaming Now 元件未找到', debug: { screenshot: shot } };
    }
    
    if (!streamingNowInfo.hasClickable) {
      const shot = path.join(debugDir, `test2-error-${timestamp}.png`);
      await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      return { clicked: false, message: 'Streaming Now 下方沒有可點擊的元素', debug: { screenshot: shot } };
    }
    
    const shotBeforeClick = path.join(debugDir, `test2-before-click-${timestamp}.png`);
    await page.screenshot({ path: shotBeforeClick, fullPage: false }).catch(() => {});
    const originalUrl = page.url();
    const newPagePromise = context.waitForEvent('page', { timeout: 10000 });
    
    await page.mouse.click(streamingNowInfo.x, streamingNowInfo.y);
    
    let newPage;
    try {
      newPage = await newPagePromise;
      await newPage.waitForLoadState('domcontentloaded', { timeout: 15000 });
      await newPage.waitForTimeout(3000);
    } catch (e) {
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const shot = path.join(debugDir, `test2-error-${timestamp}.png`);
      await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      return {
        clicked: true,
        newPageOpened: false,
        message: currentUrl !== originalUrl ? '❌ 點擊元件但沒有開啟新視窗（同頁面導航）' : '❌ 點擊元件但沒有開啟新視窗',
        clickedElement: { tag: streamingNowInfo.tag, text: streamingNowInfo.text, isLiveCard: streamingNowInfo.isLiveCard },
        debug: { screenshot: shot }
      };
    }
    
    const shotNewPage = path.join(debugDir, `test2-new-page-${timestamp}.png`);
    await newPage.screenshot({ path: shotNewPage, fullPage: false }).catch(() => {});
    
    await newPage.waitForTimeout(2000);
    
    // 4️⃣ gVersion 檢測
    const gVersionResult = await checkGVersion(newPage).catch(err => ({ found: false, error: String(err) }));
    
    // 5️⃣ 點擊 MULAI BERMAIN
    const howToPlayResult = await checkHowToPlayDialog(newPage, timestamp);
    
    const maxButton3MResult = await checkMaxButton(newPage, timestamp, 3000000, '3M').catch(err => ({ success: false, error: String(err) }));
    const minButton200Result = await checkMinButton(newPage, timestamp, 200).catch(err => ({ success: false, error: String(err) }));
    
    // 創建 checks 對象用於測試函數
    const checks = {};
    
    const plusButton28Result = await testBetPlus28(newPage, checks).catch(err => ({ success: false, error: String(err) }));
    const minusButton28Result = await testBetMinus28(newPage, checks).catch(err => ({ success: false, error: String(err) }));
    const spinRoundPlus4Result = await checkSpinRoundPlusButton(newPage, timestamp, 4).catch(err => ({ success: false, error: String(err) }));
    const spinRoundMinus5Result = await checkSpinRoundMinusButton(newPage, timestamp, 5).catch(err => ({ success: false, error: String(err) }));
    
    // 1️⃣3️⃣ 點擊 Play 前記錄 Balance
    const playButtonResult = await checkPlayButton(newPage, timestamp).catch(err => ({ success: false, error: String(err) }));
    if (playButtonResult.balanceBeforePlay) {
        spinMetrics.balanceBeforePlay = playButtonResult.balanceBeforePlay;
        console.log(`💰 點擊 Play 前餘額: ${spinMetrics.balanceBeforePlay}`);
    }
    
    let giftTestResult;
    try {
      giftTestResult = await testGiftFlow(newPage, timestamp, checks);
    } catch (err) {
      giftTestResult = { success: false, error: String(err && err.message || err) };
      checks.gift = giftTestResult;
    }
    
    let chatInputResult;
    try {
      chatInputResult = await checkChatInput(newPage, timestamp);
    } catch (err) {
      chatInputResult = { success: false, error: String(err && err.message || err) };
    }
    
    return {
      clicked: true,
      newPageOpened: true,
      newPage: newPage,  // 返回 newPage 對象
      spinMetrics: spinMetrics, // 返回累積的數據
      newPageUrl: newPage.url(),
      clickedElement: { tag: streamingNowInfo.tag, text: streamingNowInfo.text, isLiveCard: streamingNowInfo.isLiveCard },
      howToPlayClosed: howToPlayResult.closed,
      howToPlayMessage: howToPlayResult.message,
      gVersion: gVersionResult,
      maxButton3M: maxButton3MResult,
      minButton200: minButton200Result,
      plusButton28: plusButton28Result,
      minusButton28: minusButton28Result,
      spinRoundPlus4: spinRoundPlus4Result,
      spinRoundMinus5: spinRoundMinus5Result,
      playButton: playButtonResult,
      giftTest: giftTestResult,
      giftData: checks.gift, // 新的 gift 數據結構
      chatInput: chatInputResult,
      checks: checks, // 傳遞 checks 對象給 summary 使用
      message: gVersionResult.found ? 
               `✅ 全部測試完成！點擊卡片 -> 開啟新視窗 -> gVersion: ${gVersionResult.version} -> 點擊 MULAI BERMAIN` :
               `⚠️  點擊卡片、開啟新視窗成功，但 gVersion 檢測失敗`,
      debug: { screenshotBeforeClick: shotBeforeClick, screenshotNewPage: shotNewPage, ...howToPlayResult.debug }
    };
    
  } catch (error) {
    return {
      clicked: false,
      error: String(error && error.message || error),
      message: `測試失敗: ${error && error.message || error}`
    };
  }
}

async function checkHowToPlayDialog(page, timestamp) {
  try {
    // 等待頁面穩定，Cara Bermain 視窗會立即彈出
    await page.waitForTimeout(2000);
    
    // 使用多種選擇器嘗試等待 modal 出現，最多等待 15 秒
    let modalElement = null;
    const modalSelectors = [
      'div.modal.show',
      'div.modal.fade.show',
      '[role="dialog"].show',
      '[role="dialog"].fade.show',
      'div[class*="modal"][class*="show"]',
      'div[class*="dialog"][class*="show"]',
      'body > div.fade.modal.show',
      'body > div.modal.show'
    ];
    
    for (const selector of modalSelectors) {
      try {
        modalElement = await page.waitForSelector(selector, { 
          state: 'visible', 
          timeout: 3000 
        }).catch(() => null);
        if (modalElement) {
          // 驗證 modal 確實可見
          const isVisible = await page.evaluate((modal) => {
            if (!modal) return false;
            const rect = modal.getBoundingClientRect();
            const styles = window.getComputedStyle(modal);
            return rect.width > 0 && rect.height > 0 && 
                   styles.display !== 'none' && 
                   styles.visibility !== 'hidden' && 
                   parseFloat(styles.opacity) > 0;
          }, modalElement).catch(() => false);
          
          if (isVisible) {
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    // 如果所有選擇器都失敗，嘗試通用查找
    if (!modalElement) {
      const modalInfo = await page.evaluate(() => {
        const modals = document.querySelectorAll('div[class*="modal"], [role="dialog"]');
        for (const modal of modals) {
          const rect = modal.getBoundingClientRect();
          const styles = window.getComputedStyle(modal);
          if (rect.width > 200 && rect.height > 200 && 
              styles.display !== 'none' && 
              styles.visibility !== 'hidden' && 
              parseFloat(styles.opacity) > 0) {
            // 返回選擇器字符串，而不是元素本身
            let selector = '';
            if (modal.id) {
              selector = `#${modal.id}`;
            } else if (modal.className) {
              const classes = modal.className.split(' ').filter(c => c).join('.');
              selector = `${modal.tagName.toLowerCase()}.${classes}`;
            } else {
              selector = modal.tagName.toLowerCase();
            }
            return selector;
          }
        }
        return null;
      }).catch(() => null);
      
      if (modalInfo) {
        modalElement = await page.$(modalInfo).catch(() => null);
      }
    }
    
    if (!modalElement) {
      const shotBefore = path.join(debugDir, `test2-how-to-play-before-${timestamp}.png`);
      await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
      return { closed: false, message: 'Modal 對話框未找到', debug: { screenshot: shotBefore } };
    }
    
    // 確保 modal 完全載入
    await page.waitForTimeout(1000);
    
    const shotBefore = path.join(debugDir, `test2-how-to-play-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    // 優先使用指定的選擇器查找按鈕
    const directSelector = 'body > div.fade.modal.show > div > div > div.modal-body > div._footer_dgd9w_213 > button';
    let directHandle = await page.$(directSelector).catch(() => null);
    let startButtonInfo = null;
    
    if (directHandle) {
      const info = await page.evaluate((btn) => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && btn.offsetParent !== null) {
          return {
            found: true,
            text: (btn.textContent || '').trim(),
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
          };
        }
        return { found: false };
      }, directHandle).catch(() => ({ found: false }));
      
      if (info?.found) {
        startButtonInfo = info;
      }
    }
    
    // 如果直接選擇器找不到，嘗試在 modal 內查找
    if (!startButtonInfo && modalElement) {
      const buttonInfo = await page.evaluate((modal) => {
        const selector = 'div.modal-body > div._footer_dgd9w_213 > button, div.modal-body button, div[class*="footer"] button';
        const btn = modal.querySelector(selector);
        if (btn) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && btn.offsetParent !== null) {
            return {
              found: true,
              text: (btn.textContent || '').trim(),
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2
            };
          }
        }
        return { found: false };
      }, modalElement).catch(() => ({ found: false }));
      
      if (buttonInfo?.found) {
        startButtonInfo = buttonInfo;
      }
    }
    
    // 如果指定選擇器找不到，則使用其他方式查找
    if (!startButtonInfo || !startButtonInfo.found) {
      // 在 modal 中查找 MULAI BERMAIN 按鈕
      startButtonInfo = await page.evaluate((modal) => {
        if (!modal) return { found: false, reason: 'Modal 元素無效' };
        
        const buttons = modal.querySelectorAll('button, [role="button"], a, div[onclick], span[onclick]');
        const candidates = [];
        
        for (const btn of buttons) {
          if (btn.offsetParent === null) continue;
          const rect = btn.getBoundingClientRect();
          if (rect.width <= 80 || rect.width >= 500 || rect.height <= 25 || rect.height >= 120) continue;
          
          const text = (btn.textContent || '').trim();
          const upperText = text.toUpperCase();
          const normalized = upperText.replace(/\s+/g, ' ').trim();
          
          // 匹配 MULAI BERMAIN
          const matchesLabel = normalized === 'MULAI BERMAIN' ||
                               normalized.includes('MULAI BERMAIN') ||
                               (upperText.includes('MULAI') && upperText.includes('BERMAIN') && text.length < 50) ||
                               normalized === 'START PLAYING' ||
                               normalized.includes('START PLAYING');
          
          if (matchesLabel) {
            const styles = window.getComputedStyle(btn);
            const bgColor = styles.backgroundColor;
            const isGreen = bgColor && (
              bgColor.includes('rgb(76') || 
              bgColor.includes('rgb(34, 197') || 
              bgColor.includes('rgb(0, 200') ||
              bgColor.includes('rgb(0, 128') ||
              bgColor.includes('#00')
            );
            
            candidates.push({
              found: true,
              text,
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              score: (isGreen ? 100 : 0) + (text.length < 20 ? 50 : 0) + (normalized.includes('MULAI BERMAIN') ? 50 : 0)
            });
          }
        }
        
        if (!candidates.length) {
          // 如果找不到匹配的按鈕，嘗試找最大的按鈕（可能是 MULAI BERMAIN）
          const allButtons = Array.from(buttons)
            .filter(btn => {
              if (btn.offsetParent === null) return false;
              const rect = btn.getBoundingClientRect();
              return rect.width >= 100 && rect.width <= 400 && rect.height >= 30 && rect.height <= 100;
            })
            .map(btn => {
              const rect = btn.getBoundingClientRect();
              const text = (btn.textContent || '').trim();
              return {
                found: true,
                text: text || '按鈕',
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                score: rect.width * rect.height // 按面積排序
              };
            })
            .sort((a, b) => b.score - a.score);
          
          if (allButtons.length > 0) {
            return allButtons[0];
          }
          
          const sampleTexts = Array.from(buttons)
            .filter(btn => btn.offsetParent !== null)
            .map(btn => {
              const text = (btn.textContent || '').trim();
              const rect = btn.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && text.length > 0 && text.length < 50) {
                return text;
              }
              return null;
            })
            .filter(Boolean)
            .slice(0, 10);
          return { found: false, reason: 'MULAI BERMAIN 按鈕未找到', debug: `找到的按鈕文字: ${sampleTexts.join(', ') || '無'}` };
        }
        
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0];
      }, modalElement).catch(() => ({ found: false, reason: '評估按鈕時發生錯誤' }));
    }
    
    if (!startButtonInfo || !startButtonInfo.found) {
      const reason = startButtonInfo?.reason || '未知原因';
      return { closed: false, message: `MULAI BERMAIN 按鈕未找到: ${reason}`, debug: { screenshot: shotBefore } };
    }
    
    let clicked = false;
    
    try {
      const buttonLocator = page.locator(`button:has-text("${startButtonInfo.text}"), [role="button"]:has-text("${startButtonInfo.text}")`).first();
      await buttonLocator.click({ timeout: 3000 });
      clicked = true;
    } catch (e) {
      try {
        await page.mouse.click(startButtonInfo.x, startButtonInfo.y);
        clicked = true;
      } catch (e2) {
        clicked = await page.evaluate((x, y) => {
          const element = document.elementFromPoint(x, y);
          return element ? (element.click(), true) : false;
        }, startButtonInfo.x, startButtonInfo.y).catch(() => false);
      }
    }
    
    if (!clicked) {
      return { closed: false, message: '無法點擊 MULAI BERMAIN 按鈕', debug: { screenshot: shotBefore } };
    }
    await page.waitForTimeout(3000); // 增加等待時間
    
    const shotAfter = path.join(debugDir, `test2-how-to-play-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    // 檢查 modal 是否消失
    const dialogStillVisible = await page.evaluate(() => {
      const modals = document.querySelectorAll('div.modal.show, div.modal.fade.show, [role="dialog"].show, [role="dialog"].fade.show');
      for (const modal of modals) {
        const rect = modal.getBoundingClientRect();
        const styles = window.getComputedStyle(modal);
        if (rect.width > 0 && rect.height > 0 && 
            styles.display !== 'none' && 
            styles.visibility !== 'hidden' && 
            parseFloat(styles.opacity) > 0) {
          return true;
        }
      }
      return false;
    });
    
    if (dialogStillVisible) {
      return { closed: false, message: '點擊 MULAI BERMAIN 按鈕後，Modal 彈窗未關閉', debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter } };
    }
    
    return { closed: true, message: '已成功點擊 MULAI BERMAIN 按鈕，Modal 彈窗已關閉', debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter } };
    
  } catch (error) {
    return { closed: false, error: String(error && error.message || error), message: `Cara Bermain 關閉測試失敗: ${error && error.message || error}` };
  }
}

async function checkMaxButton(page, timestamp, expectedAmount, testLabel) {
  try {
    await page.waitForTimeout(1000);
    
    const maxButtonInfo = await (async () => {
      const directSelector = '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div:nth-child(1) > div > button:nth-child(5)';
      const directHandle = await page.$(directSelector);
      if (directHandle) {
        const info = await page.evaluate((btn) => {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && btn.offsetParent !== null) {
            return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          }
          return { found: false };
        }, directHandle);
        if (info?.found) {
          return info;
        }
      }
      
      return await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('button, [role="button"], div, span'));
        for (const el of allElements) {
          const text = (el.textContent || '').trim().toUpperCase();
          if (text === 'MAX' && el.offsetParent !== null) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            }
          }
        }
        return { found: false };
      });
    })();
    
    if (!maxButtonInfo.found) {
      return { success: false, message: 'MAX 按鈕未找到' };
    }
    
    const amountBefore = await getDisplayedAmount(page);
    await page.mouse.move(maxButtonInfo.x, maxButtonInfo.y);
    await page.waitForTimeout(100);
    await page.mouse.click(maxButtonInfo.x, maxButtonInfo.y);
    await page.waitForTimeout(1500);
    // 使用 expectedAmount 作為參考，確保我們找到的是變更後的 Bet 金額，而不是 Balance
    const amountAfter = await getDisplayedAmount(page, expectedAmount);
    
    const shot = path.join(debugDir, `test2-max-${testLabel}-${timestamp}.png`);
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    
    if (amountAfter === expectedAmount) {
      return {
        success: true,
        message: `金額正確變成 ${amountAfter.toLocaleString()}`,
        amountBefore,
        amountAfter,
        expectedAmount,
        debug: { screenshot: shot }
      };
    } else {
      return {
        success: false,
        message: `金額不符預期，預期: ${expectedAmount.toLocaleString()}, 實際: ${amountAfter.toLocaleString()}`,
        amountBefore,
        amountAfter,
        expectedAmount,
        debug: { screenshot: shot }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: String(error && error.message || error),
      message: `MAX 按鈕測試失敗: ${error && error.message || error}`
    };
  }
}

async function checkMinButton(page, timestamp, expectedAmount) {
  try {
    await page.waitForTimeout(1000);
    
    const minButtonInfo = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('button, [role="button"], div, span'));
      for (const el of allElements) {
        const text = (el.textContent || '').trim().toUpperCase();
        if (text === 'MIN' && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          }
        }
      }
      return { found: false };
    });
    
    if (!minButtonInfo.found) {
      return { success: false, message: 'MIN 按鈕未找到' };
    }
    
    const amountBefore = await getDisplayedAmount(page);
    await page.mouse.click(minButtonInfo.x, minButtonInfo.y);
    await page.waitForTimeout(800);
    // 使用 expectedAmount 作為參考
    const amountAfter = await getDisplayedAmount(page, expectedAmount);
    
    const shot = path.join(debugDir, `test2-min-${timestamp}.png`);
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    
    if (amountAfter === expectedAmount) {
      return {
        success: true,
        message: `金額正確變成 ${amountAfter.toLocaleString()}`,
        amountBefore,
        amountAfter,
        expectedAmount,
        debug: { screenshot: shot }
      };
    } else {
      return {
        success: false,
        message: `金額不符預期，預期: ${expectedAmount.toLocaleString()}, 實際: ${amountAfter.toLocaleString()}`,
        amountBefore,
        amountAfter,
        expectedAmount,
        debug: { screenshot: shot }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: String(error && error.message || error),
      message: `MIN 按鈕測試失敗: ${error && error.message || error}`
    };
  }
}


async function getDisplayedAmount(page, expectedValue = null) {
  return await page.evaluate(() => {
    let scope = document;
    const panel = document.querySelector('#CONTROLS_PANEL');
    if (panel) scope = panel;
    
    const selectors = 'div, span, p, b, strong, label, h1, h2, h3, h4, h5, h6, input';
    const allElements = Array.from(scope.querySelectorAll(selectors));
    
    const candidates = [];
    
    for (const el of allElements) {
      const text = (el.textContent || '').trim();
      // 快速過濾
      if (!text || text.length > 20 || !/\d/.test(text)) continue;

      const cleanText = text.replace(/[,$€£¥\s]/g, '');
      
      const match = cleanText.match(/^(\d[\d,]*\.?\d*)$/);
      if (match) {
        const numberValue = parseFloat(match[1].replace(/,/g, ''));
        // 限制範圍：bet 金額通常在 200 ~ 10,000,000 之間
        if (numberValue >= 0 && numberValue <= 10000000) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && el.offsetParent !== null) {
            const styles = window.getComputedStyle(el);
            const fontSize = parseFloat(styles.fontSize);
            if (fontSize >= 10) {  // 放寬字體限制
              candidates.push(numberValue);
              // 優化：如果已經找到 5 個候選，提前結束
              if (candidates.length >= 5) break;
            }
          }
        }
      }
    }
    
    if (candidates.length === 0) return 0;
    
    // 返回第一個候選（通常是最相關的）
    return candidates[0];
  });
}

async function getSpinRoundValue(page) {
  try {
    await page.waitForSelector('#CONTROLS_PANEL', { timeout: 5000 }).catch(() => {});
  } catch (err) {}
  
  return await page.evaluate(() => {
    let wrapper = document.querySelector('#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div._wrapper_1qt5t_234 > div');
    if (!wrapper) {
      const controlsPanel = document.querySelector('#CONTROLS_PANEL');
      if (!controlsPanel) {
        return { found: false, reason: 'CONTROLS_PANEL 未找到' };
      }
      const allDivs = controlsPanel.querySelectorAll('div');
      let foundWrapper = null;
      for (const div of allDivs) {
        const buttons = div.querySelectorAll('button');
        if (buttons.length >= 2 && /\d+/.test(div.textContent || '')) {
          foundWrapper = div;
          break;
        }
      }
      if (!foundWrapper) {
        return { found: false, reason: 'Spin Round 容器未找到' };
      }
      wrapper = foundWrapper;
    }
    
    const wrapperText = wrapper.textContent || '';
    const numberMatches = wrapperText.match(/\d+/g);
    if (numberMatches) {
      for (const match of numberMatches) {
        const num = parseInt(match, 10);
        if (num >= 20 && num <= 1000) {
          const allElements = Array.from(wrapper.querySelectorAll('*'));
          for (const el of allElements) {
            const text = (el.textContent || '').trim();
            if (text === match) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && el.offsetParent !== null) {
                return { found: true, value: num, text: match };
              }
            }
          }
        }
      }
    }
    
    const allElements = Array.from(wrapper.querySelectorAll('*'));
    const candidates = [];
    for (const el of allElements) {
      if (el.offsetParent === null) continue;
      const text = (el.textContent || '').trim();
      if (/^\d+$/.test(text)) {
        const num = parseInt(text, 10);
        if (num >= 20 && num <= 1000) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && wrapper.querySelectorAll('button').length >= 2) {
            candidates.push({ el, num, text, rect });
          }
        }
      }
    }
    
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.rect.left - b.rect.left);
      const middle = candidates[Math.floor(candidates.length / 2)];
      return { found: true, value: middle.num, text: middle.text };
    }
    
    const directMatches = wrapperText.match(/\b(\d{2,4})\b/g);
    if (directMatches) {
      for (const match of directMatches) {
        const num = parseInt(match, 10);
        if (num >= 20 && num <= 1000) {
          return { found: true, value: num, text: match };
        }
      }
    }
    
    return { found: false, reason: 'Spin Round 數值未找到' };
  });
}

async function checkSpinRoundPlusButton(page, timestamp, times) {
  try {
    const initialValue = await getSpinRoundValue(page);
    if (!initialValue.found) {
      return { success: false, step: 'locate-initial', timestamp, error: initialValue.reason || '無法找到 Spin Round 初始值' };
    }
    
    const values = [initialValue.value];
    let prevValue = initialValue.value;
    let increasingCount = 0;
    const plusButtonSelector = '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div._wrapper_1qt5t_234 > div > button:nth-child(3)';
    const plusSvgSelector = '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div._wrapper_1qt5t_234 > div > button:nth-child(3) > svg';
    
    for (let i = 0; i < times; i++) {
      const buttonExists = await page.$(plusButtonSelector);
      if (!buttonExists) {
        return { success: false, step: 'locate-plus-button', timestamp, error: `第 ${i + 1} 次點擊前，找不到 Spin Round + 按鈕` };
      }
      
      const svgExists = await page.$(plusSvgSelector);
      if (svgExists) {
        await page.click(plusSvgSelector);
      } else {
        await page.click(plusButtonSelector);
      }
      await page.waitForTimeout(200);
      
      const afterValue = await getSpinRoundValue(page);
      if (!afterValue.found) {
        return { success: false, step: 'read-after-click', timestamp, error: `第 ${i + 1} 次點擊後，無法讀取 Spin Round 值` };
      }
      
      const current = afterValue.value;
      values.push(current);
      if (current > prevValue) increasingCount++;
      prevValue = current;
    }
    const success = increasingCount === times;

    const shot = path.join(debugDir, `test2-spin-round-plus-${timestamp}.png`);
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});

    return {
      success,
      type: 'spin-round-plus',
      timestamp,
      valueBefore: values[0],
      valueAfter: values[values.length - 1],
      values,
      increasingCount,
      expectedClicks: times,
      message: success ? `Spin Round 持續遞增（${increasingCount}/${times} 次）` : `Spin Round 沒有持續遞增，只有 ${increasingCount}/${times} 次遞增`,
      debug: { screenshot: shot }
    };
  } catch (err) {
    return {
      success: false,
      timestamp,
      error: String(err),
    };
  }
}

async function checkSpinRoundMinusButton(page, timestamp, times) {
  try {
    const initialValue = await getSpinRoundValue(page);
    if (!initialValue.found) {
      return { success: false, step: 'locate-initial', timestamp, error: initialValue.reason || '無法找到 Spin Round 初始值' };
    }
    
    const values = [initialValue.value];
    let prevValue = initialValue.value;
    let decreasingCount = 0;
    const minusButtonSelector = '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div._wrapper_1qt5t_234 > div > button:nth-child(1)';
    const minusSvgSelector = '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div._wrapper_1qt5t_234 > div > button:nth-child(1) > svg';
    
    for (let i = 0; i < times; i++) {
      const buttonExists = await page.$(minusButtonSelector);
      if (!buttonExists) {
        return { success: false, step: 'locate-minus-button', timestamp, error: `第 ${i + 1} 次點擊前，找不到 Spin Round - 按鈕` };
      }
      
      const svgExists = await page.$(minusSvgSelector);
      if (svgExists) {
        await page.click(minusSvgSelector);
      } else {
        await page.click(minusButtonSelector);
      }
      await page.waitForTimeout(200);
      
      const afterValue = await getSpinRoundValue(page);
      if (!afterValue.found) {
        return { success: false, step: 'read-after-click', timestamp, error: `第 ${i + 1} 次點擊後，無法讀取 Spin Round 值` };
      }
      
      const current = afterValue.value;
      values.push(current);
      if (current < prevValue) decreasingCount++;
      prevValue = current;
    }
    const success = decreasingCount === times;

    const shot = path.join(debugDir, `test2-spin-round-minus-${timestamp}.png`);
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});

    return {
      success,
      type: 'spin-round-minus',
      timestamp,
      valueBefore: values[0],
      valueAfter: values[values.length - 1],
      values,
      decreasingCount,
      expectedClicks: times,
      message: success ? `Spin Round 持續遞減（${decreasingCount}/${times} 次）` : `Spin Round 沒有持續遞減，只有 ${decreasingCount}/${times} 次遞減`,
      debug: { screenshot: shot }
    };
  } catch (err) {
    return {
      success: false,
      timestamp,
      error: String(err),
    };
  }
}

async function checkPlayButton(page, timestamp) {
  try {
    await page.waitForTimeout(1000);
    
    const buttonInfo = await page.evaluate(() => {
      const playButtonSelector = '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > button > img';
      const img = document.querySelector(playButtonSelector);
      
      if (!img) {
        return { found: false, reason: 'PLAY 鈕圖片未找到' };
      }
      
      const button = img.closest('button');
      if (!button) {
        return { found: false, reason: 'PLAY 鈕按鈕元素未找到' };
      }
      
      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || button.offsetParent === null) {
        return { found: false, reason: 'PLAY 鈕不可見或不可點擊' };
      }
      
      return {
        found: true,
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
      };
    });
    
    if (!buttonInfo?.found) {
      return { success: false, message: `PLAY 鈕未找到: ${buttonInfo?.reason || '未知原因'}` };
    }
    
    // 記錄點擊前的 Balance
    const balanceBeforePlay = await getDisplayedAmount(page);

    const shotBefore = path.join(debugDir, `test2-play-button-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    await page.mouse.click(buttonInfo.x, buttonInfo.y);
    await page.waitForTimeout(1000);
    
    const shotAfter = path.join(debugDir, `test2-play-button-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    return {
      success: true,
      message: '已成功點擊綠色 PLAY 鈕',
      balanceBeforePlay: balanceBeforePlay, // 回傳點擊前的餘額
      debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error && error.message || error),
      message: `PLAY 鈕測試失敗: ${error && error.message || error}`
    };
  }
}

// 🎁 送禮流程：混合方式（座標 + DOM selector）
async function testGiftFlow(page, timestamp, checks) {
  const result = {
    success: false,
    step1ClickedGiftButton: false,
    step2ClickedCarGift: false,
    step3ClickedConfirm: false,
    step4ClickedClose: false,
    error: null,
  };

  try {
    console.log('🎁 開始送禮 DEMO 流程...');

    // 1️⃣ 點送禮按鈕（維持你原本這顆，如果能穩定打開面板就先不動）
    await page.mouse.click(1325.65625, 736);
    result.step1ClickedGiftButton = true;
    console.log('✅ 步驟1: 點擊送禮按鈕');
    await page.waitForTimeout(800);

    // 2️⃣ 用 DOM 點「車子」img
    const carGift = page.locator(
      '#IM_PANEL > div.gift-modal-enter-done > div._container_1ws9g_1 > div._gridContent_1ws9g_45 > div:nth-child(5) > img'
    );
    await carGift.waitFor({ state: 'visible', timeout: 5000 });
    await carGift.click();
    result.step2ClickedCarGift = true;
    console.log('✅ 步驟2: 使用 DOM 點擊車子禮物 img');
    await page.waitForTimeout(500);

    // 3️⃣ 用 DOM 點「Confirm」button
    const confirmBtn = page.locator(
      '#IM_PANEL > div.gift-modal-enter-done > div._container_1ws9g_1 > div._gridContent_1ws9g_45 > div:nth-child(5) > button'
    );
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();
    result.step3ClickedConfirm = true;
    console.log('✅ 步驟3: 使用 DOM 點擊車子底下的 Confirm button');
    await page.waitForTimeout(800);

    // 4️⃣ 用 DOM 點關閉禮物介面的「X」icon（你提供的 svg selector）
    const closeIcon = page.locator(
      '#IM_PANEL > div.gift-modal-enter-done > div._container_1ws9g_1 > button > svg'
    );
    await closeIcon.waitFor({ state: 'visible', timeout: 5000 });
    await closeIcon.click();
    result.step4ClickedClose = true;
    console.log('✅ 步驟4: 使用 DOM 點擊關閉禮物視窗的 svg');
    await page.waitForTimeout(800);

    // ✅ 四步都成功就當整個送禮流程 PASS（先不管 balance）
    if (
      result.step1ClickedGiftButton &&
      result.step2ClickedCarGift &&
      result.step3ClickedConfirm &&
      result.step4ClickedClose
    ) {
      result.success = true;
      console.log('🎉 送禮流程四步驟皆完成（Gift 開啟 + 車子 + Confirm + 關閉）');
    } else {
      result.success = false;
      result.error = '送禮四步中有步驟未完成';
      console.log(`❌ 送禮流程不完整: ${result.error}`);
    }
  } catch (err) {
    result.success = false;
    result.error = `送禮流程發生例外錯誤: ${err}`;
    console.error(result.error);
  }

  checks.gift = result;
  return result;
}

async function clickInAnyFrame(page, selector, times, label) {
  const result = {
    success: false,
    clicks: 0,
    error: null,
    frameUrl: null,
  };
  try {
    console.log(`🧩 [${label}] 開始在所有 frame 中尋找 selector: ${selector}`);
    const frames = page.frames();
    let targetFrame = null;
    for (const frame of frames) {
      const has = await frame.evaluate((sel) => !!document.querySelector(sel), selector).catch(() => false);
      if (has) {
        targetFrame = frame;
        result.frameUrl = frame.url();
        break;
      }
    }
    if (!targetFrame) {
      result.error = '沒有任何 frame 找到對應元素';
      console.log(`❌ [${label}] ${result.error}`);
      return result;
    }
    console.log(`✅ [${label}] 在 frame 中找到元素，frame URL: ${result.frameUrl}`);
    const loc = targetFrame.locator(selector).first();
    await loc.waitFor({ state: 'visible', timeout: 5000 });
    for (let i = 0; i < times; i++) {
      await loc.click();
      result.clicks++;
      await page.waitForTimeout(80);
    }
    if (result.clicks === times) {
      result.success = true;
      console.log(`🎉 [${label}] 已成功點擊 ${times} 次`);
    } else {
      result.error = `預期 ${times} 次，實際只有 ${result.clicks} 次`;
      console.log(`⚠️ [${label}] ${result.error}`);
    }
  } catch (err) {
    result.error = `[${label}] 發生例外錯誤: ${err}`;
    console.error('💥 ' + result.error);
  }
  return result;
}

// 9️⃣ + 按鈕 28 次：跨 frame 找 svg，連點 28 次
async function testBetPlus28(page, checks) {
  const selector =
    '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div:nth-child(1) > div > button:nth-child(4) > svg';
  const res = await clickInAnyFrame(page, selector, 28, '+ 按鈕 28 次');
  checks.betPlus28 = res;
  return res;
}

// 🔟 - 按鈕 28 次：跨 frame 找 svg，連點 28 次
async function testBetMinus28(page, checks) {
  const selector =
    '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div:nth-child(1) > div > button:nth-child(2) > svg';
  const res = await clickInAnyFrame(page, selector, 28, '- 按鈕 28 次');
  checks.betMinus28 = res;
  return res;
}

async function checkChatInput(page, timestamp) {
  try {
    await page.waitForTimeout(1000);
    
    const textareaInfo = await page.evaluate(() => {
      const textarea = document.querySelector('#chat-message-input');
      
      if (!textarea) {
        return { found: false, reason: '聊天輸入欄位未找到' };
      }
      
      const rect = textarea.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || textarea.offsetParent === null) {
        return { found: false, reason: '聊天輸入欄位不可見' };
      }
      
      return {
        found: true,
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
      };
    });
    
    if (!textareaInfo?.found) {
      return { success: false, message: `聊天輸入欄位未找到: ${textareaInfo?.reason || '未知原因'}` };
    }
    
    const shotBefore = path.join(debugDir, `test2-chat-input-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    await page.click('#chat-message-input');
    await page.fill('#chat-message-input', 'SNS-Test');
    await page.waitForTimeout(500);
    
    const sendButtonInfo = await page.evaluate(() => {
      const selector = '#IM_PANEL > div._container_1hjxc_1 > button:nth-child(3)';
      const button = document.querySelector(selector);
      if (!button) return { found: false, reason: 'Send 按鈕未找到' };
      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || button.offsetParent === null) {
        return { found: false, reason: 'Send 按鈕不可見或不可點擊' };
      }
      return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    
    if (!sendButtonInfo?.found) {
      return { success: false, message: `Send 按鈕未找到: ${sendButtonInfo?.reason || '未知原因'}`, textEntered: true, debug: { screenshotBefore: shotBefore } };
    }
    
    await page.mouse.click(sendButtonInfo.x, sendButtonInfo.y);
    await page.waitForTimeout(1000);
    
    const shotAfter = path.join(debugDir, `test2-chat-input-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    
    return {
      success: true,
      message: '已成功完成聊天視窗輸入測試（輸入文字並發送）',
      textEntered: 'SNS-Test',
      debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error && error.message || error),
      message: `聊天視窗輸入測試失敗: ${error && error.message || error}`
    };
  }
}

module.exports = { checkWebsite };
