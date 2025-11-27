const { execSync } = require('child_process');

try {
    console.log("--- Git Status ---");
    console.log(execSync('git status').toString());
    
    console.log("--- Git Add ---");
    console.log(execSync('git add .').toString());
    
    console.log("--- Git Commit ---");
    try {
        console.log(execSync('git commit -m "feat: sync code"').toString());
    } catch (e) {
        console.log("Commit failed (maybe nothing to commit): " + e.message);
        // 繼續執行 push，也許之前已經 commit 過了
    }
    
    console.log("--- Git Push ---");
    console.log(execSync('git push').toString());
    
} catch (error) {
    console.error("Error executing git command:");
    console.error(error.stdout ? error.stdout.toString() : "");
    console.error(error.stderr ? error.stderr.toString() : "");
    console.error(error.message);
}


