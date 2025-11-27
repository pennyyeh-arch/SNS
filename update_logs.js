const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'check.js');
let content = fs.readFileSync(filePath, 'utf8');

// 使用字串替換而不是正則表達式
content = content.replace('開始檢查 game02 視窗', '開始檢查 Streaming Now 下方的直播視窗');
content = content.replace('game02 視窗檢查結果', 'Streaming Now 直播視窗檢查結果');
content = content.replace('game02 視窗檢查失敗', 'Streaming Now 直播視窗檢查失敗');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 日誌訊息已更新');





