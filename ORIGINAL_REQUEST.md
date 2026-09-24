# Original User Request

## 2026-09-23T16:40:50Z

Build, test, and harden the "Shuddho Guard" multi-platform content protection system for Bangladesh comprising an Android DNS/VPN filter, a Chrome Extension for social media trap link interception, a Windows background host/DNS blocker, and a cloud backend.

Working directory: c:/Users/assdi/Documents/Downloads/shuddho-guard
Integrity mode: development

## Requirements

### R1. Chrome Extension: Honey-Trap Interceptor & Social Media Filter
Intercept deceptive and honey-trap links on Facebook and social media (e.g. clickbait posts leading to adult Telegram channels via `t.me/` or URL shorteners) and present a prominent modal warning preventing navigation. Provide a clean Manifest V3 extension structure with working icons and popup.

### R2. Android DNS & Safety Filter (VpnService + CleanBrowsing / Cloudflare)
Maintain an Android VpnService routing DNS to CleanBrowsing Adult DNS (`185.228.168.10`) and Cloudflare Family DNS (`1.1.1.3` / `2606:4700:4700::1113`) to enforce SafeSearch and block explicit websites. Provide a PIN-protected local vault interface for self-accountability.

### R3. Windows PC Background Host & SafeSearch Enforcer
Maintain a background daemon with admin elevation installer that modifies the Windows hosts file to block adult domains, enforce Google SafeSearch IP redirects, and run silently on Windows startup without visible cmd windows.

### R4. Cloud Blacklist Sync Server & Testing Suite
Maintain the Express backend server with endpoints for dynamic domain/telegram blacklist updates, user trap reporting, and subscription verification. All test suites must run and pass programmatically.

## Acceptance Criteria

### Automated Verification
- [ ] Automated unit tests in `tools/test-banglish-filter.js` pass (7/7).
- [ ] Automated tests in `tools/test-trap-detector.js` pass (4/4).
- [ ] Backend server `/health`, `/blacklist`, `/report`, and `/subscription/verify` pass in `backend/test-backend.js`.
- [ ] Chrome extension manifests validly with Manifest V3 and includes all referenced icons and scripts.
- [ ] Windows client scripts have admin elevation detection and silent execution capability.
- [ ] All code and documentation are cleanly organized in `c:/Users/assdi/Documents/Downloads/shuddho-guard`.
