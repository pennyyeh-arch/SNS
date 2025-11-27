const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
let content = fs.readFileSync(filePath, 'utf8');

// 改進點擊方式：
// 1. 如果元素有 href，嘗試直接導航
// 2. 使用 JavaScript 觸發點擊事件
// 3. 嘗試點擊父元素或子元素中的鏈接
// 4. 使用多種點擊方式組合

// 在點擊邏輯中添加更多方法
const oldClickMethod = `    // ?? 1: 使用??????    if (targetElement) {
      try {
        console.log('?試?? 1: 使用??????UI 介面...');
        const pagePromise = context.waitForEvent('page', { timeout: 8000 });
        
        await targetElement.click({ timeout: 5000, force: false });
        debugInfo.clickAttempts.push({ method: 'selector-click', timestamp: new Date().toISOString() });
        
        try {
          newPage = await pagePromise;
          clickMethod = 'selector-click';
          console.log('???? 1 ??: 檢測?新?面');
        } catch (e) {
          console.log('?? 1 ???檢測到????等? 3 秒?檢查...');
          await page.waitForTimeout(3000);
          const currentPages = context.pages();
          if (currentPages.length > originalPages) {
            newPage = currentPages[currentPages.length - 1];
            clickMethod = 'selector-click-delayed';
            console.log('???? 1 延遲檢測: ?現????);
          }
        }
      } catch (error) {
        console.log('???? 1 失?:', error.message);
        debugInfo.clickAttempts.push({ method: 'selector-click', error: error.message });
      }
    }`;

// 改進點擊邏輯，添加更多方法
const improvedClickLogic = `
    // 方法 1: 檢查元素是否有 href，如果有則直接導航
    if (targetElement && uiElement.href) {
      try {
        console.log('嘗試方法 1a: 元素有 href，直接導航...');
        const href = uiElement.href;
        if (href.startsWith('http') || href.startsWith('//')) {
          newPage = await context.newPage();
          await newPage.goto(href, { waitUntil: 'domcontentloaded', timeout: 10000 });
          clickMethod = 'href-navigation';
          console.log('✅ 方法 1a 成功: 直接導航到新頁面');
        }
      } catch (error) {
        console.log('方法 1a 失敗:', error.message);
        debugInfo.clickAttempts.push({ method: 'href-navigation', error: error.message });
      }
    }
    
    // 方法 1b: 使用選擇器點擊
    if (!newPage && targetElement) {
      try {
        console.log('嘗試方法 1b: 使用選擇器點擊 UI 介面...');
        
        // 先嘗試 JavaScript 點擊
        const clicked = await page.evaluate((selector) => {
          try {
            const el = document.querySelector(selector);
            if (el) {
              // 創建並觸發點擊事件
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0
              });
              el.dispatchEvent(clickEvent);
              
              // 如果是鏈接，嘗試點擊
              if (el.tagName === 'A' && el.href) {
                return true;
              }
              
              // 觸發所有可能的點擊事件
              ['mousedown', 'mouseup', 'click'].forEach(eventType => {
                const event = new MouseEvent(eventType, {
                  bubbles: true,
                  cancelable: true,
                  view: window
                });
                el.dispatchEvent(event);
              });
              
              return true;
            }
            return false;
          } catch (e) {
            return false;
          }
        }, uiElement.selector).catch(() => false);
        
        if (clicked) {
          await page.waitForTimeout(500);
          const currentPages = context.pages();
          if (currentPages.length > originalPages) {
            newPage = currentPages[currentPages.length - 1];
            clickMethod = 'js-click';
            console.log('✅ 方法 1b 成功: JavaScript 點擊觸發新頁面');
          }
        }
        
        // 如果 JavaScript 點擊沒有效果，嘗試 Playwright 點擊
        if (!newPage) {
          const pagePromise = context.waitForEvent('page', { timeout: 5000 });
          await targetElement.click({ timeout: 5000, force: false });
          debugInfo.clickAttempts.push({ method: 'selector-click', timestamp: new Date().toISOString() });
          
          try {
            newPage = await pagePromise;
            clickMethod = 'selector-click';
            console.log('✅ 方法 1b 成功: Playwright 點擊檢測到新頁面');
          } catch (e) {
            await page.waitForTimeout(500);
            const currentPages = context.pages();
            if (currentPages.length > originalPages) {
              newPage = currentPages[currentPages.length - 1];
              clickMethod = 'selector-click-delayed';
              console.log('✅ 方法 1b 延遲檢測: 發現新頁面');
            }
          }
        }
      } catch (error) {
        console.log('方法 1b 失敗:', error.message);
        debugInfo.clickAttempts.push({ method: 'selector-click', error: error.message });
      }
    }`;

// 使用行號替換
const lines = content.split('\n');
let newLines = [];
let skipOldMethod1 = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測方法 1 開始
  if (line.includes('方法 1: 使用選擇器') || 
      (line.includes('使用') && line.includes('選擇器') && i > 1340 && i < 1370)) {
    skipOldMethod1 = true;
    // 插入新的邏輯
    newLines.push(...improvedClickLogic.split('\n'));
    // 跳過舊的方法 1 代碼
    while (i < lines.length && i < 1343 + 30) {
      if (lines[i].includes('} catch (error)') && lines[i - 1] && lines[i - 1].trim() === '}') {
        i++;
        skipOldMethod1 = false;
        break;
      }
      i++;
    }
    continue;
  }
  
  if (!skipOldMethod1) {
    newLines.push(line);
  }
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ 點擊方法已改進');





