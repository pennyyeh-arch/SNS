@echo off
echo === Git Version === > git_log.txt
git --version >> git_log.txt 2>&1
echo. >> git_log.txt

echo === Git Status (Before) === >> git_log.txt
git status >> git_log.txt 2>&1
echo. >> git_log.txt

echo === Git Add === >> git_log.txt
git add . >> git_log.txt 2>&1
echo. >> git_log.txt

echo === Git Commit === >> git_log.txt
git commit -m "feat: update test tool 2 point 16 logic and other fixes" >> git_log.txt 2>&1
echo. >> git_log.txt

echo === Git Push === >> git_log.txt
git push >> git_log.txt 2>&1
echo. >> git_log.txt


