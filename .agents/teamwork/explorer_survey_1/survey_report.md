# Shuddho Guard — Comprehensive Architectural Survey Report
## Pillar 1 (R1: Malicious Ad & Trap-Link Interceptor) & Pillar 3 (R3: Social Media Real-Time AI NSFW Blur Engine)

**Surveyor:** Survey Explorer 1  
**Target Project:** Shuddho Guard (`c:\Users\assdi\Documents\Downloads\shuddho-guard`)  
**Date:** 2026-09-24  
**Status:** Complete Read-Only Investigation  

---

## 1. Executive Summary

A comprehensive, file-by-file investigation of the Shuddho Guard repository was conducted to assess the readiness, code assets, architectural integrity, and test coverage for:
- **Pillar 1 (R1): Malicious Ad & Trap-Link Interceptor** (YouTube, Facebook, TikTok, Instagram, betting platforms 1xBet/1win/Babu88, Telegram redirects)
- **Pillar 3 (R3): Social Media Real-Time AI NSFW Image & Video Blur Engine** (On-device AI visual safety scanning, <150ms latency, scrolling performance, verifiable CSS/view overlay application, automated synthetic benchmarks)

### Core Findings Matrix

| Component | Status | Key Findings & Deficiencies |
|---|---|---|
| **R1: Trap-Link Interceptor** | **Partial (60%)** | Basic domain/keyword lists and in-page modal exist, but **completely bypassed** on YouTube (`youtube.com/redirect?q=...`), Facebook (`l.facebook.com/l.php?u=...`), and Instagram (`l.instagram.com/?u=...`) because link-wrapping parameters are never unpacked. Prefix betting domains (`bd-1xbet.com`, `babu88live.com`) slip through regex. `tools/test-trap-detector.js` tests a disconnected clone rather than production code and lacks platform-specific clickbait test fixtures. |
| **R3: Real-Time AI NSFW Blur** | **Deficient / Incomplete (25%)** | **No on-device AI model exists** in the repository. Instead, an archaic 14-line RGB skin-tone threshold is used, causing massive false positives. Cross-origin canvas export errors (`SecurityError: Tainted canvas`) silently fail on real CDN images. **Every `<video>` tag is indiscriminately blurred (100% blanket blur)**. There are **zero synthetic image benchmarks**, zero latency measurement suites, and no `IntersectionObserver` viewport virtualization. |
| **Extension Infrastructure** | **Partial (70%)** | `web-extension/` and `extension/` are identical duplicates. Critical inter-component communication bugs: popup reads `blurredCount` while background writes `mediaBlurred`; content script emits action `mediaBlurred` while background listens for `media_blurred`. `warning.js` is orphaned and not included in `warning.html`. |
| **Backend Integration** | **Minimal (30%)** | `backend/server.js` exposes `/api/v1/blacklist` and `/api/v1/report`, but the browser extension does not sync with or poll the cloud engine for dynamic threat intelligence. |
| **Automated Verification** | **Incomplete (35%)** | Root `npm test` runs 3 simple node scripts (Banglish slang, hardcoded trap cases, backend API). Zero test suites exist for R3 synthetic benchmarks, zero tests verify CSS overlay application, zero tests cover YouTube/TikTok/Facebook clickbait wrappers. |

---

## 2. Codebase & Asset Inventory

### 2.1 File Map for R1 and R3

```
shuddho-guard/
├── web-extension/                  # Primary Extension Directory (MV3)
│   ├── manifest.json               # Chrome Manifest V3 configuration
│   ├── INSTALL_GUIDE.bat           # Manual loading helper batch file
│   ├── icons/                      # Generated solid PNG and SVG icons
│   │   ├── icon.svg, icon16.png, icon48.png, icon128.png
│   ├── scripts/
│   │   ├── background.js           # MV3 Service worker (event & storage hub)
│   │   ├── trap-link-interceptor.js# [R1] Harmful link & trap click listener
│   │   └── ai-vision-blur.js       # [R3] Skin heuristic & DOM mutation observer
│   ├── popup/
│   │   ├── popup.html              # Extension toolbar popup layout
│   │   └── popup.js                # Extension popup badge & stat renderer
│   └── pages/
│       ├── warning.html            # Standalone trap warning page
│       └── warning.js              # Controller for warning page (disconnected)
├── extension/                      # Byte-for-byte exact duplicate of web-extension/
├── backend/
│   ├── server.js                   # Express server with /blacklist & /report
│   ├── test-backend.js             # API test suite
│   └── package.json                # Express & CORS dependencies
├── simulator/
│   └── index.html                  # Interactive HTML/JS simulator with mock UI
├── tools/
│   ├── test-trap-detector.js       # Standalone test runner for R1 logic clone
│   ├── test-banglish-filter.js     # Banglish slang unit test
│   ├── create-png-icons.js         # Pure Node.js PNG binary generator
│   └── build-bundle.js             # Source code aggregator
└── package.json                    # Root scripts (npm test)
```

### 2.2 Directory Duplication: `extension/` vs `web-extension/`
A binary comparison (`git diff --no-index extension web-extension`) confirmed that `extension/` and `web-extension/` are 100% byte-for-byte identical duplicates.
- **Risk:** Maintaining two identical folders invites drift. Edits to one will leave the other outdated.
- **Recommendation:** Consolidate onto `web-extension/` (which is documented in `README.md` and `ALL_CODE_BUNDLE.md`) and remove or alias `extension/`.

---

## 3. Pillar 1 (R1: Malicious Ad & Trap-Link Interceptor) Deep-Dive

### 3.1 Requirement Specification
From `ORIGINAL_REQUEST.md`:
> **R1. Malicious Ad & Trap-Link Interceptor (YouTube, Facebook, TikTok, Instagram)**  
> Detect and intercept deceptive links and clickbait advertisements on major platforms before opening. Instantly evaluate URLs against betting (1xBet, 1win, Babu88), adult websites, and deceptive Telegram redirect chains, presenting an immediate warning and blocking malicious navigation.  
> **Acceptance Criteria:**  
> - Trap-link detection engine passes automated test suite covering YouTube, TikTok, and Facebook clickbait patterns and URL shorteners.

### 3.2 What Is Currently Implemented
1. **Domain Lists (`trap-link-interceptor.js` & `test-trap-detector.js`):**
   - 21 Gambling domains: `1xbet`, `melbet`, `bet365`, `babu88`, `jeetbuzz`, `mostbet`, `parimatch`, `crazytime`, `linebet`, `betway`, `krikya`, `bajilive`, `crickex`, `betwinner`, `22bet`, `1win`, `megapari`, `dafabet`, `stake.com`, `bc.game`, `shillongteer`.
   - 17 Adult domains: `pornhub.com`, `xvideos.com`, `xnxx.com`, `xhamster.com`, `stripchat.com`, `bongacams.com`, `chotikahini.com`, `banglachoti.com`, `deshiboudi.com`, `bdchoti.net`, `redwap.me`, `spankbang.com`, `brazzers.com`, `chaturbate.com`, `onlyfans.com`, `fapello.com`, `leakgirls.com`, `thothub.to`.
   - 3 Telegram domains: `t.me`, `telegram.me`, `telegram.dog`.
   - 7 Shorteners: `bit.ly`, `tinyurl.com`, `cutt.ly`, `is.gd`, `t.co`, `rb.gy`, `shorturl.at`.
2. **Context Keyword Lists:**
   - Gambling keywords (e.g., `1xbet`, `melbet`, `babu88`, `casino`, `ক্যাসিনো`, `জুয়া`, `বাজি`, `টাকা ইনকাম লিংক`, `ডিপোজিট বোনাস`, `aviator`, `crazy time`, etc.).
   - Adult keywords (e.g., `choti`, `boudi`, `gopon`, `viral video`, `leaked`, `18+`, `সহবাস`, `বউ ছাড়া`, `গোপন ভিডিও`, `ভিডিও লিংক`, `কমেন্টে লিংক`, `চটি গল্প`, `mms`, etc.).
3. **Link Interaction Capture:**
   - In `trap-link-interceptor.js`: Captures `click` and `auxclick` events at the document level during capturing phase (`addEventListener('click', ..., true)`).
   - Identifies closest anchor: `e.target.closest('a')`.
   - Analyzes risk via `analyzeLinkRisk(anchor)`.
4. **Warning UI Modal:**
   - Injects a high z-index modal (`#shuddho-trap-modal`) with dark backdrop blur (`backdrop-filter: blur(10px)`), warning icon, risk badge, description, XSS-sanitized blocked URL via `textContent`, and safe return button.

### 3.3 Critical Gaps & Architectural Vulnerabilities in R1

#### 1. The Platform Redirect Wrapper Bypass (Severe Vulnerability)
Major social platforms wrap outbound links in redirection/tracking endpoints:
- **YouTube:**
  All outbound links in comments and descriptions are rewritten to:
  `https://www.youtube.com/redirect?event=video_description&redir_token=...&q=https%3A%2F%2F1xbet-bd.com`
- **Facebook:**
  All outbound links in posts, comments, and ads are rewritten to Link Shim:
  `https://l.facebook.com/l.php?u=https%3A%2F%2F1xbet.com&h=...` or `https://lm.facebook.com/l.php?u=...`
- **Instagram:**
  Outbound links route through:
  `https://l.instagram.com/?u=https%3A%2F%2Ft.me%2Fbabu88`
- **Google / Other:**
  `https://www.google.com/url?q=...`

**The Vulnerability:**
In `trap-link-interceptor.js` (lines 38-46):
```javascript
function extractHostname(rawUrl) {
    if (!rawUrl) return '';
    try {
        const u = new URL(rawUrl, window.location.href);
        return (u.hostname || '').toLowerCase();
    } catch (e) {
        return '';
    }
}
```
When a user clicks a YouTube comment link to `1xbet`, `rawUrl` is `https://www.youtube.com/redirect?q=https%3A%2F%2F1xbet.com`.
`extractHostname` returns `www.youtube.com`.
`isGamblingDomain`, `isAdultDomain`, `isTelegramDomain`, and `isShortener` all evaluate to **FALSE**.
Even if comment text contains gambling keywords, `(isShortener || isTelegramDomain)` is **FALSE**.
Therefore, `analyzeLinkRisk` returns `{ isHarmful: false }`.
**Result:** Malicious links on YouTube, Facebook, and Instagram pass straight through unblocked.

#### 2. Domain Variant & Mirror Bypass in `hostMatches`
Betting and adult operations routinely use mirror domains.
In `hostMatches`:
```javascript
if (!pattern.includes('.')) {
    const labels = hostname.split('.');
    for (const label of labels) {
        if (label === pattern) return true;
        if (label.startsWith(pattern + '-') || label.startsWith(pattern + '_')) return true;
        const digitsRegex = new RegExp(`^${pattern}[0-9]+$`);
        if (digitsRegex.test(label)) return true;
    }
}
```
**Bypasses:**
- `bd-1xbet.com` or `bangla-1win.com`: Does not start with `pattern-`. Does not match regex. **BYPASSED.**
- `babu88live.com` or `1winbd.com`: Contains trailing letters rather than digits. Does not match `^pattern[0-9]+$`. **BYPASSED.**
- `official1xbet.com`: Contains leading text. **BYPASSED.**
- `babu88-cricket.net`: Does match prefix `babu88-`, but `playbabu88.com` does not.

#### 3. Platform Clickbait Context Container Selectors
In `trap-link-interceptor.js`:
```javascript
const parentElem = anchor.closest('div[role="article"], div[data-ad-preview="message"], .comment, div[dir="auto"], p, article');
```
This selector works for generic Facebook posts, but misses:
- **YouTube:** `ytd-comment-renderer`, `#description-inline-expander`, `ytd-promoted-sparkles-web-renderer`, `ytd-action-companion-ad-renderer`
- **TikTok:** `[data-e2e="comment-level-1"]`, `[data-e2e="browse-video-desc"]`, `.tiktok-ad-card`
- **Instagram:** `ul._a9z6 li`, `div[role="dialog"]`

#### 4. Disconnection of Production Code and Test Suite
- `web-extension/scripts/trap-link-interceptor.js` is wrapped in a browser IIFE with DOM dependencies. It exports no CommonJS/ES modules.
- `tools/test-trap-detector.js` duplicates the code independently with an altered signature (`analyzeLink(href, contextText)` instead of `analyzeLinkRisk(anchor)`).
- Updating one file has zero effect on the other.
- `test-trap-detector.js` contains only 10 test cases and tests **zero** YouTube redirect patterns, **zero** TikTok clickbait ads, **zero** Facebook Link Shim redirects, and **zero** 1win/Babu88 domain variants.

---

## 4. Pillar 3 (R3: Social Media Real-Time AI NSFW Image & Video Blur Engine) Deep-Dive

### 4.1 Requirement Specification
From `ORIGINAL_REQUEST.md`:
> **R3. Social Media Real-Time AI NSFW Image & Video Blur Engine**  
> Implement real-time visual safety scanning using lightweight on-device AI. Instantly identify and blur or obscure revealing and explicit media appearing in social media feeds within 150ms without degrading scrolling performance.  
> **Acceptance Criteria:**  
> - Social media NSFW blur engine passes automated synthetic image benchmarks with <150ms classification latency and verifiable CSS/view overlay application.

### 4.2 What Is Currently Implemented
In `web-extension/scripts/ai-vision-blur.js`:
1. **CSS Injection:** Injects `.shuddho-blurred-media { filter: blur(35px) !important; }` and `.shuddho-shield-badge`.
2. **Skin Color Ratio Calculation:**
   Samples a 50x50 canvas from the image:
   ```javascript
   if (r > 95 && g > 40 && b > 20 &&
       Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
       Math.abs(r - g) > 15 && r > g && r > b) {
       skinPixels++;
   }
   if (skinRatio > 0.32) { applyBlur(img); }
   ```
3. **DOM Mutation Observer:** Observes `document.body` with `{ childList: true, subtree: true }` and scans `img` and `video` elements.

### 4.3 Critical Gaps & Failures in R3

#### 1. Complete Absence of On-Device AI Model
- The requirement explicitly mandates: **"lightweight on-device AI"**.
- The existing code contains **no neural network, no TensorFlow.js, no ONNX Runtime Web, no MobileNet, no TFLite, and no NSFWJS**.
- The 14-line RGB skin-tone threshold (Peer et al., 1999) is an obsolete color heuristic. It does not analyze semantic features, anatomical shapes, textures, or clothing boundaries.
- **Consequences:**
  - **Severe False Positives:** Regular images of beaches, sand dunes, wood furniture, terracotta pottery, baked bread, and close-up selfies/portraits of clothed individuals trigger `skinRatio > 0.32` and get blurred.
  - **Severe False Negatives:** Adult content in non-standard lighting (neon, monochrome, low-light), artistic suggestive imagery, or individuals with diverse skin tones falling outside the rigid `(r > 95 && g > 40 && b > 20)` box are completely ignored.

#### 2. Cross-Origin Tainted Canvas Crash (`SecurityError`)
Social media images on Facebook, Instagram, TikTok, and YouTube originate from external CDN domains (`*.fbcdn.net`, `*.cdninstagram.com`, `*.ytimg.com`, `*.tiktokcdn.com`).
When `ctx.drawImage(img, 0, 0, sampleW, sampleH)` is drawn from a cross-origin image without CORS access:
Calling `ctx.getImageData(...)` throws:
```
SecurityError: Failed to execute 'getImageData' on 'CanvasRenderingContext2D': The canvas has been tainted by cross-origin data.
```
In `ai-vision-blur.js`, this error is caught by `catch (e) {}` and discarded.
**Consequence:** In a real browser on social media feeds, almost **all** images from CDNs silently fail to be analyzed.

#### 3. Indiscriminate 100% Blanket Video Blurring Bug
In `ai-vision-blur.js` (lines 115-118, 124-126):
```javascript
} else if (node.tagName === 'VIDEO') {
    // খোলামেলা রিলস ও ভিডিও ফ্রেম তাৎক্ষণিক নিরাপদ রাখা
    applyBlur(node);
}
```
Every `<video>` element added to the DOM is immediately blurred unconditionally.
Whether a user is watching a Khan Academy lecture, a tech tutorial, Quran recitation, cricket highlights, or a recipe, the video is completely blurred. This breaks core platform functionality.

#### 4. Total Lack of Synthetic Benchmarks and Latency Measurement
- The acceptance criterion mandates:
  **"Social media NSFW blur engine passes automated synthetic image benchmarks with <150ms classification latency and verifiable CSS/view overlay application."**
- There is **not a single synthetic image benchmark script** in the repository.
- There is no test that creates synthetic test patterns (e.g. skin-exposure bitmaps vs. scenery/document bitmaps), measures execution time via `performance.now()`, and asserts that latency is strictly `< 150ms`.
- There is no test verifying that `.shuddho-blurred-media` and `.shuddho-shield-badge` are applied to the DOM.

#### 5. Scrolling Performance & UI Thread Starvation (Jank)
- `MutationObserver` triggers synchronously on every added node during rapid infinite scrolling.
- Without an `IntersectionObserver`, images that are far down the feed (off-screen) are analyzed immediately, competing for CPU time with page rendering.
- No task batching via `requestIdleCallback` or `requestAnimationFrame`.

---

## 5. Extension Inter-Component Wiring & Storage Audit

### 5.1 Communication Mismatches Between Content Script, Background, & Popup

During investigation, three critical naming and key mismatches were discovered that break state synchronization:

```
[ai-vision-blur.js]
  │
  ├─ action: 'mediaBlurred' ────────────► [background.js]
  │                                         │ (listens for 'media_blurred') ──► MISMATCH (Never triggers!)
  │
  ▼
[background.js]
  │
  ├─ writes key: 'mediaBlurred' ────────► chrome.storage.local
  │
  ▼
[popup.js]
  │
  └─ reads key: 'blurredCount' ◄──────── chrome.storage.local
                                            │ (reads undefined) ──────────────► MISMATCH (Always displays "0")
```

1. **Message Action Mismatch:**
   - `ai-vision-blur.js` (line 92): `chrome.runtime.sendMessage({ action: 'mediaBlurred' });`
   - `background.js` (line 53): `if (request.action === 'media_blurred')`
   - **Effect:** The background script never records media blur events sent from the content script.
2. **Storage Key Mismatch:**
   - `background.js` (line 56): `chrome.storage.local.set({ mediaBlurred: count })`
   - `popup.js` (line 9): `chrome.storage.local.get(['blurredCount', 'trapsBlocked'], ...)`
   - **Effect:** The popup badge for "ব্লার করা ছবি" always reads `undefined` (displays "0").
3. **Orphaned Warning Page Script:**
   - `web-extension/pages/warning.html` contains an inline script looking for `id="targetUrl"` and does not include `<script src="warning.js"></script>`.
   - `web-extension/pages/warning.js` expects elements with IDs `blocked-target-url`, `btn-go-back`, and `btn-report-trap`, none of which exist in `warning.html`.
   - Neither `trap-link-interceptor.js` nor `background.js` ever navigates to `warning.html` (they only show an in-page modal).

---

## 6. Backend and Simulator Readiness for R1 & R3

### 6.1 Backend Server (`backend/server.js`)
- Exposes `GET /blacklist` and `GET /api/v1/blacklist`, returning `dynamicBlacklist` with initial entries for betting sites (`1xbet.com`, `melbet.org`, `babu88.com`, `jeetbuzz.com`), Telegram channels (`choti_boudi_leak_18`, etc.), and Banglish keywords.
- Exposes `POST /report` and `POST /api/v1/report` allowing users to report new malicious links.
- **Disconnection:** The extension never queries `/blacklist` upon startup or periodically. If new malicious domains or Telegram channels are added to the cloud backend, the browser extension never receives them.

### 6.2 Interactive Simulator (`simulator/index.html` & `docs/simulator.html`)
- An interactive web application that demonstrates the UI concept (Stealth Calculator unlocking with `1234=`, mock Facebook post with sample adult image and trap link).
- **Disconnection:** The simulator uses hardcoded mock JavaScript functions (`autoFillPin`, `toggleBlurPreview`, `triggerTrapClick`) rather than importing the actual extension code modules. It serves as a visual demo but cannot be used for programmatic verification.

---

## 7. Current Test Suites and Programmatic Runners

### 7.1 Existing Scripts in `package.json`
```json
"scripts": {
  "test": "node tools/test-banglish-filter.js && node tools/test-trap-detector.js && node backend/test-backend.js",
  "test:banglish": "node tools/test-banglish-filter.js",
  "test:trap": "node tools/test-trap-detector.js",
  "test:backend": "node backend/test-backend.js",
  "start:backend": "node backend/server.js",
  "start:pc": "node windows-client/shuddho-pc-guard.js"
}
```

### 7.2 Deficiencies in Test Infrastructure
1. **No Shared Core Module:** The link interceptor logic in `tools/test-trap-detector.js` is a static clone rather than testing the real extension script.
2. **Missing Platform Clickbait Test Suite:** Zero tests for:
   - YouTube redirect wrappers (`youtube.com/redirect?q=...`)
   - Facebook Link Shim wrappers (`l.facebook.com/l.php?u=...`)
   - TikTok clickbait bio / comment links
   - Instagram redirect links (`l.instagram.com/?u=...`)
   - Domain variants (`1win-bd.net`, `babu88live.com`, `bd-1xbet.com`)
3. **Zero R3 Automated Test Suite:**
   - Zero synthetic image generation fixtures.
   - Zero latency assertion tests (`< 150ms`).
   - Zero tests verifying CSS class injection (`.shuddho-blurred-media`) and DOM overlay injection (`.shuddho-shield-badge`).
4. **No NPM Test Runner Entry for R3:**
   - `npm test` does not execute any visual or benchmark test for R3.

---

## 8. Requirements vs. Current Implementation Matrix

| Requirement Specification | Status | What Exists | What Is Missing / Defective |
|---|---|---|---|
| **R1: Intercept deceptive links on YouTube, Facebook, TikTok, Instagram** | **Partial** | Intercepts direct `<a>` tag clicks matching static list | Fails on platform redirect wrappers (`youtube.com/redirect`, `l.facebook.com`, `l.instagram.com`); misses platform container context. |
| **R1: Betting domains (1xBet, 1win, Babu88)** | **Partial** | Brand strings in `GAMBLING_DOMAINS` | Fails on prefix/suffix mirror domains (`bd-1xbet.com`, `babu88live.com`, `1winbd.com`). |
| **R1: Adult websites & keywords** | **Implemented** | 17 domains, 21 keywords, regex matching | Needs sync with backend dynamic blacklist. |
| **R1: Deceptive Telegram redirect chains** | **Partial** | Detects `t.me` with adult/gambling slugs | Fails when wrapped in platform redirects or shorteners without text keywords. |
| **R1: Immediate warning and blocking** | **Implemented** | DOM modal `#shuddho-trap-modal` | Warning page `warning.html` / `warning.js` disconnected. |
| **R1: Automated test suite for YouTube, TikTok, Facebook clickbait & shorteners** | **Missing** | Generic 10-test runner in `tools/test-trap-detector.js` | Zero platform redirect tests; zero TikTok/YouTube clickbait tests; tests clone not production code. |
| **R3: Real-time visual safety scanning via lightweight on-device AI** | **Missing** | Naive 14-line RGB skin-tone threshold in `ai-vision-blur.js` | Zero AI models. No MobileNet / ONNX / NSFWJS / lightweight perceptual neural classifier. |
| **R3: Blur explicit media within 150ms** | **Unverified** | Synchronous canvas sampling | No latency measurement or benchmarking harness. |
| **R3: Maintain scrolling performance** | **Defective** | MutationObserver on document.body | Heavy synchronous execution; no `IntersectionObserver` or frame virtualization. |
| **R3: Video blur handling** | **Defective** | Blanket blur on `<video>` | 100% of videos indiscriminately blurred. |
| **R3: Automated synthetic image benchmarks (<150ms & CSS/overlay verification)** | **Missing** | None | Zero benchmark runners, zero synthetic test fixtures, zero DOM overlay tests. |

---

## 9. Comprehensive Architectural Recommendations

To satisfy the requirements and acceptance criteria in `ORIGINAL_REQUEST.md`, the following implementation tasks are required:

### For Pillar 1 (R1: Malicious Ad & Trap-Link Interceptor)
1. **Build a Universal Link Unwrapper & Deep-Link Evaluator:**
   - Extract and recursively unwrap URL parameters:
     - `youtube.com/redirect?q=...` -> decode `q`
     - `l.facebook.com/l.php?u=...` and `lm.facebook.com/l.php?u=...` -> decode `u`
     - `l.instagram.com/?u=...` -> decode `u`
     - Google search redirect `google.com/url?q=...`
   - Evaluate the unpacked target URL against betting, adult, Telegram, and shortener rules.
2. **Harden Domain Variant Matching:**
   - Support prefix, infix, and mirror patterns for key targets: `1xbet`, `1win`, `babu88`, `melbet`, `jeetbuzz`, `parimatch`, `crazytime`.
   - Match domains where pattern occurs as a standalone token or with standard betting prefixes/suffixes (`bd-`, `official-`, `live`, `app`, `login`, `vip`, `pro`).
3. **Enhance Platform Container Selectors:**
   - Add selectors for YouTube comments (`#comment #content-text`, `ytd-comment-renderer`), descriptions (`#description-inline-expander`), and ad cards (`ytd-promoted-sparkles-web-renderer`).
   - Add selectors for TikTok comments (`[data-e2e="comment-level-1"]`) and descriptions (`[data-e2e="browse-video-desc"]`).
   - Add selectors for Instagram comment dialogs (`ul._a9z6 li`).
4. **Unify Module and Build Comprehensive Automated Test Suite:**
   - Extract interceptor core into a shared, testable engine usable in both Extension (content script / background) and Node.js testing environment.
   - Expand `tools/test-trap-detector.js` (or create `tools/test-trap-interceptor-platforms.js`) to test:
     - YouTube redirect wrappers containing 1xBet, Babu88, adult links.
     - Facebook Link Shim wrappers with Telegram honey-traps.
     - TikTok sponsored/bio clickbait patterns.
     - URL shortener chains.
     - False positive controls (ensure legitimate educational and news channels remain allowed).

### For Pillar 3 (R3: Social Media Real-Time AI NSFW Image & Video Blur Engine)
1. **Implement Lightweight On-Device AI Visual Safety Classifier:**
   - Implement a lightweight, fast visual safety classifier pipeline optimized for in-browser execution with `< 150ms` latency:
     - Multi-stage architecture:
       - **Stage 1 (Perceptual Filter, <5ms):** Fast chromatic and entropy screening to immediately pass non-skin content (text, landscapes, dark interfaces).
       - **Stage 2 (Lightweight On-Device Model / Neural Classifier, <60ms):** Evaluates candidate images against revealing and explicit visual features (nudity, suggestive exposure, anatomical prominence).
2. **Solve Cross-Origin Canvas Tainting:**
   - Add `crossOrigin = "anonymous"` where feasible, or route image data through background service worker / offscreen canvas where extension host permissions permit direct fetching as ArrayBuffer/Blob.
3. **Fix Video Blurring Logic:**
   - Remove unconditional `applyBlur(video)`.
   - Sample video poster attribute or first frame when playing, or apply heuristic evaluation before obscuring.
4. **Implement Viewport-Aware Scrolling Optimization:**
   - Replace or augment `MutationObserver` with `IntersectionObserver` so only media entering the active viewport is queued for AI evaluation.
   - Cache results in a `WeakSet` or hash map to prevent redundant re-evaluations.
5. **Create Automated Synthetic Image Benchmark Suite:**
   - Develop `tools/test-nsfw-blur-engine.js` (or `tools/benchmark-ai-blur.js`):
     - Generate programmatic synthetic images (using Buffer and PNG encoding without heavy native bindings):
       - Explicit synthetic patterns (high exposure skin-tone gradients and revealing contours).
       - Benign synthetic patterns (nature landscapes, dark mode IDE screenshots, books, text).
     - Run benchmarks measuring classification latency per image with `performance.now()`.
     - Assert that average and 95th-percentile classification latency is strictly `< 150ms`.
     - Simulate DOM elements, execute blur logic, and verify that `.shuddho-blurred-media` CSS class and `.shuddho-shield-badge` overlay element are accurately applied.
     - Add execution of this benchmark to root `package.json` `"test"` script.

### For Extension Wiring & Cleanup
1. Synchronize messaging actions: Standardize on `media_blurred` or handle both `mediaBlurred` and `media_blurred` in `background.js`.
2. Synchronize storage keys: Standardize on `mediaBlurred` (or `blurredCount`) across `background.js` and `popup.js`.
3. Fix `pages/warning.html` and `warning.js`: Link the script in the HTML and match element IDs (`targetUrl` vs `blocked-target-url`, button IDs).
4. Remove or synchronize `extension/` with `web-extension/`.

---
*Report completed by Survey Explorer 1.*
