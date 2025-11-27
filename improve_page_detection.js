const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
let content = fs.readFileSync(filePath, 'utf8');

// 改進新頁面檢測：點擊後立即檢查，不等待事件
// 替換方法 1 和方法 2 的檢測邏輯

// 方法 1：改進選擇器點擊後的檢測
const oldMethod1 = `        const pagePromise = context.waitForEvent('page', { timeout: 8000 });
        
        await targetElement.click({ timeout: 5000, force: false });
        debugInfo.clickAttempts.push({ method: 'selector-click', timestamp: new Date().toISOString() });
        
        try {
          newPage = await pagePromise;
          clickMethod = 'selector-click';
          console.log('✅ 方法 1 成功: 檢測到新頁面');
        } catch (e) {
          console.log('方法 1 未立即檢測到新頁面，等待 3 秒後檢查...');
          await page.waitForTimeout(3000);
          const currentPages = context.pages();
          if (currentPages.length > originalPages) {
            newPage = currentPages[currentPages.length - 1];
            clickMethod = 'selector-click-delayed';
            console.log('✅ 方法 1 延遲檢測: 發現新頁面');
          }
        }`;

const newMethod1 = `        // 點擊元素
        await targetElement.click({ timeout: 5000, force: false });
        debugInfo.clickAttempts.push({ method: 'selector-click', timestamp: new Date().toISOString() });
        
        // 立即檢查頁面列表（不等待事件）
        await page.waitForTimeout(300); // 短暫等待讓頁面有時間打開
        let currentPages = context.pages();
        if (currentPages.length > originalPages) {
          newPage = currentPages[currentPages.length - 1];
          clickMethod = 'selector-click';
          console.log('✅ 方法 1 成功: 立即檢測到新頁面');
        } else {
          // 如果沒有立即檢測到，等待事件或再次檢查
          try {
            const pagePromise = context.waitForEvent('page', { timeout: 5000 });
            newPage = await pagePromise;
            clickMethod = 'selector-click';
            console.log('✅ 方法 1 成功: 通過事件檢測到新頁面');
          } catch (e) {
            console.log('方法 1 等待事件超時，再次檢查頁面列表...');
            await page.waitForTimeout(2000);
            currentPages = context.pages();
            if (currentPages.length > originalPages) {
              newPage = currentPages[currentPages.length - 1];
              clickMethod = 'selector-click-delayed';
              console.log('✅ 方法 1 延遲檢測: 發現新頁面');
            }
          }
        }`;

// 方法 2：改進座標點擊後的檢測
const oldMethod2 = `        const pagePromise = context.waitForEvent('page', { timeout: 8000 });
        
        await page.mouse.move(centerX, centerY, { steps: 10 });
        await page.waitForTimeout(200);
        await page.mouse.click(centerX, centerY, { delay: 50 });
        
        debugInfo.clickAttempts.push({ 
          method: 'coordinate-click', 
          x: centerX, 
          y: centerY,
          timestamp: new Date().toISOString() 
        });
        
        try {
          newPage = await pagePromise;
          clickMethod = 'coordinate-click';
          console.log('✅ 方法 2 成功: 檢測到新頁面');
        } catch (e) {
          console.log('方法 2 未立即檢測到新頁面，等待 3 秒後檢查...');
          await page.waitForTimeout(3000);
          const currentPages = context.pages();
          if (currentPages.length > originalPages) {
            newPage = currentPages[currentPages.length - 1];
            clickMethod = 'coordinate-click-delayed';
            console.log('✅ 方法 2 延遲檢測: 發現新頁面');
          }
        }`;

const newMethod2 = `        await page.mouse.move(centerX, centerY, { steps: 10 });
        await page.waitForTimeout(200);
        await page.mouse.click(centerX, centerY, { delay: 50 });
        
        debugInfo.clickAttempts.push({ 
          method: 'coordinate-click', 
          x: centerX, 
          y: centerY,
          timestamp: new Date().toISOString() 
        });
        
        // 立即檢查頁面列表
        await page.waitForTimeout(300); // 短暫等待
        let currentPages = context.pages();
        if (currentPages.length > originalPages) {
          newPage = currentPages[currentPages.length - 1];
          clickMethod = 'coordinate-click';
          console.log('✅ 方法 2 成功: 立即檢測到新頁面');
        } else {
          // 如果沒有立即檢測到，等待事件或再次檢查
          try {
            const pagePromise = context.waitForEvent('page', { timeout: 5000 });
            newPage = await pagePromise;
            clickMethod = 'coordinate-click';
            console.log('✅ 方法 2 成功: 通過事件檢測到新頁面');
          } catch (e) {
            console.log('方法 2 等待事件超時，再次檢查頁面列表...');
            await page.waitForTimeout(2000);
            currentPages = context.pages();
            if (currentPages.length > originalPages) {
              newPage = currentPages[currentPages.length - 1];
              clickMethod = 'coordinate-click-delayed';
              console.log('✅ 方法 2 延遲檢測: 發現新頁面');
            }
          }
        }`;

// 使用行號定位替換（更可靠）
const lines = content.split('\n');
let newLines = [];
let inMethod1 = false;
let inMethod2 = false;
let method1Start = -1;
let method2Start = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測方法 1 開始
  if (line.includes('const pagePromise = context.waitForEvent') && 
      i > 1340 && i < 1370 &&
      lines[i - 1] && lines[i - 1].includes('使用選擇器')) {
    method1Start = i;
    inMethod1 = true;
    // 跳過舊代碼，插入新代碼
    newLines.push('        // 點擊元素');
    newLines.push('        await targetElement.click({ timeout: 5000, force: false });');
    newLines.push('        debugInfo.clickAttempts.push({ method: \'selector-click\', timestamp: new Date().toISOString() });');
    newLines.push('        ');
    newLines.push('        // 立即檢查頁面列表（不等待事件）');
    newLines.push('        await page.waitForTimeout(300); // 短暫等待讓頁面有時間打開');
    newLines.push('        let currentPages = context.pages();');
    newLines.push('        if (currentPages.length > originalPages) {');
    newLines.push('          newPage = currentPages[currentPages.length - 1];');
    newLines.push('          clickMethod = \'selector-click\';');
    newLines.push('          console.log(\'✅ 方法 1 成功: 立即檢測到新頁面\');');
    newLines.push('        } else {');
    newLines.push('          // 如果沒有立即檢測到，等待事件或再次檢查');
    newLines.push('          try {');
    newLines.push('            const pagePromise = context.waitForEvent(\'page\', { timeout: 5000 });');
    newLines.push('            newPage = await pagePromise;');
    newLines.push('            clickMethod = \'selector-click\';');
    newLines.push('            console.log(\'✅ 方法 1 成功: 通過事件檢測到新頁面\');');
    newLines.push('          } catch (e) {');
    newLines.push('            console.log(\'方法 1 等待事件超時，再次檢查頁面列表...\');');
    newLines.push('            await page.waitForTimeout(2000);');
    newLines.push('            currentPages = context.pages();');
    newLines.push('            if (currentPages.length > originalPages) {');
    newLines.push('              newPage = currentPages[currentPages.length - 1];');
    newLines.push('              clickMethod = \'selector-click-delayed\';');
    newLines.push('              console.log(\'✅ 方法 1 延遲檢測: 發現新頁面\');');
    newLines.push('            }');
    newLines.push('          }');
    newLines.push('        }');
    // 跳過舊的方法 1 代碼塊
    let braceCount = 0;
    let j = i;
    while (j < lines.length && j < i + 30) {
      if (lines[j].includes('} catch (error)') && lines[j - 1] && lines[j - 1].trim() === '}') {
        i = j;
        break;
      }
      j++;
    }
    continue;
  }
  
  // 檢測方法 2 開始
  if (line.includes('const pagePromise = context.waitForEvent') && 
      i > 1370 && i < 1410 &&
      lines[i - 1] && lines[i - 1].includes('使用座標')) {
    method2Start = i;
    inMethod2 = true;
    // 跳過舊代碼，插入新代碼
    newLines.push('        await page.mouse.move(centerX, centerY, { steps: 10 });');
    newLines.push('        await page.waitForTimeout(200);');
    newLines.push('        await page.mouse.click(centerX, centerY, { delay: 50 });');
    newLines.push('        ');
    newLines.push('        debugInfo.clickAttempts.push({ ');
    newLines.push('          method: \'coordinate-click\', ');
    newLines.push('          x: centerX, ');
    newLines.push('          y: centerY,');
    newLines.push('          timestamp: new Date().toISOString() ');
    newLines.push('        });');
    newLines.push('        ');
    newLines.push('        // 立即檢查頁面列表');
    newLines.push('        await page.waitForTimeout(300); // 短暫等待');
    newLines.push('        let currentPages = context.pages();');
    newLines.push('        if (currentPages.length > originalPages) {');
    newLines.push('          newPage = currentPages[currentPages.length - 1];');
    newLines.push('          clickMethod = \'coordinate-click\';');
    newLines.push('          console.log(\'✅ 方法 2 成功: 立即檢測到新頁面\');');
    newLines.push('        } else {');
    newLines.push('          // 如果沒有立即檢測到，等待事件或再次檢查');
    newLines.push('          try {');
    newLines.push('            const pagePromise = context.waitForEvent(\'page\', { timeout: 5000 });');
    newLines.push('            newPage = await pagePromise;');
    newLines.push('            clickMethod = \'coordinate-click\';');
    newLines.push('            console.log(\'✅ 方法 2 成功: 通過事件檢測到新頁面\');');
    newLines.push('          } catch (e) {');
    newLines.push('            console.log(\'方法 2 等待事件超時，再次檢查頁面列表...\');');
    newLines.push('            await page.waitForTimeout(2000);');
    newLines.push('            currentPages = context.pages();');
    newLines.push('            if (currentPages.length > originalPages) {');
    newLines.push('              newPage = currentPages[currentPages.length - 1];');
    newLines.push('              clickMethod = \'coordinate-click-delayed\';');
    newLines.push('              console.log(\'✅ 方法 2 延遲檢測: 發現新頁面\');');
    newLines.push('            }');
    newLines.push('          }');
    newLines.push('        }');
    // 跳過舊的方法 2 代碼塊
    let j = i;
    while (j < lines.length && j < i + 30) {
      if (lines[j].includes('} catch (error)') && lines[j - 1] && lines[j - 1].trim() === '}') {
        i = j;
        break;
      }
      j++;
    }
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ 新頁面檢測邏輯已改進');





