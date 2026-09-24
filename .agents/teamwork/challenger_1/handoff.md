# Empirical Verification & Adversarial Stress Handoff Report

**Agent**: Challenger 1 (critic, specialist)  
**Target Project**: Shuddho Guard (Pillar 1: Trap-Link Interceptor & Pillar 3: AI NSFW Blur Engine)  
**Parent Conversation ID**: `1568080f-3592-4965-a008-57d3138f1150`  
**Test Harness**: `c:\Users\assdi\Documents\Downloads\shuddho-guard\tools\adversarial-stress-challenger1.js`  
**Date**: 2026-09-24  

---

## 1. Observation

Direct execution of the empirical verification suite was performed via:
`node tools/adversarial-stress-challenger1.js`

### Quantitative Metrics Summary
- **Total Empirical Assertions Executed**: 54
- **Passed Checks**: 38
- **Failed Checks / Uncovered Vulnerability Findings**: 16
- **False Positive Benchmark on Legitimate Domains**: 0 false positives out of 131 tested domains (**0.00% False Positive Rate** across Bangladesh Government, Global Government, Academia, Reputable News, Developer & Cloud platforms).
- **Latency Benchmark (1,000 Rapid-Fire Classifications)**:
  - Total Time: 155.00 ms for 1,000 invocations
  - Throughput: 6,452 classifications/second
  - Minimum Latency: 0.021 ms
  - Mean Latency: 0.155 ms
  - Median (P50): 0.125 ms
  - 90th Percentile (P90): 0.276 ms
  - 95th Percentile (P95): 0.345 ms
  - **99th Percentile (P99): 0.524 ms** (Exceeds acceptance threshold of `< 150 ms` by over 286x).
  - Maximum Latency: 0.966 ms

---

### Detailed Empirical Observations & Verbatim Tool Output

#### Finding 1: Redirect Depth Limit Bypass
- **Command & Output**:
  ```
  [FAIL] [Nested Redirects] 6-layer deep nested redirect (Exceeds default maxDepth=5) -> Blocked: false, Unwrapped: https://www.youtube.com/redirect?q=https://1xbet.com
  ```
- **Code Reference**: `web-extension/scripts/trap-link-interceptor.js:64`:
  ```javascript
  function unwrapUrl(rawUrl, maxDepth = 5) {
  ```
- **Observed Behavior**: Redirect chains nested 6 or more layers deep stop unwrapping at depth 5, leaving the inner gambling URL (`1xbet.com`) wrapped inside the safe outer wrapper (`youtube.com/redirect`), allowing malicious links to escape interception.

#### Finding 2: Multi-Layer Encoding Bypass
- **Command & Output**:
  ```
  [FAIL] [Encoding & Params] Triple URL encoding (%25252F) -> Blocked: false, Target: https%3A%2F%2F1xbet.com
  ```
- **Code Reference**: `web-extension/scripts/trap-link-interceptor.js:139-142`:
  ```javascript
  try {
      extracted = decodeURIComponent(extracted);
  } catch (e) {
  ```
- **Observed Behavior**: `decodeURIComponent` executes only once per depth iteration. When an adversary triple-encodes a link (`%25252F`), one unwrap pass leaves `%2F`, which causes standard URL parsers to parse `https%3A%2F%2F1xbet.com` as an invalid host or treat `%2F` as part of the domain name label, preventing brand identification.

#### Findings 3 & 4: Mixed-Case Query Parameter Bypass
- **Command & Output**:
  ```
  [FAIL] [Encoding & Params] Mixed-case query param in YouTube (?Q= instead of ?q=) -> Blocked: false, Target: https://www.youtube.com/redirect?Q=https%3A%2F%2F1xbet.com
  [FAIL] [Encoding & Params] Mixed-case query param in Facebook (?U= instead of ?u=) -> Blocked: false, Target: https://l.facebook.com/l.php?U=https%3A%2F%2F1win.pro
  ```
- **Code Reference**: `web-extension/scripts/trap-link-interceptor.js:85-95`:
  ```javascript
  if (parsed.pathname.includes('/redirect') || parsed.searchParams.has('q')) {
      extracted = parsed.searchParams.get('q') || parsed.searchParams.get('url');
  }
  ...
  if (parsed.searchParams.has('u')) {
      extracted = parsed.searchParams.get('u');
  ```
- **Observed Behavior**: WHATWG `URL.searchParams.has()` is strictly case-sensitive. Changing `?q=` to `?Q=` or `?u=` to `?U=` evades parameter extraction completely, leaving the link unblocked.

#### Finding 5: Omission of Common Redirect Parameters
- **Command & Output**:
  ```
  [FAIL] [Encoding & Params] Unusual redirect parameter ?next=https://1xbet.com -> Blocked: false, Target: https://example.com/auth?next=https%3A%2F%2F1xbet.com
  ```
- **Code Reference**: `web-extension/scripts/trap-link-interceptor.js:126`:
  ```javascript
  const redirectParams = ['target', 'target_url', 'dest', 'destination', 'redirect', 'redirect_url', 'url', 'u', 'link', 'to', 'q'];
  ```
- **Observed Behavior**: Common OAuth/redirect parameters such as `next`, `return`, `return_url`, `forward`, `goto`, and `r` are not checked in `redirectParams`.

#### Findings 6, 7, 8, 9, 10: Hyphen-Split and Permuted Betting Brand Bypasses
- **Command & Output**:
  ```
  [FAIL] [Brand Permutations] Hyphen split within brand name (1x-bet.com) -> Blocked: false (Expected: true)
  [FAIL] [Brand Permutations] Hyphen split within babu88 (babu-88.com) -> Blocked: false (Expected: true)
  [FAIL] [Brand Permutations] Number spelled out (one-xbet.com) -> Blocked: false (Expected: true)
  [FAIL] [Brand Permutations] Hyphenated 1-win (1-win.com) -> Blocked: false (Expected: true)
  [FAIL] [Brand Permutations] Extended betting suffix (1xbetting-pro.com) -> Blocked: false (Expected: true)
  ```
- **Code Reference**: `web-extension/scripts/trap-link-interceptor.js:223-224`:
  ```javascript
  const tokens = label.split(/[-_]+/);
  if (tokens.includes(brand)) return true;
  ```
- **Observed Behavior**: Splitting hostname labels on `[-_]+` breaks compound brand names like `1x-bet` into `['1x', 'bet']` and `babu-88` into `['babu', '88']`. Neither token equals `1xbet` or `babu88`, allowing hyphenated mirrors to slip through without detection.

#### Findings 11 & 12: Telegram Invite and Deep Link Bypasses
- **Command & Output**:
  ```
  [FAIL] [Telegram Traps] URL-encoded plus symbol in invite (t.me/%2BAbCdEf123 + "গোপন ভাইরাল ভিডিও") -> Blocked: false (Expected: true)
  [FAIL] [Telegram Traps] Telegram deep link join (tg://join?invite=babu88_vip) -> Blocked: false (Expected: true)
  ```
- **Code Reference**: `web-extension/scripts/trap-link-interceptor.js:262-263, 286`:
  ```javascript
  const hostname = extractHostname(lowerUrl);
  const isTg = TELEGRAM_DOMAINS.some(d => hostMatches(hostname, d));
  ...
  const isInvitePattern = lowerUrl.includes('/+') || lowerUrl.includes('/joinchat/');
  ```
- **Observed Behavior**: 
  1. The invite pattern check looks for literal `/+` and `/joinchat/`. When the `+` is percent-encoded as `%2B` or `%2b`, `lowerUrl.includes('/+')` evaluates to `false`.
  2. For `tg://join?invite=...`, `extractHostname()` returns `join`, which is not present in `TELEGRAM_DOMAINS = ['t.me', 'telegram.me', 'telegram.dog']`, bypassing Telegram trap classification.

#### Findings 13, 14, 15: Heuristic Skin Lookalike False Positives (Pillar 3)
- **Command & Output**:
  ```
  [FAIL] [Skin Lookalikes] Warm mahogany/teak wood grain (high texture edge gradient) -> Result: NSFW (Score: 1.000, SkinRatio: 100.0%)
  [FAIL] [Skin Lookalikes] Terracotta clay sculpture & pottery -> Result: NSFW (Score: 1.000, SkinRatio: 100.0%)
  [FAIL] [Skin Lookalikes] Peach painted interior wall -> Result: NSFW (Score: 1.000, SkinRatio: 100.0%)
  ```
- **Code Reference**: `web-extension/scripts/ai-vision-blur.js:362-378`:
  ```javascript
  let score = 0;
  score += Math.min(skinRatio * 1.3, 0.45);
  score += Math.min(largestClusterRatio * 1.5, 0.40);
  if (majorClustersRatio >= 0.25) {
      score += Math.min((majorClustersRatio - 0.25) * 1.0, 0.20);
  }
  ```
- **Observed Behavior**: Uniform peach/salmon flat color fields (e.g. painted walls or graphics) fall within the human melanin YCbCr/HSV bounding box. Because the surface is smooth, edge variance is 0, so no texture penalty is deducted, driving the NSFW heuristic score to 1.000 (100% false positive). Warm mahogany wood and terracotta clay also trigger false positive NSFW scores if texture edge density falls below the 0.25 threshold.

#### Finding 16: Absence of DOM Mutation Watchdog & WeakSet Re-evaluation Block
- **Command & Output**:
  ```
  [PASS] [Overlay Robustness] VULNERABILITY CHECK: Direct removal of .shuddho-blurred-media by host script leaves media unblurred (Absence of Attribute Watchdog) -> Confirmed: Media remains exposed once .shuddho-blurred-media class is removed by page script
  [PASS] [Overlay Robustness] VULNERABILITY CHECK: Removal of .shuddho-shield-badge leaves badge detached without automatic re-injection (Absence of Subtree Child Watchdog) -> Confirmed: Badge is permanently removed once deleted from DOM
  [FAIL] [Overlay Robustness] VULNERABILITY CHECK: scannedElements WeakSet permanently caches element, preventing re-blurring after DOM tamper -> Confirmed: scannedElements.has(testMedia) is true, skipping any subsequent scanning
  ```
- **Code Reference**: `web-extension/scripts/ai-vision-blur.js:516, 825`:
  ```javascript
  if (!img || scannedElements.has(img)) return;
  ...
  domObserver.observe(document.body, { childList: true, subtree: true });
  ```
- **Observed Behavior**:
  1. The `MutationObserver` on line 825 only listens for `childList` additions (`mutation.addedNodes`). It does not observe `attributes: true` (e.g. `attributeFilter: ['class', 'style']`) on media elements.
  2. If an adversarial script on the webpage removes `.shuddho-blurred-media` or deletes `.shuddho-shield-badge`, no watchdog detects or restores it.
  3. Because the element was added to `scannedElements` (WeakSet), any future re-scan immediately returns without taking action.

---

## 2. Logic Chain

1. **Premise 1 (R1 & R3 Requirements)**: ORIGINAL_REQUEST.md and orchestrator PROJECT.md specify that Pillar 1 must robustly intercept malicious betting/adult/Telegram redirect chains across social media platforms, while maintaining zero false positives on legitimate sites, and Pillar 3 must scan and blur explicit media within 150 ms with verifiable CSS/DOM overlays.
2. **Step 2 (Empirical Redirect Testing)**: We constructed multi-tier redirect chains simulating real-world clickbait on YouTube, Facebook, and Instagram. Testing depths 1 through 5 confirmed 100% successful unwrapping and blocking. However, when depth was increased to 6 layers, the interceptor aborted due to `maxDepth = 5`, leaving the payload active.
3. **Step 3 (Parameter & Encoding Sensitivity)**: Analysis of WHATWG URL parsing indicated that query parameters are case-sensitive. Testing `?Q=` and `?U=` confirmed that parameter extraction returned `null`, allowing wrapped targets to bypass unwrapping. Similarly, triple URL encoding (`%25252F`) bypassed single-pass decoding.
4. **Step 4 (Domain Permutations)**: Splitting hostname labels by `[-_]+` was found to inadvertently fragment hyphenated brand names (e.g. `1x-bet`, `babu-88`, `1-win`), preventing token equality checks against `GAMBLING_BRANDS`.
5. **Step 5 (Legitimate URL Baseline)**: A high-volume benchmark of 131 real-world domains across Bangladesh Government, Global Government, Academia, Reputable News, and Developer platforms resulted in 0 false positives (0.00% FP rate), demonstrating that the current domain whitelist and prefix matching are safe for legitimate browsing.
6. **Step 6 (Latency SLA Compliance)**: Burst-testing 1,000 classifications demonstrated a P99 latency of 0.524 ms and a maximum latency of 0.966 ms. This conclusively satisfies the R3 acceptance criterion of `< 150 ms` latency per media element.
7. **Step 7 (DOM Overlay Watchdog Vulnerability)**: Examining `ai-vision-blur.js` revealed that `MutationObserver` only tracks new DOM node insertions, omitting attribute changes and child deletions. Direct test execution verified that removing `.shuddho-blurred-media` or removing `.shuddho-shield-badge` leaves the media unblurred permanently because `scannedElements.has(el)` prevents re-scanning.

---

## 3. Caveats

- **Caveat 1**: Image classification was tested using programmatically generated synthetic images in Node.js canvas simulation conforming to the evaluation pipeline (64x64 YCbCr/HSV feature space). While synthetic models accurately exercise the multi-color-space and texture algorithms, real-world deep neural network inference on raw JPEG photos with varying color profiles may show subtle distributional differences.
- **Caveat 2**: Testing was focused strictly on Pillar 1 (Trap-Link Interceptor) and Pillar 3 (AI NSFW Blur Engine) as instructed. Pillar 2 (PureGram) and Pillar 4 (Android Watchdog) are under the purview of Challenger 2 and other team specialists.
- **Caveat 3**: In accordance with the Challenger role constraint ("Review-only — do NOT modify implementation code"), no production files were altered. All tests are non-destructive and isolated in `tools/adversarial-stress-challenger1.js`.

---

## 4. Conclusion

- **Verdict on Acceptance Criteria**:
  - **Pillar 1 (R1 - Trap-Link Interceptor)**: **PARTIALLY HARDENED**. Core functionality successfully blocks standard platform redirects on YouTube, Facebook, TikTok, and Instagram with **0.00% false positive rate** across 131 legitimate domains. However, it is vulnerable to 5 specific evasion techniques: >5 nested redirect chains, triple URL encoding, mixed-case query parameters (`?Q=`, `?U=`), hyphen-split betting brands (`1x-bet`, `babu-88`, `1-win`), and encoded Telegram invite links (`%2B`).
  - **Pillar 3 (R3 - AI NSFW Blur Engine)**: **LATENCY COMPLIANT, HEURISTIC & WATCHDOG VULNERABILITIES IDENTIFIED**. Latency performance is exceptional (**P99 = 0.524 ms**, well within the 150 ms requirement). Clothed portraits and turtleneck/hijab headshots are correctly protected. However, uniform peach surfaces falsely trigger NSFW classification (100% score), and host page scripts can easily bypass visual blur by removing `.shuddho-blurred-media` due to the absence of an attribute mutation watchdog.

- **Actionable Mitigations for Worker Agents**:
  1. *Pillar 1*: Increase `maxDepth` to 8 or iterate until a fixed-point URL is reached. Add case-insensitive query parameter lookups (e.g. iterating `parsed.searchParams.keys()` in lowercase). Strip hyphens when checking brand tokens (`label.replace(/[-_]/g, '')`). URL-decode Telegram path strings before checking for `+` and `joinchat`.
  2. *Pillar 3*: Add an edge count / spatial entropy threshold so that flat, untextured peach/salmon fields are not treated as human flesh.
  3. *Pillar 3 DOM Watchdog*: Attach a `MutationObserver` to blurred media elements listening to `{ attributes: true, attributeFilter: ['class', 'style'] }` that automatically re-adds `.shuddho-blurred-media` if stripped, and allow re-evaluation if the blur class is externally removed.

---

## 5. Verification Method

To independently reproduce all 54 empirical tests and verify every finding documented in this report:

1. **Run the Challenger 1 Test Suite**:
   ```powershell
   node tools/adversarial-stress-challenger1.js
   ```
2. **Run the Project Baseline Test Suites**:
   ```powershell
   node tools/test-trap-detector.js
   node tools/test-nsfw-blur-engine.js
   ```
3. **Files to Inspect**:
   - `tools/adversarial-stress-challenger1.js` (empirical test code and generator functions)
   - `web-extension/scripts/trap-link-interceptor.js` (lines 64, 85-95, 126, 223, 262, 286)
   - `web-extension/scripts/ai-vision-blur.js` (lines 362-378, 516, 807-826)

**Invalidation Conditions**:
This handoff report is invalidated if a subsequent agent modifies `trap-link-interceptor.js` or `ai-vision-blur.js` such that running `node tools/adversarial-stress-challenger1.js` produces 0 failed checks or alters the latency profile.
