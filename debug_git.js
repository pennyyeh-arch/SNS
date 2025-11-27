const { spawn } = require('child_process');

function runGit(args) {
    return new Promise((resolve) => {
        console.log(`\n>>> Running: git ${args.join(' ')}`);
        const git = spawn('git', args, { shell: true });

        git.stdout.on('data', (data) => {
            console.log(`STDOUT: ${data.toString().trim()}`);
        });

        git.stderr.on('data', (data) => {
            console.log(`STDERR: ${data.toString().trim()}`);
        });

        git.on('close', (code) => {
            console.log(`Exited with code ${code}`);
            resolve();
        });
        
        git.on('error', (err) => {
            console.log(`ERROR: ${err.message}`);
            resolve();
        });
    });
}

async function main() {
    await runGit(['status']);
    await runGit(['add', '.']);
    await runGit(['commit', '-m', '"feat: manual update check"']);
    await runGit(['push']);
}

main();


