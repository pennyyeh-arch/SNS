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
    } catch (err) {
      results.checks.streamingNowClick = { clicked: false, error: String(err && err.message || err) };
    }

    // ????Spin 20甈?Balance閮?皜祈岫嚗??歇???圈??ｇ?
    if (results.checks.streamingNowClick?.newPage && results.checks.streamingNowClick?.playButton?.success) {
      try {
        // ?喳銋???spinMetrics (? balanceBeforePlay, giftAmount 蝑?
        const metrics = results.checks.streamingNowClick.spinMetrics || {};
        results.checks.spinBalance = await checkSpinBalance(results.checks.streamingNowClick.newPage, timestamp, metrics);
      } catch (err) {
        results.checks.spinBalance = { success: false, error: String(err && err.message || err) };
      }
    }

  } catch (error) {
    console.error('皜祈岫?瑁???銝剔?隤?', error);
    results.error = String(error && error.message || error);
    results.stack = error && error.stack ? error.stack : undefined;
  } finally {
    try {
    const allTestsPassed = results.checks.streamingNowClick?.newPageOpened && 
                          results.checks.streamingNowClick?.gVersion?.found &&
                          results.checks.streamingNowClick?.howToPlayClosed &&
                            results.checks.streamingNowClick?.maxButton3M?.success &&
                            results.checks.streamingNowClick?.minButton200?.success &&
                            results.checks.streamingNowClick?.plusButton28?.success &&
                            results.checks.streamingNowClick?.minusButton28?.success &&
                            results.checks.streamingNowClick?.spinRoundPlus4?.success &&
                            results.checks.streamingNowClick?.spinRoundMinus5?.success &&
                            results.checks.streamingNowClick?.playButton?.success &&
                            results.checks.streamingNowClick?.giftTest?.success &&
                            results.checks.streamingNowClick?.chatInput?.success &&
                            results.checks.spinBalance?.success;
      
      if (allTestsPassed) {
        console.log('??????葫閰血????汗?其????????冽閬?...');
        console.log('??  隢????汗??);
      } else {
        console.log('??  皜祈岫?芸??冽????汗?其?????60 蝘誑靘炎??..');
        console.log(`   1儭 Stream n'Spin 敶?: ${results.checks.streamNSpinDialog?.clicked ? '?? : '??}`);
      console.log(`   2儭 暺? LIVE ?∠?: ${results.checks.streamingNowClick?.clicked ? '?? : '??}`);
      console.log(`   3儭 ?啗?蝒??? ${results.checks.streamingNowClick?.newPageOpened ? '?? : '??}`);
      console.log(`   4儭 gVersion 瑼Ｘ葫: ${results.checks.streamingNowClick?.gVersion?.found ? '?? : '??}`);
      console.log(`   5儭 Cara Bermain ??: ${results.checks.streamingNowClick?.howToPlayClosed ? '?? : '??}`);
        console.log(`   7儭 MAX ??嚗?M嚗? ${results.checks.streamingNowClick?.maxButton3M?.success ? '?? : '??}`);
        console.log(`   8儭 MIN ??嚗?00嚗? ${results.checks.streamingNowClick?.minButton200?.success ? '?? : '??}`);
        console.log(`   9儭 + ?? 28 甈? ${results.checks.streamingNowClick?.plusButton28?.success ? '?? : '??}`);
        console.log(`   ?? - ?? 28 甈? ${results.checks.streamingNowClick?.minusButton28?.success ? '?? : '??}`);
        console.log(`   1儭1儭 Spin Round + ?? 4 甈? ${results.checks.streamingNowClick?.spinRoundPlus4?.success ? '?? : '??}`);
        console.log(`   1儭2儭 Spin Round - ?? 5 甈? ${results.checks.streamingNowClick?.spinRoundMinus5?.success ? '?? : '??}`);
        console.log(`   1儭3儭 暺?蝬 PLAY ?? ${results.checks.streamingNowClick?.playButton?.success ? '?? : '??}`);
        console.log(`   1儭4儭 ?旨皜祈岫: ${results.checks.streamingNowClick?.giftTest?.success ? '?? : '??}`);
        console.log(`   1儭5儭 ?予閬?頛詨: ${results.checks.streamingNowClick?.chatInput?.success ? '?? : '??}`);
        console.log(`   1儭6儭 Spin 20甈?Balance閮?: ${results.checks.spinBalance?.success ? '?? : '??}`);
        console.log('?梧?  60蝘??芸???嚗?隢????汗??..');
        await page.waitForTimeout(60000).catch(() => {});
        await browser.close().catch(() => {});
        console.log('Browser closed after 60 seconds');
      }
    } catch (finallyError) {
      console.error('finally ?憛銵隤?', finallyError);
      // 蝣箔??汗?刻◤??
      try {
        await browser.close().catch(() => {});
      } catch (closeError) {
        console.error('???汗?冽??潛??航炊:', closeError);
      }
    }
  }

  return results;
}

async function checkGVersion(page) {
  // ?岫憭活瑼Ｘ葫嚗?憭?敺?5 蝘?  for (let i = 0; i < 5; i++) {
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
  
  return { found: false, version: null, message: 'gVersion ?芣?? };
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
                (btnText.includes('confirm') || btnText.includes('ok') || btnText.includes('蝣箄?'))) {
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
      return { found: false, clicked: false, message: 'Stream n\'Spin 敶??芸??, debug: { screenshot: shotBefore } };
    }
    
    if (!dialogInfo.buttonText) {
      return { found: true, clicked: false, message: '?曉敶?雿?曉 Confirm ??', debug: { screenshot: shotBefore } };
    }
    
    await page.mouse.click(dialogInfo.x, dialogInfo.y);
    await page.waitForTimeout(1500);
    
    const shotAfter = path.join(debugDir, `test2-stream-n-spin-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    return {
      found: true,
      clicked: true,
      buttonText: dialogInfo.buttonText,
      message: '?曉 Stream n\'Spin 敶?銝阡???Confirm',
      debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter }
    };
    
  } catch (error) {
    return {
      found: false,
      clicked: false,
      error: String(error && error.message || error),
      message: `Stream n'Spin 敶?皜祈岫憭望?: ${error && error.message || error}`
    };
  }
}

async function checkStreamingNowClick(page, context, timestamp) {
  // ??蕭頩斤隞?  const spinMetrics = {
    balanceBeforePlay: null,
    giftAmount: 0,
    betAmount: 200 // ?身??  };

  try {
    // 皜???蝑???嚗蝙?冽擃???敺???    await page.waitForTimeout(2000);
    
    // 雿輻 instant 皛曉?隞亙?敹恍漲嚗蒂??????
    const streamingNowInfo = await page.evaluate(() => {
      // ???Streaming Now ??
      const streamingNow = Array.from(document.querySelectorAll('*')).find(el => {
        const text = (el.textContent || '').trim();
        return text === 'Streaming Now' || text.startsWith('Streaming Now');
      });
      
      if (!streamingNow) return { found: false, error: 'Streaming Now element not found' };
      
      const streamingNowRect = streamingNow.getBoundingClientRect();
      // 雿輻 instant 皛曉?隞亙?敹恍漲
      window.scrollTo({ top: Math.max(0, (window.pageYOffset || document.documentElement.scrollTop) + streamingNowRect.top - 150), behavior: 'instant' });
      
      // 蝡?????∠?嚗??閬?憭?敺?      const allElements = Array.from(document.querySelectorAll('*'));
      
      const promotionElement = allElements.find(el => {
        const text = (el.textContent || '').trim();
        if ((text === 'Promotion' || text.startsWith('Promotion')) && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.top > streamingNowRect.bottom;
        }
        return false;
      });
      
      const searchRangeBottom = promotionElement ? promotionElement.getBoundingClientRect().top : streamingNowRect.bottom + 500;
      
      // ?芸?嚗???航??捆?剁?div, article, section 蝑?
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
        // ?芸?嚗瑼Ｘ?湔摮?蝝?撣貉???蝐文捆??        const cardChildren = Array.from(card.el.querySelectorAll(':scope > *, :scope > * > span, :scope > * > div'));
        
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
    
    // 皜?蝑???嚗蝑?敹??葡????    await page.waitForTimeout(500);
    
    if (!streamingNowInfo?.found) {
      const shot = path.join(debugDir, `test2-error-${timestamp}.png`);
      await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      return { clicked: false, message: 'Streaming Now ?辣?芣??, debug: { screenshot: shot } };
    }
    
    if (!streamingNowInfo.hasClickable) {
      const shot = path.join(debugDir, `test2-error-${timestamp}.png`);
      await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      return { clicked: false, message: 'Streaming Now 銝瘝??舫?????', debug: { screenshot: shot } };
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
        message: currentUrl !== originalUrl ? '??暺??辣雿????閬?嚗??撠嚗? : '??暺??辣雿????閬?',
        clickedElement: { tag: streamingNowInfo.tag, text: streamingNowInfo.text, isLiveCard: streamingNowInfo.isLiveCard },
        debug: { screenshot: shot }
      };
    }
    
    const shotNewPage = path.join(debugDir, `test2-new-page-${timestamp}.png`);
    await newPage.screenshot({ path: shotNewPage, fullPage: false }).catch(() => {});
    
    await newPage.waitForTimeout(2000);
    
    // 4儭 gVersion 瑼Ｘ葫
    const gVersionResult = await checkGVersion(newPage).catch(err => ({ found: false, error: String(err) }));
    
    // 5儭 暺? MULAI BERMAIN
    const howToPlayResult = await checkHowToPlayDialog(newPage, timestamp);
    
    const maxButton3MResult = await checkMaxButton(newPage, timestamp, 3000000, '3M').catch(err => ({ success: false, error: String(err) }));
    const minButton200Result = await checkMinButton(newPage, timestamp, 200).catch(err => ({ success: false, error: String(err) }));
    const plusButton28Result = await checkPlusButton28(newPage, timestamp).catch(err => ({ success: false, error: String(err) }));
    const minusButton28Result = await checkMinusButton28(newPage, timestamp).catch(err => ({ success: false, error: String(err) }));
    const spinRoundPlus4Result = await checkSpinRoundPlusButton(newPage, timestamp, 4).catch(err => ({ success: false, error: String(err) }));
    const spinRoundMinus5Result = await checkSpinRoundMinusButton(newPage, timestamp, 5).catch(err => ({ success: false, error: String(err) }));
    
    // 1儭3儭 暺? Play ????Balance
    const playButtonResult = await checkPlayButton(newPage, timestamp).catch(err => ({ success: false, error: String(err) }));
    if (playButtonResult.balanceBeforePlay) {
        spinMetrics.balanceBeforePlay = playButtonResult.balanceBeforePlay;
        console.log(`? 暺? Play ??憿? ${spinMetrics.balanceBeforePlay}`);
    }

    let giftTestResult;
    try {
      giftTestResult = await checkGiftTest(newPage, timestamp);
      // 閮??旨??
      if (giftTestResult.giftAmount) {
          spinMetrics.giftAmount = giftTestResult.giftAmount;
          console.log(`?? 閮??旨??: ${spinMetrics.giftAmount}`);
      }
    } catch (err) {
      giftTestResult = { success: false, error: String(err && err.message || err) };
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
      newPage: newPage,  // 餈? newPage 撠情
      spinMetrics: spinMetrics, // 餈?蝝舐????      newPageUrl: newPage.url(),
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
      chatInput: chatInputResult,
      message: gVersionResult.found ? 
               `???券皜祈岫摰?嚗????-> ???啗?蝒?-> gVersion: ${gVersionResult.version} -> 暺? MULAI BERMAIN` :
               `??  暺??∠????閬???嚗? gVersion 瑼Ｘ葫憭望?`,
      debug: { screenshotBeforeClick: shotBeforeClick, screenshotNewPage: shotNewPage, ...howToPlayResult.debug }
    };
    
  } catch (error) {
    return {
      clicked: false,
      error: String(error && error.message || error),
      message: `皜祈岫憭望?: ${error && error.message || error}`
    };
  }
}

async function checkHowToPlayDialog(page, timestamp) {
  try {
    // 蝑??蝛拙?嚗ara Bermain 閬????喳???    await page.waitForTimeout(2000);
    
    // 雿輻憭車?豢??典?閰衣?敺?modal ?箇嚗?憭?敺?15 蝘?    let modalElement = null;
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
          // 撽? modal 蝣箏祕?航?
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
    
    // 憒?????賢仃???岫??交
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
            // 餈??豢??典?蝚虫葡嚗??臬?蝝頨?            let selector = '';
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
      return { closed: false, message: 'Modal 撠店獢?曉', debug: { screenshot: shotBefore } };
    }
    
    // 蝣箔? modal 摰頛
    await page.waitForTimeout(1000);
    
    const shotBefore = path.join(debugDir, `test2-how-to-play-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    // ?芸?雿輻?????交??
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
    
    // 憒??湔?豢??冽銝嚗?閰血 modal ?扳??    if (!startButtonInfo && modalElement) {
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
    
    // 憒????豢??冽銝嚗?雿輻?嗡??孵??交
    if (!startButtonInfo || !startButtonInfo.found) {
      // ??modal 銝剜??MULAI BERMAIN ??
      startButtonInfo = await page.evaluate((modal) => {
        if (!modal) return { found: false, reason: 'Modal ???⊥?' };
        
        const buttons = modal.querySelectorAll('button, [role="button"], a, div[onclick], span[onclick]');
        const candidates = [];
        
        for (const btn of buttons) {
          if (btn.offsetParent === null) continue;
          const rect = btn.getBoundingClientRect();
          if (rect.width <= 80 || rect.width >= 500 || rect.height <= 25 || rect.height >= 120) continue;
          
          const text = (btn.textContent || '').trim();
          const upperText = text.toUpperCase();
          const normalized = upperText.replace(/\s+/g, ' ').trim();
          
          // ?寥? MULAI BERMAIN
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
          // 憒??曆??啣????嚗?閰行?憭抒???嚗?賣 MULAI BERMAIN嚗?          const allButtons = Array.from(buttons)
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
                text: text || '??',
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                score: rect.width * rect.height // ?蝛?摨?              };
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
          return { found: false, reason: 'MULAI BERMAIN ???芣??, debug: `?曉????摮? ${sampleTexts.join(', ') || '??}` };
        }
        
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0];
      }, modalElement).catch(() => ({ found: false, reason: '閰摯????隤? }));
    }
    
    if (!startButtonInfo || !startButtonInfo.found) {
      const reason = startButtonInfo?.reason || '?芰??';
      return { closed: false, message: `MULAI BERMAIN ???芣?? ${reason}`, debug: { screenshot: shotBefore } };
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
      return { closed: false, message: '?⊥?暺? MULAI BERMAIN ??', debug: { screenshot: shotBefore } };
    }
    await page.waitForTimeout(3000); // 憓?蝑???
    
    const shotAfter = path.join(debugDir, `test2-how-to-play-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    // 瑼Ｘ modal ?臬瘨仃
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
      return { closed: false, message: '暺? MULAI BERMAIN ??敺?Modal 敶??芷???, debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter } };
    }
    
    return { closed: true, message: '撌脫?????MULAI BERMAIN ??嚗odal 敶?撌脤???, debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter } };
    
  } catch (error) {
    return { closed: false, error: String(error && error.message || error), message: `Cara Bermain ??皜祈岫憭望?: ${error && error.message || error}` };
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
      return { success: false, message: 'MAX ???芣?? };
    }
    
    const amountBefore = await getDisplayedAmount(page);
    await page.mouse.move(maxButtonInfo.x, maxButtonInfo.y);
    await page.waitForTimeout(100);
    await page.mouse.click(maxButtonInfo.x, maxButtonInfo.y);
    await page.waitForTimeout(1500);
    const amountAfter = await getDisplayedAmount(page);
    
    const shot = path.join(debugDir, `test2-max-${testLabel}-${timestamp}.png`);
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    
    if (amountAfter === expectedAmount) {
      return {
        success: true,
        message: `??甇?Ⅱ霈? ${amountAfter.toLocaleString()}`,
        amountBefore,
        amountAfter,
        expectedAmount,
        debug: { screenshot: shot }
      };
    } else {
      return {
        success: false,
        message: `??銝泵??嚗??? ${expectedAmount.toLocaleString()}, 撖阡?: ${amountAfter.toLocaleString()}`,
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
      message: `MAX ??皜祈岫憭望?: ${error && error.message || error}`
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
      return { success: false, message: 'MIN ???芣?? };
    }
    
    const amountBefore = await getDisplayedAmount(page);
    await page.mouse.click(minButtonInfo.x, minButtonInfo.y);
    await page.waitForTimeout(800);
    const amountAfter = await getDisplayedAmount(page);
    
    const shot = path.join(debugDir, `test2-min-${timestamp}.png`);
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    
    if (amountAfter === expectedAmount) {
      return {
        success: true,
        message: `??甇?Ⅱ霈? ${amountAfter.toLocaleString()}`,
        amountBefore,
        amountAfter,
        expectedAmount,
        debug: { screenshot: shot }
      };
    } else {
      return {
        success: false,
        message: `??銝泵??嚗??? ${expectedAmount.toLocaleString()}, 撖阡?: ${amountAfter.toLocaleString()}`,
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
      message: `MIN ??皜祈岫憭望?: ${error && error.message || error}`
    };
  }
}

async function checkPlusButton28(page, timestamp) {
  try {
    await page.waitForTimeout(1000);
    const plusButtonInfo = await findBetButton(page, '+');
    
    if (!plusButtonInfo.found) {
      return { success: false, message: '+ ???芣?? };
    }
    
    const amountBefore = await getDisplayedAmount(page);
    let previousAmount = amountBefore;
    let increasingCount = 0;
    
    for (let i = 1; i <= 28; i++) {
      if (previousAmount >= 3000000) {
        break;
      }
      
      await page.mouse.click(plusButtonInfo.x, plusButtonInfo.y);
      await page.waitForTimeout(150);
      
      const currentAmount = await getDisplayedAmount(page);
      if (currentAmount > previousAmount) increasingCount++;
      previousAmount = currentAmount;
    }
    
    const amountAfter = await getDisplayedAmount(page);
    
    const shot = path.join(debugDir, `test2-plus-28-${timestamp}.png`);
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    
    if (increasingCount >= 26) {
      return {
        success: true,
        message: `??????嚗?{increasingCount}/28 甈∴?`,
        amountBefore,
        amountAfter,
        clickCount: 28,
        increasingCount,
        debug: { screenshot: shot }
      };
    } else {
      return {
        success: false,
        message: `??瘝?????嚗??${increasingCount}/28 甈⊿?憓,
        amountBefore,
        amountAfter,
        clickCount: 28,
        increasingCount,
        debug: { screenshot: shot }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: String(error && error.message || error),
      message: `+ ??皜祈岫憭望?: ${error && error.message || error}`
    };
  }
}

async function checkMinusButton28(page, timestamp) {
  try {
    await page.waitForTimeout(1000);
    const minusButtonInfo = await findBetButton(page, '-');
    
    if (!minusButtonInfo.found) {
      return { success: false, message: '- ???芣?? };
    }
    
    const amountBefore = await getDisplayedAmount(page);
    let previousAmount = amountBefore;
    let decreasingCount = 0;
    
    for (let i = 1; i <= 28; i++) {
      if (previousAmount <= 200) {
        break;
      }
      
      await page.mouse.click(minusButtonInfo.x, minusButtonInfo.y);
      await page.waitForTimeout(150);
      
      const currentAmount = await getDisplayedAmount(page);
      if (currentAmount < previousAmount) decreasingCount++;
      previousAmount = currentAmount;
    }
    
    const amountAfter = await getDisplayedAmount(page);
    
    const shot = path.join(debugDir, `test2-minus-28-${timestamp}.png`);
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    
    if (decreasingCount >= 26) {
      return {
        success: true,
        message: `??????嚗?{decreasingCount}/28 甈∴?`,
        amountBefore,
        amountAfter,
        clickCount: 28,
        decreasingCount,
        debug: { screenshot: shot }
      };
    } else {
      return {
        success: false,
        message: `??瘝?????嚗??${decreasingCount}/28 甈⊿?皜,
        amountBefore,
        amountAfter,
        clickCount: 28,
        decreasingCount,
        debug: { screenshot: shot }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: String(error && error.message || error),
      message: `- ??皜祈岫憭望?: ${error && error.message || error}`
    };
  }
}

async function findBetButton(page, buttonType) {
  return await page.evaluate((type) => {
    const allElements = Array.from(document.querySelectorAll('*'));
    let amountElement = null;
    let betAreaY = null;
    
    // ?暸?憿＊蝷?    for (const el of allElements) {
      const text = (el.textContent || '').trim();
      const cleanText = text.replace(/[,$?玲?包/g, '');
      if (/^\d+$/.test(cleanText) && el.offsetParent !== null) {
        const num = parseFloat(cleanText);
        if (num >= 0 && num <= 10000000) {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          const fontSize = parseFloat(styles.fontSize);
          
          if (rect.width > 30 && rect.height > 10 && fontSize >= 16) {
            amountElement = { el, rect, text };
            betAreaY = rect.top + rect.height / 2;
            break;
          }
        }
      }
    }
    
    // ??MAX ??MIN ??
    let maxButtonRect = null;
    let minButtonRect = null;
    
    for (const el of allElements) {
      const text = (el.textContent || '').trim().toUpperCase();
      if (text === 'MAX' && el.offsetParent !== null) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          maxButtonRect = rect;
          if (!betAreaY) betAreaY = rect.top + rect.height / 2;
        }
      }
      if (text === 'MIN' && el.offsetParent !== null) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          minButtonRect = rect;
          if (!betAreaY) betAreaY = rect.top + rect.height / 2;
        }
      }
    }
    
    const candidates = [];
    
    for (const el of allElements) {
      if (el.offsetParent === null) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      
      if (betAreaY && Math.abs(rect.top + rect.height / 2 - betAreaY) > 80) continue;
      if (rect.width < 20 || rect.width > 80 || rect.height < 20 || rect.height > 80) continue;
      
      const text = (el.textContent || '').trim();
      const html = el.outerHTML || '';
      const tagName = el.tagName.toLowerCase();
      
      let isInCorrectPosition = false;
      
      if (type === '+') {
        const isRightOfAmount = amountElement && rect.left > amountElement.rect.right - 10;
        const isLeftOfMax = maxButtonRect && rect.right < maxButtonRect.left + 10;
        isInCorrectPosition = isRightOfAmount && isLeftOfMax;
      } else {
        const isRightOfMin = minButtonRect && rect.left > minButtonRect.right - 10;
        const isLeftOfAmount = amountElement && rect.right < amountElement.rect.left + 10;
        isInCorrectPosition = isRightOfMin && isLeftOfAmount;
      }
      
      if (isInCorrectPosition) {
        if (el === amountElement?.el || text === 'MAX' || text === 'MIN') continue;
        
        let score = 0;
        if (tagName === 'button') score += 100;
        if (el.hasAttribute('role') && el.getAttribute('role') === 'button') score += 80;
        if (el.hasAttribute('onclick')) score += 50;
        
        const styles = window.getComputedStyle(el);
        if (styles.cursor === 'pointer') score += 30;
        
        if (text.length <= 3) score += 40;
        if (text.length === 0) score += 20;
        if (text.length > 5) score -= 20;
        
        if (html.includes('<svg') || el.closest('svg')) score += 30;
        
        const aspectRatio = rect.width / rect.height;
        if (aspectRatio >= 0.8 && aspectRatio <= 1.2) score += 25;
        
        const hasSymbol = type === '+' 
          ? (text.includes('+') || html.includes('plus') || html.includes('add'))
          : (text.includes('-') || text.includes('??) || html.includes('minus') || html.includes('subtract'));
        if (hasSymbol) score += 50;
        
        candidates.push({
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          score: score
        });
      }
    }
    
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return { found: true, x: candidates[0].x, y: candidates[0].y };
    }
    
    return { found: false };
  }, buttonType);
}

async function getDisplayedAmount(page) {
  return await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('*'));
    
    for (const el of allElements) {
      const text = (el.textContent || '').trim();
      const cleanText = text.replace(/[,$?玲?包/g, '');
      
      const match = cleanText.match(/^(\d[\d,]*\.?\d*)$/);
      if (match) {
        const numberValue = parseFloat(match[1].replace(/,/g, ''));
        if (numberValue >= 0 && numberValue <= 10000000) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 30 && rect.height > 10 && el.offsetParent !== null) {
            const styles = window.getComputedStyle(el);
            const fontSize = parseFloat(styles.fontSize);
            if (fontSize >= 14) {
              return numberValue;
            }
          }
        }
      }
    }
    
    return 0;
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
        return { found: false, reason: 'CONTROLS_PANEL ?芣?? };
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
        return { found: false, reason: 'Spin Round 摰孵?芣?? };
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
    
    return { found: false, reason: 'Spin Round ?詨潭?曉' };
  });
}

async function checkSpinRoundPlusButton(page, timestamp, times) {
  try {
    const initialValue = await getSpinRoundValue(page);
    if (!initialValue.found) {
      return { success: false, step: 'locate-initial', timestamp, error: initialValue.reason || '?⊥??曉 Spin Round ???? };
    }
    
    const values = [initialValue.value];
    let prevValue = initialValue.value;
    let increasingCount = 0;
    const plusButtonSelector = '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div._wrapper_1qt5t_234 > div > button:nth-child(3)';
    const plusSvgSelector = '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div._wrapper_1qt5t_234 > div > button:nth-child(3) > svg';
    
    for (let i = 0; i < times; i++) {
      const buttonExists = await page.$(plusButtonSelector);
      if (!buttonExists) {
        return { success: false, step: 'locate-plus-button', timestamp, error: `蝚?${i + 1} 甈⊿???嚗銝 Spin Round + ??` };
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
        return { success: false, step: 'read-after-click', timestamp, error: `蝚?${i + 1} 甈⊿???嚗瘜???Spin Round ?嬋 };
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
      message: success ? `Spin Round ????嚗?{increasingCount}/${times} 甈∴?` : `Spin Round 瘝?????嚗??${increasingCount}/${times} 甈⊿?憓,
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
      return { success: false, step: 'locate-initial', timestamp, error: initialValue.reason || '?⊥??曉 Spin Round ???? };
    }
    
    const values = [initialValue.value];
    let prevValue = initialValue.value;
    let decreasingCount = 0;
    const minusButtonSelector = '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div._wrapper_1qt5t_234 > div > button:nth-child(1)';
    const minusSvgSelector = '#CONTROLS_PANEL > div._controlBar_1qzyb_139.hstack > div._wrapper_1qt5t_234 > div > button:nth-child(1) > svg';
    
    for (let i = 0; i < times; i++) {
      const buttonExists = await page.$(minusButtonSelector);
      if (!buttonExists) {
        return { success: false, step: 'locate-minus-button', timestamp, error: `蝚?${i + 1} 甈⊿???嚗銝 Spin Round - ??` };
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
        return { success: false, step: 'read-after-click', timestamp, error: `蝚?${i + 1} 甈⊿???嚗瘜???Spin Round ?嬋 };
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
      message: success ? `Spin Round ????嚗?{decreasingCount}/${times} 甈∴?` : `Spin Round 瘝?????嚗??${decreasingCount}/${times} 甈⊿?皜,
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
        return { found: false, reason: 'PLAY ????曉' };
      }
      
      const button = img.closest('button');
      if (!button) {
        return { found: false, reason: 'PLAY ????蝝?曉' };
      }
      
      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || button.offsetParent === null) {
        return { found: false, reason: 'PLAY ???航????舫??? };
      }
      
      return {
        found: true,
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
      };
    });
    
    if (!buttonInfo?.found) {
      return { success: false, message: `PLAY ??曉: ${buttonInfo?.reason || '?芰??'}` };
    }
    
    // 閮?暺??? Balance
    const balanceBeforePlay = await getDisplayedAmount(page);

    const shotBefore = path.join(debugDir, `test2-play-button-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    await page.mouse.click(buttonInfo.x, buttonInfo.y);
    await page.waitForTimeout(1000);
    
    const shotAfter = path.join(debugDir, `test2-play-button-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    return {
      success: true,
      message: '撌脫???????PLAY ??,
      balanceBeforePlay: balanceBeforePlay, // ?暺???擗?
      debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error && error.message || error),
      message: `PLAY ?葫閰血仃?? ${error && error.message || error}`
    };
  }
}

async function checkGiftTest(page, timestamp) {
  try {
    await page.waitForTimeout(1000);
    
    const step1Info = await page.evaluate(() => {
      const selector1 = '#IM_PANEL > div._container_1hjxc_1 > button:nth-child(2)';
      const button1 = document.querySelector(selector1);
      
      if (!button1) {
        return { found: false, reason: '?旨???芣?? };
      }
      
      const rect = button1.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || button1.offsetParent === null) {
        return { found: false, reason: '?旨??銝閬?銝暺?' };
      }
      
      return {
        found: true,
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
      };
    });
    
    if (!step1Info?.found) {
      return { success: false, message: `?旨???芣?? ${step1Info?.reason || '?芰??'}` };
    }
    
    const shotBefore = path.join(debugDir, `test2-gift-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    await page.mouse.click(step1Info.x, step1Info.y);
    await page.waitForTimeout(2000);
    
    const step2Info = await page.evaluate(() => {
      const selector2 = '#IM_PANEL > div.gift-modal-enter-done > div._container_jwe83_1 > div:nth-child(5)';
      const giftItem = document.querySelector(selector2);
      if (!giftItem) return { found: false, reason: '蝳桃?賊??芣?? };
      const rect = giftItem.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || giftItem.offsetParent === null) {
        return { found: false, reason: '蝳桃?賊?銝閬?銝暺?' };
      }
      return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    
    if (!step2Info?.found) {
      return { success: false, message: `蝳桃?賊??芣?? ${step2Info?.reason || '?芰??'}`, debug: { screenshotBefore: shotBefore } };
    }
    
    await page.mouse.click(step2Info.x, step2Info.y);
    await page.waitForTimeout(2000);
    
    const step3Info = await page.evaluate(() => {
      const selector3 = '#IM_PANEL > div:nth-child(3) > div._container_jwe83_1 > div:nth-child(5) > button';
      const button3 = document.querySelector(selector3);
      if (!button3) return { found: false, reason: '蝣箄????芣?? };
      const rect = button3.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || button3.offsetParent === null) {
        return { found: false, reason: '蝣箄???銝閬?銝暺?' };
      }
      return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    
    if (!step3Info?.found) {
      return { success: false, message: `蝣箄????芣?? ${step3Info?.reason || '?芰??'}`, debug: { screenshotBefore: shotBefore } };
    }
    
    await page.mouse.click(step3Info.x, step3Info.y);
    await page.waitForTimeout(2000);
    
    const step4Info = await page.evaluate(() => {
      const selector4 = '#IM_PANEL > div:nth-child(3) > div._container_jwe83_1 > button';
      const closeButton = document.querySelector(selector4);
      if (!closeButton) return { found: false, reason: '?????芣?? };
      const rect = closeButton.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || closeButton.offsetParent === null) {
        return { found: false, reason: '????銝閬?銝暺?' };
      }
      return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    
    if (!step4Info?.found) {
      return { success: false, message: `?????芣?? ${step4Info?.reason || '?芰??'}`, debug: { screenshotBefore: shotBefore } };
    }
    
    await page.mouse.click(step4Info.x, step4Info.y);
    await page.waitForTimeout(1000);
    
    const shotAfter = path.join(debugDir, `test2-gift-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    // ?身?旨?? (憒??齒瘜??憟?
    const estimatedGiftAmount = 5000;

    return {
      success: true,
      message: '撌脫????旨皜祈岫嚗????郊撽?',
      giftAmount: estimatedGiftAmount, // ??旨??
      debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error && error.message || error),
      message: `?旨皜祈岫憭望?: ${error && error.message || error}`
    };
  }
}

async function checkChatInput(page, timestamp) {
  try {
    await page.waitForTimeout(1000);
    
    const textareaInfo = await page.evaluate(() => {
      const textarea = document.querySelector('#chat-message-input');
      
      if (!textarea) {
        return { found: false, reason: '?予頛詨甈??芣?? };
      }
      
      const rect = textarea.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || textarea.offsetParent === null) {
        return { found: false, reason: '?予頛詨甈?銝閬? };
      }
      
      return {
        found: true,
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
      };
    });
    
    if (!textareaInfo?.found) {
      return { success: false, message: `?予頛詨甈??芣?? ${textareaInfo?.reason || '?芰??'}` };
    }
    
    const shotBefore = path.join(debugDir, `test2-chat-input-before-${timestamp}.png`);
    await page.screenshot({ path: shotBefore, fullPage: false }).catch(() => {});
    
    await page.click('#chat-message-input');
    await page.fill('#chat-message-input', 'SNS-Test');
    await page.waitForTimeout(500);
    
    const sendButtonInfo = await page.evaluate(() => {
      const selector = '#IM_PANEL > div._container_1hjxc_1 > button:nth-child(3)';
      const button = document.querySelector(selector);
      if (!button) return { found: false, reason: 'Send ???芣?? };
      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || button.offsetParent === null) {
        return { found: false, reason: 'Send ??銝閬?銝暺?' };
      }
      return { found: true, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });
    
    if (!sendButtonInfo?.found) {
      return { success: false, message: `Send ???芣?? ${sendButtonInfo?.reason || '?芰??'}`, textEntered: true, debug: { screenshotBefore: shotBefore } };
    }
    
    await page.mouse.click(sendButtonInfo.x, sendButtonInfo.y);
    await page.waitForTimeout(1000);
    
    const shotAfter = path.join(debugDir, `test2-chat-input-after-${timestamp}.png`);
    await page.screenshot({ path: shotAfter, fullPage: false }).catch(() => {});
    
    
    return {
      success: true,
      message: '撌脫?????憭抵?蝒撓?交葫閰佗?頛詨??銝衣??',
      textEntered: 'SNS-Test',
      debug: { screenshotBefore: shotBefore, screenshotAfter: shotAfter }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error && error.message || error),
      message: `?予閬?頛詨皜祈岫憭望?: ${error && error.message || error}`
    };
  }
}

// ????Spin 20甈?Balance閮?皜祈岫
async function checkSpinBalance(page, timestamp, initialData) {
  console.log('?? ?? Spin 20甈?Balance閮?皜祈岫...');
  
  try {
    await page.waitForTimeout(2000);

    // 雿輻銋?閮????    const startBalance = initialData?.balanceBeforePlay;
    const giftAmount = initialData?.giftAmount || 0;
    
    // 憒?瘝?閮???startBalance嚗?閰阡??唳???(fallback)
    let effectiveStartBalance = startBalance;
    if (typeof effectiveStartBalance !== 'number') {
        console.log('?? ?芣?啁洵 13 暺??? Start Balance嚗?閰阡??唳???..');
        effectiveStartBalance = await getDisplayedAmount(page);
    }

    console.log(`? 閮?韏琿? Balance (Play??: ${effectiveStartBalance?.toLocaleString()}`);
    console.log(`?? 撌脩?旨??: ${giftAmount}`);

    // 1. ?岫?脣??嗅? Bet ??
    const betAmount = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      for (const el of allElements) {
        const text = (el.textContent || '').trim().toLowerCase();
        if ((text === 'bet' || text === 'total bet' || text === '?釣' || text === '?餅?瘜?) && el.offsetParent !== null) {
          const parent = el.parentElement;
          if (parent) {
            const parentText = parent.textContent.replace(text, '').trim();
            const match = parentText.match(/[\d,]+\.?\d*/);
            if (match) return parseFloat(match[0].replace(/,/g, ''));
            
            const siblings = Array.from(parent.children);
            for (const sib of siblings) {
              if (sib === el) continue;
              const sibText = sib.textContent.trim();
              const sibMatch = sibText.match(/^[\d,]+\.?\d*$/);
              if (sibMatch) return parseFloat(sibMatch[0].replace(/,/g, ''));
            }
          }
        }
        if (el.tagName === 'INPUT' && (el.id.includes('bet') || el.name.includes('bet'))) {
            return parseFloat(el.value);
        }
      }
      return 200; 
    });

    console.log(`? ?嗅? Bet ?? (?摯): ${betAmount}`);

    let currentBalance = await getDisplayedAmount(page);
    
    // ??霈
    let totalWin = 0;
    let totalGift = 0;
    const history = [];
    
    // 3. ?? 20 甈∟???    for (let i = 1; i <= 20; i++) {
      // 蝑? Balance ?寡?
      let newBalance = currentBalance;
      let checkTime = 0;
      const timeout = 10000; // 10蝘?      
      while (checkTime < timeout) {
        const nowBalance = await getDisplayedAmount(page);
        if (nowBalance !== currentBalance) {
            newBalance = nowBalance;
            break;
        }
        await page.waitForTimeout(100);
        checkTime += 100;
      }
      
      if (newBalance === currentBalance) {
         console.log(`?? 蝚?${i} 甈∠?敺???Balance ?芾??);
         break;
      }

      // 4. ??霈?
      const delta = newBalance - currentBalance;
      const impliedGain = delta + betAmount;
      
      let note = '';
      if (Math.abs(impliedGain) < 0.01) {
          note = '頛?(Loss)';
      } else if (impliedGain > 0) {
          // 蝪∪閮?韐?
          note = `?? 韐?蝳? ${impliedGain}`;
          totalWin += impliedGain; // ?ㄐ?⊥??????蝳桃嚗絞銝蝞??      } else {
          note = `???啣虜皜? (Delta: ${delta})`;
      }

      console.log(`  Spin ${i}: ${currentBalance} -> ${newBalance} (${delta >= 0 ? '+' : ''}${delta}) | ${note}`);
      
      history.push({
          spin: i,
          old: currentBalance,
          new: newBalance,
          delta: delta,
          bet: betAmount,
          impliedGain: impliedGain,
          note: note
      });

      currentBalance = newBalance;
      await page.waitForTimeout(500);
    }

    const finalBalance = currentBalance;
    
    // ?蝯?蝞?敺?Play ???啁?函?蝮質???+ ?旨??
    const totalChangeFromStart = finalBalance - effectiveStartBalance;
    
    // 憿舐內?摩嚗?    // Balance 霈? + ?旨?? = 撖阡??瘛冽???(Net P&L from Spins)
    // ? Final = Start - Gift - Bets + Wins
    // ?隞?Final - Start = -Gift - Bets + Wins
    // (Final - Start) + Gift = -Bets + Wins (蝝?Spin ????
    
    const adjustedChange = totalChangeFromStart + giftAmount;

    console.log(`? ?蝯?Balance: ${finalBalance.toLocaleString()}`);
    console.log(`?? 蝮質???(Final - Start): ${totalChangeFromStart.toLocaleString()}`);
    console.log(`?? ???旨 (${giftAmount}): ${adjustedChange.toLocaleString()}`);

    return {
      success: history.length > 0, 
      initialBalance: effectiveStartBalance,
      finalBalance,
      totalWin, // ?蝚?6暺???Win
      totalGift: giftAmount, // ?蝚?4暺???Gift
      actualChange: totalChangeFromStart, // 蝮質???      adjustedChange: adjustedChange, // 隤踵敺???(???旨)
      betAmount,
      spinCount: history.length,
      message: `??摰? | Play?? ${effectiveStartBalance.toLocaleString()} ???蝯? ${finalBalance.toLocaleString()} | 蝮質??? ${totalChangeFromStart.toLocaleString()} | ???旨: ${adjustedChange.toLocaleString()}`,
      details: history
    };

  } catch (error) {
    console.error('Spin Balance閮?皜祈岫?航炊:', error);
    return {
      success: false,
      error: String(error && error.message || error),
      message: `Spin Balance閮?皜祈岫憭望?: ${error && error.message || error}`
    };
  }
}

module.exports = { checkWebsite };
