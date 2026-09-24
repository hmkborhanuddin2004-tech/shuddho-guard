# Technical Architecture & Investigation Report: R3 & R4
**Component Targets**: 
- **Requirement R3**: Windows PC Background Host & SafeSearch Enforcer
- **Requirement R4**: Cloud Blacklist Sync Server & Testing Suite
**Investigator**: `survey_explorer_3` (Teamwork Explorer / Shuddho Guard)
**Workspace**: `c:/Users/assdi/Documents/Downloads/shuddho-guard`
**Date**: 2026-09-23

---

## 1. Executive Summary

This investigation analyzes the technical implementations, design constraints, and gaps for:
1. **R3 (Windows PC Background Host & SafeSearch Enforcer)**: Responsible for locking the Windows `hosts` file, enforcing Google and Bing SafeSearch VIP redirects, blocking adult/Bangladeshi choti domains, and maintaining permanent background protection with auto-start and zero visible console windows.
2. **R4 (Cloud Blacklist Sync Server & Testing Suite)**: An Express-based microservice that synchronizes dynamic blacklists, ingests crowdsourced honey-trap reports, simulates bKash/Nagad subscription verification, and runs automated verification tests.

Both components were analyzed directly from source code in `windows-client/` and `backend/`, and tested against automated requirements. Key vulnerabilities (e.g. missing admin elevation checks in Windows installer scripts, UAC startup privilege drops, and route aliasing mismatches between `/api/v1/*` and root routes `/*`) were identified along with concrete architectural solutions.

---

## 2. Requirement R3: Windows PC Background Host & SafeSearch Enforcer

### 2.1 File Map & Current Architecture

| File Path | Lines | Type | Primary Role |
| :--- | :---: | :---: | :--- |
| `windows-client/shuddho-pc-guard.js` | 79 | Node.js | Core engine: Modifies `hosts`, enforces SafeSearch, blocks domains, flushes DNS, and audits every 5 minutes. |
| `windows-client/install-windows-service.bat` | 29 | Batch Script | Installer: Creates startup shortcut VBS in Windows Startup folder and triggers silent launch. |
| `windows-client/run-silent.vbs` | 6 | VBScript | Silent launcher: Calls `WshShell.Run` with window mode `0` (hidden) to run `shuddho-pc-guard.js`. |
| `windows-client/start-guard.bat` | 15 | Batch Script | Interactive launcher: Runs `node shuddho-pc-guard.js` with visible console for manual testing. |

---

### 2.2 Admin Elevation Detection & Privilege Escalation Analysis

#### 2.2.1 The Elevation Problem in Windows
The Windows hosts file is located at `%SystemRoot%\System32\drivers\etc\hosts` (`C:\Windows\System32\drivers\etc\hosts`).
In all modern Windows operating systems (Windows 7 through Windows 11), write access to this file requires **elevated Administrator privileges (High Integrity Level)**. Furthermore, `shuddho-pc-guard.js` executes:
```javascript
// Line 35 & 67 of shuddho-pc-guard.js
execSync(`attrib -r -s -h "${HOSTS_FILE}"`);
...
execSync(`attrib +r +s "${HOSTS_FILE}"`);
```
Both `attrib` manipulation on system files and `fs.writeFileSync(HOSTS_FILE, ...)` will fail with `EPERM` (Error: EPERM: operation not permitted) if the process is run without Administrator elevation.

#### 2.2.2 Vulnerability in Current `install-windows-service.bat`
Inspecting `windows-client/install-windows-service.bat`:
- **Line 1 to 29**: There is **no elevation test** (e.g., `net session`, `openfiles`, or `fsutil`).
- If an end-user double-clicks `install-windows-service.bat` normally, Windows runs it in a medium integrity token (standard user).
- Line 24 executes: `wscript.exe "%SCRIPT_DIR%run-silent.vbs"`.
- `run-silent.vbs` spawns `node shuddho-pc-guard.js` with window mode `0` (hidden).
- In `shuddho-pc-guard.js` (lines 69–71):
  ```javascript
  } catch (err) {
      console.warn('⚠️ হোস্ট ফাইল পরিবর্তনে অ্যাডমিন পারমিশন প্রয়োজন হতে পারে: ', err.message);
  }
  ```
- Because the script is running hidden, the warning output is discarded, and the user falsely believes protection is active while the hosts file remains completely unchanged!

#### 2.2.3 The UAC Startup Privilege Drop
`install-windows-service.bat` installs the startup script into:
`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ShuddhoGuardStartup.vbs`
- Under Windows UAC architecture, all shortcuts in the user's `Startup` folder execute under a **filtered standard token** on logon, even if the user is an Administrator!
- Consequently, upon computer reboot, `ShuddhoGuardStartup.vbs` starts `shuddho-pc-guard.js` without elevation, silently failing on every subsequent boot.

#### 2.2.4 Recommended Remediation Architecture
1. **Self-Elevating Batch Installer**:
   `install-windows-service.bat` must test for admin privilege and trigger UAC auto-elevation using PowerShell:
   ```cmd
   @echo off
   chcp 65001 > nul
   :: Test for Administrator Elevation
   net session >nul 2>&1
   if %errorlevel% neq 0 (
       echo [ELEVATION REQUIRED] Requesting Administrator Privileges...
       powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
       exit /b
   )
   ```
2. **Elevated Startup via Windows Task Scheduler (`schtasks.exe`)**:
   Instead of the standard `%APPDATA%\Startup` folder, register a Windows Scheduled Task with highest privileges (`/rl HIGHEST`):
   ```cmd
   schtasks /create /tn "ShuddhoPCGuard" /tr "wscript.exe \"%SCRIPT_DIR%run-silent.vbs\"" /sc onlogon /rl highest /f
   ```
   - **Advantage 1**: Runs with full elevated privileges on user login.
   - **Advantage 2**: Zero UAC prompt on daily reboots.
   - **Advantage 3**: Completely silent execution via `run-silent.vbs` (Window style 0).

3. **Node.js Administrative Check**:
   In `shuddho-pc-guard.js`, verify elevation programmatically at startup:
   ```javascript
   function isAdmin() {
       try {
           execSync('net session', { stdio: 'ignore' });
           return true;
       } catch {
           return false;
       }
   }
   ```

---

### 2.3 Hosts File Modification & SafeSearch Logic Analysis

#### 2.3.1 Path Resolution
- Currently `HOSTS_FILE = 'C:\\Windows\\System32\\drivers\\etc\\hosts'` (Line 10).
- Windows can be installed on drives other than `C:` (e.g. `D:\Windows` or customized environments).
- Best practice: Resolve via system environment variables:
  ```javascript
  const systemRoot = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
  const HOSTS_FILE = path.join(systemRoot, 'System32', 'drivers', 'etc', 'hosts');
  ```

#### 2.3.2 SafeSearch VIP Routing Analysis
`shuddho-pc-guard.js` defines SafeSearch entries (lines 22–29):
```javascript
const SAFESEARCH_REDIRECTS = [
    "216.239.38.120 www.google.com",
    "216.239.38.120 google.com",
    "216.239.38.120 www.google.com.bd",
    "204.79.197.220 www.bing.com",
    "204.79.197.220 bing.com"
];
```
- **Google SafeSearch**:
  - `forcesafesearch.google.com` resolves to IPv4 `216.239.38.120` and IPv6 `2001:4860:4806::78`.
  - When mapped in `hosts`, browsers cannot turn off Google SafeSearch, filtering all explicit search results even in Incognito/Private tabs.
  - Adding regional domains (e.g. `google.com.bd`, `google.com`) is optimal for Bangladesh.
- **Bing SafeSearch**:
  - `strict.bing.com` resolves to `204.79.197.220`.
  - Mapped for `www.bing.com` and `bing.com`.
- **Additional Enhancements (Recommended)**:
  - **YouTube Restricted Mode**: Redirect `www.youtube.com`, `m.youtube.com`, `youtubei.googleapis.com` to `216.239.38.119` (`restrict.youtube.com`) or `216.239.38.120` (`restrictmoderate.youtube.com`).
  - **DuckDuckGo**: Map `duckduckgo.com` to `safe.duckduckgo.com` (`52.142.124.215`).

#### 2.3.3 Adult Domain Blocking Logic & Cloud Sync
Currently:
```javascript
const BLOCKED_DOMAINS = [
    "pornhub.com", "www.pornhub.com",
    "xvideos.com", "www.xvideos.com",
    "xnxx.com", "www.xnxx.com",
    "xhamster.com", "www.xhamster.com",
    "chotikahini.com", "banglachoti.com",
    "deshiboudi.com", "bdchoti.net"
];
```
- Standard blocking format: `0.0.0.0 <domain>` is optimal because `0.0.0.0` immediately rejects TCP SYN packets without port timeout delays (unlike `127.0.0.1` which may hit local web servers).
- **Current Limitation**: Blocked domains are hardcoded. There is **no synchronization** with the R4 Cloud Backend (`/api/v1/blacklist` or `/blacklist`).
- **Recommended Integration**: `shuddho-pc-guard.js` should fetch dynamic domains from `http://localhost:4000/api/v1/blacklist` (or the production Render URL `https://shuddho-guard-backend.onrender.com/api/v1/blacklist`), merge with local defaults, and apply atomically.

#### 2.3.4 Atomic Section Tagging
Currently, `shuddho-pc-guard.js` checks `if (!content.includes(entry))` and appends entries. If domains are removed or modified, old entries remain forever.
**Proposed Architecture**: Use clear section delimiters:
```
# === SHUDDHO GUARD START ===
# Managed by Shuddho PC Guard. SafeSearch & Protection Rules.
216.239.38.120 www.google.com
216.239.38.120 google.com
216.239.38.120 www.google.com.bd
204.79.197.220 www.bing.com
204.79.197.220 bing.com
0.0.0.0 pornhub.com
...
# === SHUDDHO GUARD END ===
```
This enables idempotent, clean updates without corrupting existing user `hosts` entries.

#### 2.3.5 Anti-Tamper & DNS Flushing
- The script executes `attrib -r -s -h` before editing, writes the file, invokes `ipconfig /flushdns`, and locks the file with `attrib +r +s`.
- The 5-minute polling interval (`setInterval(enforceHostsSecurity, 5 * 60 * 1000)`) guarantees that if an unprivileged or privileged attacker attempts to wipe the hosts file, Shuddho Guard re-applies protection within 5 minutes.

---

### 2.4 Silent Execution Analysis

- **`run-silent.vbs` Mechanics**:
  ```vbscript
  Set WshShell = CreateObject("WScript.Shell")
  strCurDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
  WshShell.Run "node """ & strCurDir & "\shuddho-pc-guard.js""", 0, False
  Set WshShell = Nothing
  ```
  - `0`: `intWindowStyle = 0` completely hides the command prompt window.
  - `False`: `bWaitOnReturn = False` allows the VBScript script to exit immediately while the Node.js process runs indefinitely in the background.
- **Verification of Stealth**:
  - Task Manager shows `node.exe` under "Background processes", with zero desktop GUI or console window.
  - System tray / taskbar remains 100% clean.

---

## 3. Requirement R4: Cloud Blacklist Sync Server & Testing Suite

### 3.1 Architecture Overview

```
                      [ Express 4.19 Cloud Backend ]
                       (PORT = 4000 or process.env.PORT)
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
    [ GET /health ]     [ GET (/api/v1)?/blacklist ]     [ POST (/api/v1)?/report ]
    • UptimeRobot Ping  • Dynamic Domains                • Crowdsourced link ingestion
    • Status: "OK"      • Telegram Channels              • Memory Store (reportedTraps)
    • Process Uptime    • Banglish Slang Keywords        • Verification Flag
                                     │
                                     ▼
                    [ POST (/api/v1)?/subscription/verify ]
                    • bKash / Nagad Trx Simulator
                    • Phone + TrxID Validation
                    • 30-Day Auto-Expiry
```

- **File**: `backend/server.js` (94 lines)
- **Container**: `backend/Dockerfile` (Node 18 alpine, exposes port 4000)
- **Dependencies**: `express` (^4.19.2), `cors` (^2.8.5)

---

### 3.2 Endpoints Detailed Analysis

#### 1. `GET /health`
- **Route**: `/health`
- **Response Format**:
  ```json
  {
    "status": "OK",
    "service": "Shuddho Guard Cloud Engine",
    "uptime": 12.34
  }
  ```
- **Status Code**: `200 OK`
- **Role**: Health probe for Render.com zero-downtime deployments and UptimeRobot heartbeat.

#### 2. `GET /api/v1/blacklist` vs `GET /blacklist`
- **Current Route in Code**: Line 36 defines only `app.get('/api/v1/blacklist', ...)`.
- **Requirement Conflict**:
  - `ORIGINAL_REQUEST.md` line 29: *"Backend server `/health`, `/blacklist`, `/report`, and `/subscription/verify` pass in `backend/test-backend.js`"*.
  - `DISPATCH.md` line 10: *"Express backend server with endpoints: /health, /blacklist, /report, and /subscription/verify."*
  - Currently, querying `GET /blacklist` directly results in an Express `404 Cannot GET /blacklist`.
- **Response Payload**:
  ```json
  {
    "success": true,
    "data": {
      "version": "2026.09.23",
      "domains": [
        "chotikahini.com", "banglachoti.com", "deshiboudi.com",
        "bdchoti.net", "viralvideo24.net", "leakbangla.com"
      ],
      "telegramChannels": [
        "choti_boudi_leak_18", "deshi_mms_zone", "viral_video_bd",
        "gopon_link_adda", "adult_bangla_group"
      ],
      "banglishKeywords": [
        "choti", "boudi", "gopon video", "meye link", "deshi viral",
        "bap beti", "hot boudi", "chuda", "choda", "magi", "khanki"
      ]
    },
    "timestamp": "2026-09-23T16:44:00.000Z"
  }
  ```
- **Design Recommendation**: Alias routes so both `/blacklist` and `/api/v1/blacklist` route to the same handler.

#### 3. `POST /api/v1/report` vs `POST /report`
- **Current Route in Code**: Line 45 defines `app.post('/api/v1/report', ...)`.
- **Request Body**:
  ```json
  {
    "url": "https://t.me/bad_trap_link",
    "title": "ভুয়া জাকির নায়েক ফাঁদ",
    "reportedBy": "user@example.com"
  }
  ```
- **Validation**: Checks `if (!url) return res.status(400).json({ success: false, message: "URL প্রদান করা আবশ্যক" });`
- **Response**:
  ```json
  {
    "success": true,
    "message": "ধন্যবাদ! আপনার রিপোর্টটি গৃহীত হয়েছে এবং পর্যালোচনার পর ব্ল্যাকলিস্টে যুক্ত করা হবে।"
  }
  ```
- **Edge Cases & Gaps**:
  - Does not reject non-URL strings (e.g. whitespace or malformed links).
  - Aliasing required for `/report`.

#### 4. `POST /api/v1/subscription/verify` vs `POST /subscription/verify`
- **Current Route in Code**: Line 69 defines `app.post('/api/v1/subscription/verify', ...)`.
- **Request Body**:
  ```json
  {
    "phoneNumber": "01711000000",
    "trxId": "9J8K7L6M",
    "amount": 100
  }
  ```
- **Validation**: Checks `if (!phoneNumber || !trxId) return res.status(400).json({ success: false, message: "ফোন নম্বর ও ট্রানজেকশন আইডি দিন" });`
- **Logic**: Generates expiration timestamp 30 days into the future (`expiresAt.setDate(expiresAt.getDate() + 30)`).
- **Response**:
  ```json
  {
    "success": true,
    "status": "ACTIVE",
    "plan": "PRO_MONTHLY",
    "expiresAt": "2026-10-23T16:44:00.000Z",
    "message": "অভিনন্দন! আপনার শুদ্ধ গার্ড প্রো সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে।"
  }
  ```

---

### 3.3 Persistence & Data Store Analysis

- **Current State**: Volatile in-memory store:
  - `let dynamicBlacklist = { ... }`
  - `let reportedTraps = []`
- **Implications**:
  - When hosted on Render.com free tier, services spin down after 15 minutes of inactivity or during redeployments.
  - All user-submitted trap reports are lost.
- **Recommended Evolution**:
  1. **Phase 1 (Development / Current)**: Provide JSON file fallback (`backend/data/reports.json`) so reports survive process restarts.
  2. **Phase 2 (Cloud Production)**: Connect to a managed cloud datastore (e.g. MongoDB Atlas or PostgreSQL via Render).

---

### 3.4 Backend Testing Suite Analysis (`backend/test-backend.js`)

#### 3.4.1 Execution & Verification
Executing `node backend/test-backend.js` produced:
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
Exit code: `0`.

#### 3.4.2 Gaps Identified in Test Suite
1. **Route Coverage**:
   - `test-backend.js` only requests `/api/v1/blacklist`, `/api/v1/report`, and `/api/v1/subscription/verify`.
   - It does not verify root aliases (`/blacklist`, `/report`, `/subscription/verify`).
2. **Negative / Error Handling Tests**:
   - Does not verify 400 Bad Request responses when required fields (`url`, `phoneNumber`, `trxId`) are missing.
3. **Server Export & Lifecycle**:
   - `server.js` starts the listener on require (`app.listen(...)`) without exporting `app` or `server`.
   - `test-backend.js` invokes `process.exit(0)` after 1 second delay instead of cleanly closing the server handle.
4. **`package.json`**:
   - Lacks `"scripts": { "test": "node test-backend.js" }`. Running `npm test` fails.

---

## 4. Cross-Component Compatibility & Integration Matrix

| Integration Point | Source Component | Target Component | Protocol | Current Status | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Dynamic Domain Sync | `windows-client/shuddho-pc-guard.js` | `backend/server.js` | HTTP GET `/api/v1/blacklist` | Disconnected (Static array only) | Add HTTP fetch with fallback to built-in list |
| Honey-Trap Reporting | `web-extension` (interceptor) | `backend/server.js` | HTTP POST `/api/v1/report` | Disconnected | Add one-click "Report to Cloud" modal button |
| Route Compatibility | External Clients / Tests | `backend/server.js` | REST | Only `/api/v1/*` active | Mount routes at both `/` and `/api/v1/` |
| Startup Elevation | Windows Logon | `windows-client/shuddho-pc-guard.js` | Task Scheduler / VBS | Startup folder (Non-elevated) | Upgrade installer to `schtasks /rl HIGHEST` |

---

## 5. Architectural Recommendation & Implementation Blueprint

### 5.1 Windows Client Improvements
1. **Update `install-windows-service.bat`**:
   - Add admin elevation test (`net session >nul 2>&1`) with automatic PowerShell UAC prompt.
   - Register a Windows Scheduled Task (`schtasks /create /tn "ShuddhoPCGuard" /tr "wscript.exe \"%SCRIPT_DIR%run-silent.vbs\"" /sc onlogon /rl highest /f`).
2. **Update `shuddho-pc-guard.js`**:
   - Use dynamic `%SystemRoot%` path.
   - Implement structured `# === SHUDDHO GUARD START ===` sectioning.
   - Add HTTP fetch to sync with backend `/api/v1/blacklist`.
   - Add YouTube restricted mode and DuckDuckGo SafeSearch entries.

### 5.2 Backend Improvements
1. **Update `backend/server.js`**:
   - Support dual-path routing: mount endpoints on both `/` and `/api/v1/` (e.g. `/blacklist` and `/api/v1/blacklist`).
   - Add centralized error handling middleware.
   - Export `app` for testing: `module.exports = app;`.
2. **Update `backend/package.json`**:
   - Add `"scripts": { "start": "node server.js", "test": "node test-backend.js" }`.
3. **Enhance `backend/test-backend.js`**:
   - Test both `/api/v1/*` and root `/*` endpoints.
   - Test negative validation cases (missing parameters returning 400).
