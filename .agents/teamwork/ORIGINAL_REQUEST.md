# Original User Request

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
