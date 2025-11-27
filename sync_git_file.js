const { execSync } = require('child_process');
const fs = require('fs');
const logFile = 'git_result.log';

function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
}

try {
    fs.writeFileSync(logFile, 'Starting Git Sync...\n');
    
    log("--- Git Status ---");
    log(execSync('git status').toString());
    
    log("--- Git Add ---");
    // git add 通常沒有輸出，除非有錯誤
    try {
        execSync('git add .');
        log("Git add completed.");
    } catch (e) {
        log("Git add failed: " + e.message);
    }
    
    log("--- Git Commit ---");
    try {
        const out = execSync('git commit -m "feat: update code"').toString();
        log(out);
    } catch (e) {
        log("Commit output (error/status): " + (e.stdout ? e.stdout.toString() : ''));
        log("Commit error message: " + e.message);
    }
    
    log("--- Git Push ---");
    try {
        const pushOut = execSync('git push').toString();
        log(pushOut);
    } catch (e) {
        log("Push failed.");
        log("Stdout: " + (e.stdout ? e.stdout.toString() : ''));
        log("Stderr: " + (e.stderr ? e.stderr.toString() : ''));
        log("Error: " + e.message);
    }
    
} catch (error) {
    log("Fatal Error: " + error.message);
}


