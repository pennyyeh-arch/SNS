const { exec } = require('child_process');

function run(cmd) {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${cmd}`);
        exec(cmd, (error, stdout, stderr) => {
            console.log(`--- Output of ${cmd} ---`);
            console.log(stdout);
            if (stderr) console.log(`--- Stderr ---`);
            if (stderr) console.log(stderr);
            if (error) {
                console.log(`--- Error ---`);
                console.log(error.message);
            }
            console.log(`------------------------`);
            resolve();
        });
    });
}

async function main() {
    await run('git --version');
    await run('git status');
    await run('git add .');
    await run('git commit -m "feat: update test tool 2 point 16 logic and other fixes"');
    await run('git push');
}

main();


