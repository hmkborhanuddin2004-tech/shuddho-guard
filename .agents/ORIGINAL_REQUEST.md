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

## 2026-09-24T12:07:12Z

Build, integrate, and verify the 4 advanced protection pillars of the Shuddho Guard ecosystem: real-time ad/trap-link interceptor, PureGram safe Telegram client, AI-driven social media NSFW blur, and anti-uninstall/bypass watchdog.

Working directory: c:/Users/assdi/Documents/Downloads/shuddho-guard
Integrity mode: development

## Requirements

### R1. Malicious Ad & Trap-Link Interceptor (YouTube, Facebook, TikTok, Instagram)
Detect and intercept deceptive links and clickbait advertisements on major platforms before opening. Instantly evaluate URLs against betting (1xBet, 1win, Babu88), adult websites, and deceptive Telegram redirect chains, presenting an immediate warning and blocking malicious navigation.

### R2. PureGram — Safe Open-Source Telegram Android Client
Establish a customized, secure build configuration and code modification based on the official Telegram Android repository. Permanently purge global adult channel and bot search, lock the sensitive content filter so it cannot be disabled, and restrict automatic download of media and files from unknown groups and bots.

### R3. Social Media Real-Time AI NSFW Image & Video Blur Engine
Implement real-time visual safety scanning using lightweight on-device AI. Instantly identify and blur or obscure revealing and explicit media appearing in social media feeds within 150ms without degrading scrolling performance.

### R4. Iron-Clad Anti-Uninstall & VPN Bypass Watchdog
Harden the Android system with Device Admin policies ensuring the application cannot be uninstalled without administrative authorization or a device flash. Continuously monitor installed packages and active network interfaces to automatically detect, block, and disable third-party VPNs and proxy tools attempting to bypass protection.

## Acceptance Criteria

### Automated Verification
- [ ] Trap-link detection engine passes automated test suite covering YouTube, TikTok, and Facebook clickbait patterns and URL shorteners.
- [ ] PureGram source modifications, search restrictions, and sensitive content hard-lock pass code integrity and build verification scripts.
- [ ] Social media NSFW blur engine passes automated synthetic image benchmarks with <150ms classification latency and verifiable CSS/view overlay application.
- [ ] Android Device Admin policies and `AppInstallWatcher` successfully detect and block simulated uninstalls and rogue VPN packages.
- [ ] All test scripts pass cleanly with zero failures via npm/gradle programmatic runners.

