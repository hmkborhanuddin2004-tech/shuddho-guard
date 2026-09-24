# Dispatch Assignment — Worker M3 (Windows Host & SafeSearch Blocker)

**Target**: Milestone 3 (Windows Host & SafeSearch Blocker Hardening)
**Input Files**:
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/PROJECT.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/survey_explorer_3/handoff.md

**Exclusive File Ownership**:
- `windows-client/` (all files)

**Tasks**:
1. Read `c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md` and `PROJECT.md`.
2. Inspect `windows-client/install-windows-service.bat`, `windows-client/start-guard.bat`, `windows-client/run-silent.vbs`, and `windows-client/shuddho-pc-guard.js`.
3. Add robust administrative elevation detection to `install-windows-service.bat` and `start-guard.bat`:
   - Check elevation using `net session >nul 2>&1`.
   - If not elevated, auto-prompt/relaunch with elevated privileges via PowerShell (`powershell -Command "Start-Process '%~f0' -Verb RunAs"`).
4. Update `install-windows-service.bat` to register an elevated Windows Scheduled Task:
   - `schtasks /create /tn "ShuddhoPCGuard" /tr "wscript.exe \"%~dp0run-silent.vbs\"" /sc onlogon /rl HIGHEST /f`
   - This ensures persistent elevated execution across reboots without dropping admin rights.
5. Verify `run-silent.vbs` executes `shuddho-pc-guard.js` windowless.
6. Verify `shuddho-pc-guard.js` modifies hosts, enforces SafeSearch VIP redirects (`216.239.38.120`, `204.79.197.220`), and flushes DNS cache (`ipconfig /flushdns`).
7. Run Node.js syntax and integrity check: `node -c windows-client/shuddho-pc-guard.js`.
8. Document all changes and verification in `handoff.md` and report back.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-23T16:50:38Z
You are worker_m3, a teamwork_preview_worker for Shuddho Guard.
Your working directory is: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/worker_m3
Project root: c:/Users/assdi/Documents/Downloads/shuddho-guard
Authoritative User Request: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md
Master Project Specification: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/PROJECT.md
Your assignment is in: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/worker_m3/DISPATCH.md

Exclusive Write Ownership:
- `windows-client/` (all files)
DO NOT touch any files outside this directory.

Tasks:
1. Read ORIGINAL_REQUEST.md and PROJECT.md.
2. Read survey findings in c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/survey_explorer_3/handoff.md.
3. Inspect `windows-client/install-windows-service.bat`, `windows-client/start-guard.bat`, `windows-client/run-silent.vbs`, and `windows-client/shuddho-pc-guard.js`.
4. Add robust administrative elevation detection to `install-windows-service.bat` and `start-guard.bat`:
   - Check elevation using `net session >nul 2>&1`.
   - If not elevated, auto-prompt/relaunch with elevated privileges via PowerShell (`powershell -Command "Start-Process '%~f0' -Verb RunAs"`).
5. Update `install-windows-service.bat` to register an elevated Windows Scheduled Task:
   - `schtasks /create /tn "ShuddhoPCGuard" /tr "wscript.exe \"%~dp0run-silent.vbs\"" /sc onlogon /rl HIGHEST /f`
   - This ensures persistent elevated execution across reboots without dropping admin rights.
6. Verify `run-silent.vbs` executes `shuddho-pc-guard.js` windowless.
7. Verify `shuddho-pc-guard.js` modifies hosts, enforces SafeSearch VIP redirects (`216.239.38.120`, `204.79.197.220`), and flushes DNS cache (`ipconfig /flushdns`).
8. Run Node.js syntax and integrity check: `node -c windows-client/shuddho-pc-guard.js`.
9. Write `handoff.md` in your working directory documenting changes and verification.
10. Send a message to your parent orchestrator when complete.
