const express = require('express');
const path = require('path');
const fs = require('fs');
const { checkWebsite } = require('./routes/check');
const { checkWebsite: checkWebsite2 } = require('./routes/check2');

const app = express();
const PORT = process.env.PORT || 3000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a log file with timestamp
const logFile = path.join(logsDir, `server-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Override console.log to also write to file
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  originalLog(...args);
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`, 'utf8');
};

console.error = (...args) => {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  originalError(...args);
  fs.appendFileSync(logFile, `[${timestamp}] ERROR: ${message}\n`, 'utf8');
};

console.log(`📝 日誌文件已創建: ${logFile}`);

app.use(express.json());
app.use(express.static('public'));

// API endpoint for checking website (Test Tool 1)
app.post('/api/check', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const results = await checkWebsite(url);
    res.json(results);
  } catch (error) {
    console.error('Error checking website:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for checking website (Test Tool 2)
app.post('/api/check2', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const results = await checkWebsite2(url);
    res.json(results);
  } catch (error) {
    console.error('Error checking website (test2):', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 檢查工具伺服器運行在 http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 測試工具 1 (7項測試): http://localhost:' + PORT + '/');
  console.log('🎮 測試工具 2 (10項測試): http://localhost:' + PORT + '/test2.html');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📝 所有日誌將保存到: ${logFile}\n`);
});

