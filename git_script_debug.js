const { exec } = require('child_process');
const fs = require('fs');

const logFile = 'git_debug.log';
fs.writeFileSync(logFile, 'Starting...\n');

function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
}

function run(cmd) {
    return new Promise((resolve, reject) => {
        log(`Running: ${cmd}`);
        exec(cmd, (error, stdout, stderr) => {
            log(`--- Output of ${cmd} ---`);
            log(stdout);
            if (stderr) log(`--- Stderr ---`);
            if (stderr) log(stderr);
            if (error) {
                log(`--- Error ---`);
                log(error.message);
            }
            log(`------------------------`);
            resolve();
        });
    });
}

async function main() {
    try {
        await run('git --version');
        await run('git status');
        await run('git add .');
        await run('git commit -m "feat: update test tool 2 point 16 logic and other fixes"');
        await run('git push');
    } catch (e) {
        log(`Main Error: ${e.message}`);
    }
}

main();


