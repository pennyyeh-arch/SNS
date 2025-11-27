const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let newLines = [];
let inCandidateSelection = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 檢測候選元素選擇邏輯（第 1308 行附近）
  if (line.includes('if (candidates.length > 0)') && i > 1305 && i < 1335) {
    inCandidateSelection = true;
    newLines.push(line); // 保留 if 行
    
    // 插入改進的選擇邏輯
    newLines.push('        const best = candidates[0];');
    newLines.push('        ');
    newLines.push('        // 嘗試找到真正的可點擊元素（鏈接或按鈕）');
    newLines.push('        let clickableElement = best.element;');
    newLines.push('        let clickableHref = null;');
    newLines.push('        let clickableTarget = null;');
    newLines.push('        ');
    newLines.push('        // 如果最佳元素不是鏈接，嘗試在父元素或子元素中找鏈接');
    newLines.push('        if (best.element.tagName !== \'A\') {');
    newLines.push('          // 檢查父元素');
    newLines.push('          let parent = best.element.parentElement;');
    newLines.push('          let depth = 0;');
    newLines.push('          while (parent && depth < 3) {');
    newLines.push('            if (parent.tagName === \'A\' && parent.href) {');
    newLines.push('              clickableElement = parent;');
    newLines.push('              clickableHref = parent.href;');
    newLines.push('              clickableTarget = parent.getAttribute(\'target\');');
    newLines.push('              break;');
    newLines.push('            }');
    newLines.push('            parent = parent.parentElement;');
    newLines.push('            depth++;');
    newLines.push('          }');
    newLines.push('          ');
    newLines.push('          // 如果父元素沒找到，檢查子元素');
    newLines.push('          if (clickableElement === best.element) {');
    newLines.push('            const linkChild = best.element.querySelector(\'a[href]\');');
    newLines.push('            if (linkChild && linkChild.href) {');
    newLines.push('              clickableElement = linkChild;');
    newLines.push('              clickableHref = linkChild.href;');
    newLines.push('              clickableTarget = linkChild.getAttribute(\'target\');');
    newLines.push('            }');
    newLines.push('          }');
    newLines.push('        } else {');
    newLines.push('          clickableHref = best.element.href;');
    newLines.push('          clickableTarget = best.element.getAttribute(\'target\');');
    newLines.push('        }');
    newLines.push('        ');
    newLines.push('        // 構建選擇器');
    newLines.push('        let selector = null;');
    newLines.push('        if (clickableElement.id) {');
    newLines.push('          selector = `#${clickableElement.id}`;');
    newLines.push('        } else if (clickableElement.className) {');
    newLines.push('          const classes = clickableElement.className.toString().split(\' \').filter(c => c && c.trim()).join(\'.\');');
    newLines.push('          if (classes) {');
    newLines.push('            selector = `${clickableElement.tagName.toLowerCase()}.${classes}`;');
    newLines.push('          }');
    newLines.push('        }');
    newLines.push('        ');
    newLines.push('        // 如果沒有選擇器，使用最佳元素的位置信息');
    newLines.push('        const finalRect = clickableElement === best.element ? best.rect : clickableElement.getBoundingClientRect();');
    newLines.push('        ');
    newLines.push('        return {');
    newLines.push('          found: true,');
    newLines.push('          selector: selector,');
    newLines.push('          tagName: clickableElement.tagName,');
    newLines.push('          className: clickableElement.className || \'\',');
    newLines.push('          id: clickableElement.id || \'\',');
    newLines.push('          href: clickableHref || \'\',');
    newLines.push('          target: clickableTarget || \'\',');
    newLines.push('          rect: {');
    newLines.push('            x: finalRect.x,');
    newLines.push('            y: finalRect.y,');
    newLines.push('            width: finalRect.width,');
    newLines.push('            height: finalRect.height');
    newLines.push('          },');
    newLines.push('          candidatesCount: candidates.length,');
    newLines.push('          originalElement: {');
    newLines.push('            tagName: best.tagName,');
    newLines.push('            className: best.className,');
    newLines.push('            textContent: best.element.textContent ? best.element.textContent.substring(0, 50) : \'\'');
    newLines.push('          }');
    newLines.push('        };');
    
    // 跳過舊的選擇邏輯
    while (i < lines.length && i < 1308 + 25) {
      if (lines[i].includes('return {') && lines[i + 1] && lines[i + 1].includes('found: true')) {
        // 跳過到 return 結束
        while (i < lines.length && i < 1328 + 5) {
          if (lines[i].includes('};') && lines[i - 1] && lines[i - 1].includes('candidatesCount')) {
            i++;
            break;
          }
          i++;
        }
        break;
      }
      i++;
    }
    inCandidateSelection = false;
    continue;
  }
  
  // 檢測定位器建立邏輯（第 1355 行附近）
  if (line.includes('建立定位器') || (line.includes('建') && line.includes('定位') && i > 1354 && i < 1368)) {
    newLines.push('    // 建立定位器');
    newLines.push('    let targetElement = null;');
    newLines.push('    ');
    newLines.push('    // 如果元素有 href，優先使用 href 導航');
    if (line.includes('href')) {
      // 已經有 href 檢查
    } else {
      newLines.push('    if (uiElement.href) {');
      newLines.push('      console.log(`找到鏈接元素，href: ${uiElement.href}, target: ${uiElement.target}`);');
      newLines.push('    }');
      newLines.push('    ');
    }
    
    // 跳過舊的定位器建立邏輯，保留選擇器部分
    let j = i;
    while (j < lines.length && j < i + 15) {
      if (lines[j].includes('if (uiElement.selector)')) {
        newLines.push(lines[j]);
        j++;
        while (j < lines.length && j < i + 20) {
          if (lines[j].includes('}') && lines[j - 1] && lines[j - 1].trim() === '}') {
            newLines.push(lines[j]);
            
            // 添加 href 查找邏輯
            newLines.push('    ');
            newLines.push('    // 如果沒有選擇器，嘗試使用 href 查找鏈接');
            newLines.push('    if (!targetElement && uiElement.href) {');
            newLines.push('      try {');
            newLines.push('        targetElement = page.locator(`a[href="${uiElement.href}"]`).first();');
            newLines.push('        const isVisible = await targetElement.isVisible().catch(() => false);');
            newLines.push('        if (!isVisible) {');
            newLines.push('          targetElement = null;');
            newLines.push('        }');
            newLines.push('      } catch (e) {');
            newLines.push('        console.log(\'無法使用 href 建立定位器:\', e.message);');
            newLines.push('      }');
            newLines.push('    }');
            
            i = j;
            break;
          }
          newLines.push(lines[j]);
          j++;
        }
        break;
      }
      j++;
    }
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ UI 元素選擇邏輯已改進');





