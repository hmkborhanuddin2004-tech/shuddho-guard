# Handoff Report — Survey Explorer 1: R1 & R3 Architectural Survey

**Surveyor:** Survey Explorer 1  
**Working Directory:** `c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\explorer_survey_1`  
**Target:** Pillar 1 (R1: Malicious Ad & Trap-Link Interceptor) & Pillar 3 (R3: Social Media Real-Time AI NSFW Blur Engine)  
**Handoff Type:** Hard (Survey Task Complete)  
**Parent Conversation ID:** `1568080f-3592-4965-a008-57d3138f1150`  

---

## 1. Observation

### O1: Duplicate Extension Directories
- `web-extension/` and `extension/` both exist at the project root.
- A binary diff executed via `git diff --no-index extension web-extension` exited with code 0 and zero textual diffs.
- `web-extension/` contains:
  - `manifest.json`
  - `scripts/trap-link-interceptor.js`
  - `scripts/ai-vision-blur.js`
  - `scripts/background.js`
  - `popup/popup.html`, `popup/popup.js`
  - `pages/warning.html`, `pages/warning.js`
  - `icons/` (`icon.svg`, `icon16.png`, `icon48.png`, `icon128.png`)

### O2: R1 Platform Redirection & Link-Wrapping Bypass
- In `web-extension/scripts/trap-link-interceptor.js` (lines 38-46):
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
- In `trap-link-interceptor.js` (lines 58-73):
  `hostMatches` only matches hostname against patterns.
- YouTube wraps external links in `https://www.youtube.com/redirect?event=video_description&redir_token=...&q=http%3A%2F%2F1xbet.com`.
  - For this URL, `extractHostname` returns `www.youtube.com`.
  - `isGamblingDomain`, `isAdultDomain`, `isTelegramDomain`, and `isShortener` all return `false`.
  - Result: `analyzeLinkRisk` returns `{ isHarmful: false }`.
- Facebook wraps links in `https://l.facebook.com/l.php?u=...` and Instagram in `https://l.instagram.com/?u=...`.
  - Both return hostnames `l.facebook.com` and `l.instagram.com`, bypassing the interceptor.

### O3: R1 Betting Domain Variant Gaps
- In `web-extension/scripts/trap-link-interceptor.js` (lines 61-71):
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
- Tested against common mirror URLs:
  - `bd-1xbet.com` -> `label` is `bd-1xbet` -> fails `startsWith(pattern + '-')` -> `false`.
  - `babu88live.com` -> `label` is `babu88live` -> fails `^babu88[0-9]+$` -> `false`.
  - `1winbd.com` -> `label` is `1winbd` -> fails `^1win[0-9]+$` -> `false`.

### O4: Disconnection Between Test Suite and Production Code in R1
- In `tools/test-trap-detector.js`:
  - Contains independent re-implementations of `extractHostname`, `hostMatches`, and `analyzeLink(href, contextText)` (lines 26-94).
  - It does NOT import or evaluate `web-extension/scripts/trap-link-interceptor.js`.
  - It contains 10 hardcoded test cases (lines 96-157).
  - It contains **zero** test cases for YouTube redirect wrappers, Facebook Link Shim, TikTok clickbait ads, or Instagram redirect URLs.

### O5: R3 Complete Absence of On-Device AI Model
- In `web-extension/scripts/ai-vision-blur.js` (lines 43-82):
  - Function `analyzeImageNudity(img)` uses a 50x50 canvas pixel iteration:
    ```javascript
    if (r > 95 && g > 40 && b > 20 &&
        Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
        Math.abs(r - g) > 15 && r > g && r > b) {
        skinPixels++;
    }
    const skinRatio = skinPixels / totalPixels;
    if (skinRatio > 0.32) { applyBlur(img); }
    ```
  - Grep search for `onnx`, `tflite`, `tfjs`, `tensorflow`, `mobilenet`, and `nsfw` across the codebase yielded zero AI model weights or libraries in `web-extension/` or root.
  - The color rule blurs non-explicit objects with beige/brown/skin-like hues (wood, terracotta, sand, portraits of clothed faces).

### O6: R3 Cross-Origin Tainted Canvas
- In `ai-vision-blur.js` (lines 79-81):
  ```javascript
  } catch (e) {
      // ক্রস-অরিজিন সুরক্ষার ক্ষেত্রে অলটারনেティブ সিএসএস ফিল্টারিং
  }
  ```
  - Real social media images hosted on `*.fbcdn.net`, `*.cdninstagram.com`, `*.ytimg.com`, `*.tiktokcdn.com` trigger a browser `DOMException: SecurityError: The canvas has been tainted by cross-origin data.` upon `ctx.getImageData()`.
  - This error is swallowed silently, causing image analysis on social feeds to fail silently.

### O7: R3 Blanket 100% Video Blurring Bug
- In `ai-vision-blur.js` (lines 115-118, 124-126):
  ```javascript
  } else if (node.tagName === 'VIDEO') {
      // খোলামেলা রিলস ও ভিডিও ফ্রেম তাৎক্ষণিক নিরাপদ রাখা
      applyBlur(node);
  }
  ```
  - Every single `<video>` element added to the DOM is immediately blurred unconditionally, regardless of content.

### O8: Absence of R3 Synthetic Image Benchmark & Latency Suite
- Acceptance criteria state:
  "- [ ] Social media NSFW blur engine passes automated synthetic image benchmarks with <150ms classification latency and verifiable CSS/view overlay application."
- In the entire codebase, there are zero benchmark scripts, zero synthetic image generators, zero latency assertions, and zero tests verifying CSS overlay injection.

### O9: Inter-Component Storage and Messaging Inconsistencies
- `web-extension/scripts/ai-vision-blur.js` (line 92):
  `chrome.runtime.sendMessage({ action: 'mediaBlurred' });` (camelCase)
- `web-extension/scripts/background.js` (line 53):
  `if (request.action === 'media_blurred')` (snake_case)
- `web-extension/scripts/background.js` (line 56):
  `chrome.storage.local.set({ mediaBlurred: count })`
- `web-extension/popup/popup.js` (line 9):
  `chrome.storage.local.get(['blurredCount', 'trapsBlocked'], ...)`
  - Reads `blurredCount` which is never set; display stays at `0`.
- `web-extension/pages/warning.html`:
  - Contains inline `<script>` looking for `targetUrl`.
  - Does NOT link `pages/warning.js`.
  - `pages/warning.js` references `blocked-target-url`, `btn-go-back`, `btn-report-trap` which are absent from `warning.html`.

### O10: Existing Test Command Execution
- Running `npm test` runs:
  `node tools/test-banglish-filter.js && node tools/test-trap-detector.js && node backend/test-backend.js`
- All three scripts passed (10/10 trap tests, 7/7 banglish tests, 6/6 backend tests).
- Zero tests in `npm test` cover Pillar 3 (R3) or platform-specific clickbait for Pillar 1 (R1).

---

## 2. Logic Chain

1. **L1 (from O2):** Because `extractHostname` does not parse redirect query parameters (such as `q` on YouTube or `u` on Facebook and Instagram), any link wrapped by a platform redirect service is treated as an internal or allowed domain. Therefore, the trap interceptor is non-functional on outbound YouTube, Facebook, and Instagram links that use link shims.
2. **L2 (from O3):** Because `hostMatches` assumes gambling brand patterns only appear as exact matches, prefixes (`pattern-`), or suffixes followed by digits, domain variants with brand infixes or letter suffixes (`bd-1xbet.com`, `babu88live.com`) evaluate to false, leaving mirror gambling operations unblocked.
3. **L3 (from O4 & O10):** Because `tools/test-trap-detector.js` duplicates the code in an isolated file without testing `trap-link-interceptor.js`, passing `npm test` gives false confidence about extension health and leaves YouTube/TikTok/Facebook clickbait acceptance criteria unverified.
4. **L4 (from O5 & O6):** Because `ai-vision-blur.js` uses only an RGB skin color heuristic without an on-device AI model, and because cross-origin images throw tainted canvas errors that are caught and ignored, the engine cannot reliably or accurately classify social media images in production.
5. **L5 (from O7):** Because `ai-vision-blur.js` blurs all `<video>` tags unconditionally, it degrades user experience on educational, news, and everyday video consumption.
6. **L6 (from O8 & O10):** Because no benchmark exists that measures image classification latency against a 150ms limit or verifies `.shuddho-blurred-media` and `.shuddho-shield-badge` overlay application, Acceptance Criterion 3 is completely unmet.
7. **L7 (from O9):** Because the message action name and storage key names are mismatched across `ai-vision-blur.js`, `background.js`, and `popup.js`, the blur statistics tracking is broken in the user interface.

---

## 3. Caveats

- **No Caveats.** Every source file, test script, backend file, and extension asset in the workspace relevant to R1 and R3 was directly viewed, executed, and cross-referenced with `ORIGINAL_REQUEST.md`.

---

## 4. Conclusion

1. **R1 Status (60%):** The static foundation of R1 exists (domain lists, Banglish/English keywords, in-page warning modal). However, it is **vulnerable to platform redirect wrapping bypasses** (YouTube, Facebook, Instagram) and **brand variation bypasses** (e.g. `bd-1xbet`, `babu88live`). The test suite does not cover platform clickbait patterns.
2. **R3 Status (25%):** R3 has **no on-device AI model**, relying solely on a fragile RGB skin heuristic. It suffers from **canvas cross-origin taint errors**, **indiscriminate 100% video blurring**, and **zero automated synthetic image benchmarks** or latency verification.
3. **Actionable Implementation Steps for Next Agents:**
   - **For R1:** Implement recursive URL redirect unwrapping (`youtube.com/redirect?q=...`, `l.facebook.com/l.php?u=...`, `l.instagram.com/?u=...`), harden domain matching for betting mirrors, modularize the interceptor engine for direct import in tests, and expand `test-trap-detector.js` to cover platform clickbait fixtures.
   - **For R3:** Implement a lightweight on-device visual safety classifier pipeline (<150ms execution), fix the video blanket blur, resolve cross-origin image handling, implement `IntersectionObserver` viewport scrolling virtualization, and build an automated synthetic image benchmark suite (`tools/test-nsfw-blur-engine.js`) verifying <150ms latency and CSS overlay application.
   - **For Extension Wiring:** Fix message action (`media_blurred` vs `mediaBlurred`) and storage key (`mediaBlurred` vs `blurredCount`) naming mismatches, wire `warning.js` into `warning.html`, and synchronize/consolidate `extension/` and `web-extension/`.

---

## 5. Verification Method

To independently verify these findings, an agent or engineer can execute:

1. **Verify Directory Duplication:**
   ```powershell
   git diff --no-index extension web-extension
   ```
   *Expected:* Exit code 0, no file differences.

2. **Inspect Current Test Suite Execution:**
   ```powershell
   npm test
   ```
   *Expected:* Runs 3 scripts (Banglish, trap, backend). Notice absence of R3 benchmarks.

3. **Verify YouTube/Facebook Bypass via Node:**
   Evaluate in Node:
   ```javascript
   const u = new URL("https://www.youtube.com/redirect?q=https%3A%2F%2F1xbet-bd.com");
   console.log(u.hostname); // "www.youtube.com" -> Not blocked!
   ```

4. **Inspect `ai-vision-blur.js` Video Blanket Blur:**
   View lines 115-118 in `web-extension/scripts/ai-vision-blur.js` to confirm unconditional `applyBlur(node)` on `<video>` tags.

5. **Inspect Naming Discrepancies:**
   Compare `web-extension/scripts/ai-vision-blur.js:92` (`mediaBlurred`), `web-extension/scripts/background.js:53` (`media_blurred`), `web-extension/scripts/background.js:56` (`mediaBlurred`), and `web-extension/popup/popup.js:9` (`blurredCount`).
