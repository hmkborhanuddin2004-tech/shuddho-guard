# Handoff Report — Survey Explorer 3: R3 & R4 Technical Architecture

**Agent**: `survey_explorer_3` (Explorer / Teamwork Preview Explorer)  
**Parent Orchestrator ID**: `8e00b7af-80d1-4af5-b5ab-2e3318bc770c`  
**Working Directory**: `c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/survey_explorer_3`  
**Target Requirements**: R3 (Windows PC Background Host & SafeSearch Enforcer) and R4 (Cloud Blacklist Sync Server & Testing Suite)  
**Date**: 2026-09-23  

---

## 1. Observation

### 1.1 Windows Client (`windows-client/`)
1. **Directory Contents**:
   - `windows-client/shuddho-pc-guard.js` (79 lines, 3613 bytes)
   - `windows-client/install-windows-service.bat` (29 lines, 1685 bytes)
   - `windows-client/run-silent.vbs` (6 lines, 409 bytes)
   - `windows-client/start-guard.bat` (15 lines, 605 bytes)

2. **Hosts File Modification & SafeSearch Logic** (`windows-client/shuddho-pc-guard.js`):
   - Line 10: `const HOSTS_FILE = 'C:\\Windows\\System32\\drivers\\etc\\hosts';`
   - Lines 12–20: `BLOCKED_DOMAINS` contains: `"pornhub.com"`, `"www.pornhub.com"`, `"xvideos.com"`, `"www.xvideos.com"`, `"xnxx.com"`, `"www.xnxx.com"`, `"xhamster.com"`, `"www.xhamster.com"`, `"chotikahini.com"`, `"banglachoti.com"`, `"deshiboudi.com"`, `"bdchoti.net"`.
   - Lines 22–29: `SAFESEARCH_REDIRECTS` maps:
     - `"216.239.38.120 www.google.com"`
     - `"216.239.38.120 google.com"`
     - `"216.239.38.120 www.google.com.bd"`
     - `"204.79.197.220 www.bing.com"`
     - `"204.79.197.220 bing.com"`
   - Lines 35 & 67: Clears attributes before writing (`attrib -r -s -h`) and locks with `attrib +r +s` afterwards.
   - Lines 60–62: Calls `execSync('ipconfig /flushdns');` after write.
   - Line 76: Periodically audits every 5 minutes: `setInterval(enforceHostsSecurity, 5 * 60 * 1000);`.
   - Lines 69–71: Catches error:
     ```javascript
     } catch (err) {
         console.warn('⚠️ হোস্ট ফাইল পরিবর্তনে অ্যাডমিন পারমিশন প্রয়োজন হতে পারে: ', err.message);
     }
     ```

3. **Admin Elevation Detection Gap** (`windows-client/install-windows-service.bat`):
   - Lines 1–29 contain NO elevation check (`net session`, `fsutil`, or `powershell Start-Process ... -Verb RunAs`).
   - Lines 11–17 write shortcut `ShuddhoGuardStartup.vbs` to `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`.

4. **Silent Execution Logic** (`windows-client/run-silent.vbs`):
   - Line 4: `WshShell.Run "node """ & strCurDir & "\shuddho-pc-guard.js""", 0, False`. Window style `0` hides console window.

---

### 1.2 Backend Server (`backend/`)
1. **Directory Contents**:
   - `backend/server.js` (94 lines, 3871 bytes)
   - `backend/test-backend.js` (54 lines, 2391 bytes)
   - `backend/package.json` (14 lines, 396 bytes)
   - `backend/Dockerfile` (10 lines, 136 bytes)

2. **Endpoints in `backend/server.js`**:
   - Line 31: `app.get('/health', (req, res) => { res.status(200).json({ status: "OK", service: "Shuddho Guard Cloud Engine", uptime: process.uptime() }); });`
   - Line 36: `app.get('/api/v1/blacklist', ...)` returns `data: dynamicBlacklist` with `version: "2026.09.23"`, `domains`, `telegramChannels`, `banglishKeywords`.
   - Line 45: `app.post('/api/v1/report', ...)` validates `if (!url) return res.status(400)...` and appends to in-memory `reportedTraps`.
   - Line 69: `app.post('/api/v1/subscription/verify', ...)` validates `if (!phoneNumber || !trxId) return res.status(400)...` and returns 30-day active mock subscription.
   - Line 91: Starts listener on `PORT = process.env.PORT || 4000;`. Does not export `app`.

3. **Backend Test Suite Execution** (`backend/test-backend.js`):
   - Tool Command: `node backend/test-backend.js`
   - Output:
     ```
     🚀 শুদ্ধ গার্ড ক্লাউড সার্ভার পোর্ট 4000-এ সফলভাবে চালু হয়েছে।
     === শুদ্ধ গার্ড ব্যাকএন্ড টেস্ট শুরু হচ্ছে ===
     1. /health টেস্ট: PASS ✅
     2. /api/v1/blacklist টেস্ট: PASS ✅
     [REPORT RECEIVED] নতুন রিপোর্ট এসেছে: https://t.me/bad_trap_link
     3. /api/v1/report টেস্ট: PASS ✅
     [SUBSCRIPTION ACTIVATED] মোবাইল: 01711000000 | Trx: 9J8K7L6M
     4. /api/v1/subscription/verify টেস্ট: PASS ✅
     🎯 সব ব্যাকএন্ড টেস্ট সফলভাবে সম্পন্ন হয়েছে!
     ```
   - Exit code: `0`.

4. **Endpoint Route Aliasing Gap**:
   - In `backend/server.js`: Only `/api/v1/blacklist`, `/api/v1/report`, `/api/v1/subscription/verify` exist.
   - In `ORIGINAL_REQUEST.md` (lines 22, 29) & `DISPATCH.md` (line 10): Routes are referenced as `/health`, `/blacklist`, `/report`, `/subscription/verify`. Direct requests to `/blacklist`, `/report`, `/subscription/verify` return 404.

---

## 2. Logic Chain

1. **Elevation Defect on Windows Startup**:
   - *Observation 1.1.2 & 1.1.3*: Modifying `C:\Windows\System32\drivers\etc\hosts` requires Administrator privilege (`EPERM` thrown otherwise). `install-windows-service.bat` creates a startup shortcut in `%APPDATA%\...\Startup`.
   - Under Windows UAC architecture, shortcuts in the user Startup folder run with filtered non-elevated tokens on user logon.
   - When `shuddho-pc-guard.js` is triggered silently on reboot, write access to `hosts` fails silently because window style `0` hides console errors.
   - **Inference**: Protection fails silently after reboot unless an elevated scheduler or service mechanism (e.g. `schtasks /rl HIGHEST`) is employed.

2. **Silent Runner Efficacy**:
   - *Observation 1.1.4*: `WScript.Shell.Run` with argument `0` and `bWaitOnReturn = False` successfully suppresses the CMD/PowerShell window completely.
   - **Inference**: Silent execution is fully functional via VBScript, but requires elevated launch privileges to successfully operate on the hosts file.

3. **Backend Route Aliasing Discrepancy**:
   - *Observation 1.2.2 & 1.2.4*: Routes are declared under prefix `/api/v1/*`, while requirements state `/health`, `/blacklist`, `/report`, `/subscription/verify`.
   - **Inference**: Aliasing both `/api/v1/*` and root `/*` guarantees that both external specifications and existing client tests succeed without breakage.

4. **Integration Disconnect between Windows Client and Cloud Backend**:
   - *Observation 1.1.2 & 1.2.2*: `shuddho-pc-guard.js` has a static `BLOCKED_DOMAINS` array and makes no network requests to `/api/v1/blacklist`.
   - **Inference**: Cloud dynamic updates are currently ignored by the Windows client. Adding an HTTP sync routine will complete the R3-R4 feedback loop.

---

## 3. Caveats

1. **Non-Windows Environments**: Testing was performed on the local Windows environment. The hosts file modification is Windows-specific (`C:\Windows\System32\drivers\etc\hosts`); if tested in Linux/macOS environments, the path would be `/etc/hosts`.
2. **Third-Party Antivirus / Windows Defender**: Certain third-party antivirus suites (e.g. Kaspersky, Bitdefender) or Windows Defender "Tamper Protection" may trigger a notification when any process modifies the `hosts` file, regardless of elevation.
3. **Database Layer**: The backend currently relies on in-memory arrays. While passing all automated acceptance tests, persistence across container restarts requires a file-backed JSON store or external database.

---

## 4. Conclusion

1. **Requirement R3 Status**:
   - Core hosts modification and Google/Bing SafeSearch enforcement (`216.239.38.120`, `204.79.197.220`) are implemented correctly.
   - Silent execution capability via `run-silent.vbs` works as designed.
   - **Defect Identified**: `install-windows-service.bat` lacks administrative elevation detection, and relying only on `%APPDATA%\Startup` drops privileges on reboot. 
   - **Fix Required**: Add `net session` auto-elevation in `install-windows-service.bat` and register a Scheduled Task via `schtasks /create /tn "ShuddhoPCGuard" /tr "wscript.exe \"%SCRIPT_DIR%run-silent.vbs\"" /sc onlogon /rl highest /f`.

2. **Requirement R4 Status**:
   - All 4 backend endpoints (`/health`, `/api/v1/blacklist`, `/api/v1/report`, `/api/v1/subscription/verify`) exist and pass all 4 tests in `test-backend.js` with exit code `0`.
   - **Gaps Identified**: Root route aliases (`/blacklist`, `/report`, `/subscription/verify`) should be mounted alongside `/api/v1/*`; `"test": "node test-backend.js"` should be added to `package.json`.

---

## 5. Verification Method

1. **Backend Test Suite**:
   Execute the backend automated test suite:
   ```cmd
   node backend/test-backend.js
   ```
   *Expected Result*: All 4 tests PASS ✅ with exit code 0.

2. **Windows Client Syntax & Elevation Test**:
   Execute Node syntax check on the guard script:
   ```cmd
   node -c windows-client/shuddho-pc-guard.js
   ```
   *Expected Result*: Exits cleanly without syntax errors.

3. **Elevation Check Verification**:
   Inspect `windows-client/install-windows-service.bat` to confirm presence of `net session` elevation check and `schtasks /rl highest` registration.

4. **Invalidation Conditions**:
   - If `node backend/test-backend.js` exits with non-zero code.
   - If `shuddho-pc-guard.js` fails to redirect Google domains to `216.239.38.120`.
