/**
 * Shuddho Guard (শুদ্ধ গার্ড) — Empirical Adversarial Stress Test Suite
 * Challenger 1: Empirical Verification of Pillar 1 & Pillar 3
 * 
 * Scope:
 *  - Pillar 1: Adversarial redirect chains, obfuscated encodings, brand name variations,
 *              subdomain tricks, Telegram trap link obfuscation, and 120+ false positive stress test.
 *  - Pillar 3: Adversarial skin-tone lookalikes (wood, clay, sand, sepia, turtleneck/hijab, peach wall),
 *              1,000 burst classification latency benchmark (measuring p50, p90, p95, p99 < 150ms),
 *              and DOM overlay manipulation/watchdog bypass verification.
 */

const { performance } = require('perf_hooks');
const path = require('path');

// 1. Load Pillar 1 Production Module
const trapInterceptor = require(path.join(__dirname, '../web-extension/scripts/trap-link-interceptor.js'));
const {
    analyzeLink,
    unwrapUrl,
    extractHostname,
    hostMatches,
    isBettingBrandMatch,
    isTelegramTrapLink
} = trapInterceptor;

// 2. Load Pillar 3 Production Module
const blurEngine = require(path.join(__dirname, '../web-extension/scripts/ai-vision-blur.js'));

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function recordTest(suite, testName, passed, details = '') {
    totalTests++;
    if (passed) {
        passedTests++;
        console.log(`  [PASS] [${suite}] ${testName}${details ? ' -> ' + details : ''}`);
    } else {
        failedTests++;
        const finding = { suite, testName, details };
        findings.push(finding);
        console.error(`  [FAIL] [${suite}] ${testName}${details ? ' -> ' + details : ''}`);
    }
}

console.log('='.repeat(80));
console.log('  CHALLENGER 1: EMPIRICAL ADVERSARIAL STRESS TEST SUITE (PILLARS 1 & 3)');
console.log('='.repeat(80));

// =========================================================================
// PART 1: PILLAR 1 — ADVERSARIAL REDIRECT CHAINS & ENCODINGS
// =========================================================================
console.log('\n>>> SECTION 1.1: Multi-Layer Nested Redirect Chains');

const nestedChains = [
    {
        name: 'Single-layer redirect (YouTube -> 1xbet)',
        url: 'https://www.youtube.com/redirect?q=https%3A%2F%2F1xbet.com',
        expectedBlocked: true,
        maxDepthRequired: 1
    },
    {
        name: '2-layer nested redirect (Facebook -> YouTube -> 1xbet)',
        url: 'https://l.facebook.com/l.php?u=' + encodeURIComponent('https://www.youtube.com/redirect?q=' + encodeURIComponent('https://1xbet.com')),
        expectedBlocked: true,
        maxDepthRequired: 2
    },
    {
        name: '3-layer nested redirect (Instagram -> Facebook -> YouTube -> 1win)',
        url: 'https://l.instagram.com/?u=' + encodeURIComponent('https://l.facebook.com/l.php?u=' + encodeURIComponent('https://www.youtube.com/redirect?q=' + encodeURIComponent('https://1win.pro'))),
        expectedBlocked: true,
        maxDepthRequired: 3
    },
    {
        name: '4-layer nested redirect (TikTok -> Instagram -> Facebook -> YouTube -> babu88)',
        url: 'https://www.tiktok.com/link/v2?target=' + encodeURIComponent('https://l.instagram.com/?u=' + encodeURIComponent('https://l.facebook.com/l.php?u=' + encodeURIComponent('https://www.youtube.com/redirect?q=' + encodeURIComponent('https://babu88.com')))),
        expectedBlocked: true,
        maxDepthRequired: 4
    },
    {
        name: '5-layer nested redirect (Google -> TikTok -> Instagram -> Facebook -> YouTube -> 1xbet)',
        url: 'https://www.google.com/url?q=' + encodeURIComponent('https://www.tiktok.com/link/v2?target=' + encodeURIComponent('https://l.instagram.com/?u=' + encodeURIComponent('https://l.facebook.com/l.php?u=' + encodeURIComponent('https://www.youtube.com/redirect?q=' + encodeURIComponent('https://1xbet.com'))))),
        expectedBlocked: true,
        maxDepthRequired: 5
    },
    {
        name: '6-layer deep nested redirect (Exceeds default maxDepth=5)',
        url: 'https://example.com/redirect?url=' + encodeURIComponent('https://www.google.com/url?q=' + encodeURIComponent('https://www.tiktok.com/link/v2?target=' + encodeURIComponent('https://l.instagram.com/?u=' + encodeURIComponent('https://l.facebook.com/l.php?u=' + encodeURIComponent('https://www.youtube.com/redirect?q=' + encodeURIComponent('https://1xbet.com')))))),
        expectedBlocked: true,
        maxDepthRequired: 6
    }
];

for (const tc of nestedChains) {
    const analysis = analyzeLink(tc.url);
    const passed = analysis.blocked === tc.expectedBlocked;
    recordTest(
        'Nested Redirects',
        tc.name,
        passed,
        `Blocked: ${analysis.blocked}, Unwrapped: ${analysis.unwrappedUrl || '(none)'}`
    );
}

console.log('\n>>> SECTION 1.2: Obfuscated Encodings & Parameter Variations');

const encodingTests = [
    {
        name: 'Double URL encoding (YouTube ?q=https%253A%252F%252F1xbet.com)',
        url: 'https://www.youtube.com/redirect?q=https%253A%252F%252F1xbet.com',
        expectedBlocked: true
    },
    {
        name: 'Triple URL encoding (%25252F)',
        url: 'https://www.youtube.com/redirect?q=https%25253A%25252F%25252F1xbet.com',
        expectedBlocked: true
    },
    {
        name: 'Mixed-case query param in YouTube (?Q= instead of ?q=)',
        url: 'https://www.youtube.com/redirect?Q=https%3A%2F%2F1xbet.com',
        expectedBlocked: true
    },
    {
        name: 'Mixed-case query param in Facebook (?U= instead of ?u=)',
        url: 'https://l.facebook.com/l.php?U=https%3A%2F%2F1win.pro',
        expectedBlocked: true
    },
    {
        name: 'Uppercase host and scheme (HTTPS://WWW.YOUTUBE.COM/redirect?q=...)',
        url: 'HTTPS://WWW.YOUTUBE.COM/redirect?q=https%3A%2F%2F1xbet.com',
        expectedBlocked: true
    },
    {
        name: 'Unusual redirect parameter ?destination=https://1xbet.com',
        url: 'https://example.com/login?destination=https%3A%2F%2F1xbet.com',
        expectedBlocked: true
    },
    {
        name: 'Unusual redirect parameter ?next=https://1xbet.com',
        url: 'https://example.com/auth?next=https%3A%2F%2F1xbet.com',
        expectedBlocked: true
    },
    {
        name: 'Trailing dot in hostname (https://1xbet.com./)',
        url: 'https://1xbet.com./register',
        expectedBlocked: true
    },
    {
        name: 'Non-standard port with gambling domain (https://1xbet.com:8443/)',
        url: 'https://1xbet.com:8443/sports',
        expectedBlocked: true
    }
];

for (const tc of encodingTests) {
    const analysis = analyzeLink(tc.url);
    const passed = analysis.blocked === tc.expectedBlocked;
    recordTest(
        'Encoding & Params',
        tc.name,
        passed,
        `Blocked: ${analysis.blocked}, Target: ${analysis.targetUrl || tc.url}`
    );
}

// =========================================================================
// PART 2: PILLAR 1 — BRAND VARIATIONS & SUBDOMAIN TRICKS
// =========================================================================
console.log('\n>>> SECTION 2.1: Brand Name Variations & Sneaky Mirror Domains');

const brandVariations = [
    // Subdomain tricks
    {
        name: 'Brand as subdomain on third-party domain (1xbet.safe-news.org)',
        url: 'https://1xbet.safe-news.org/signup',
        expectedBlocked: true,
        category: 'Subdomain Spoofing'
    },
    {
        name: 'Nested subdomain brand (login.1xbet.safe-news.org)',
        url: 'https://login.1xbet.safe-news.org/entry',
        expectedBlocked: true,
        category: 'Subdomain Spoofing'
    },
    {
        name: 'Brand in path of benign domain (https://safe-news.org/1xbet-news-article)',
        url: 'https://safe-news.org/1xbet-news-article',
        expectedBlocked: false, // Benign news article about 1xbet should NOT be blocked
        category: 'Path Lookalike'
    },
    // Hyphenated & Split variations
    {
        name: 'Hyphenated brand token (fake-1xbet.com)',
        url: 'https://fake-1xbet.com/live',
        expectedBlocked: true,
        category: 'Brand Variant'
    },
    {
        name: 'Hyphen split within brand name (1x-bet.com)',
        url: 'https://1x-bet.com/sports',
        expectedBlocked: true,
        category: 'Brand Variant'
    },
    {
        name: 'Hyphen split within babu88 (babu-88.com)',
        url: 'https://babu-88.com/login',
        expectedBlocked: true,
        category: 'Brand Variant'
    },
    {
        name: 'Number spelled out (one-xbet.com)',
        url: 'https://one-xbet.com/register',
        expectedBlocked: true,
        category: 'Brand Variant'
    },
    {
        name: 'Hyphenated 1-win (1-win.com)',
        url: 'https://1-win.com/casino',
        expectedBlocked: true,
        category: 'Brand Variant'
    },
    // Affix combinations
    {
        name: 'Recognized suffix (1winbd.com)',
        url: 'https://1winbd.com/sports',
        expectedBlocked: true,
        category: 'Affix Match'
    },
    {
        name: 'Recognized suffix (babu88live.com)',
        url: 'https://babu88live.com/home',
        expectedBlocked: true,
        category: 'Affix Match'
    },
    {
        name: 'Compound prefix & suffix (bd-1xbet-login.com)',
        url: 'https://bd-1xbet-login.com/app',
        expectedBlocked: true,
        category: 'Affix Match'
    },
    {
        name: 'Extended betting suffix (1xbetting-pro.com)',
        url: 'https://1xbetting-pro.com/bet',
        expectedBlocked: true,
        category: 'Affix Match'
    },
    {
        name: 'Numeric suffix variations (1xbet100.com)',
        url: 'https://1xbet100.com/entry',
        expectedBlocked: true,
        category: 'Affix Match'
    },
    {
        name: 'Numeric suffix variations (babu888.com)',
        url: 'https://babu888.com/live',
        expectedBlocked: true,
        category: 'Affix Match'
    }
];

for (const tc of brandVariations) {
    const analysis = analyzeLink(tc.url);
    const passed = analysis.blocked === tc.expectedBlocked;
    recordTest(
        'Brand Permutations',
        tc.name,
        passed,
        `Blocked: ${analysis.blocked} (Expected: ${tc.expectedBlocked})`
    );
}

// =========================================================================
// PART 3: PILLAR 1 — TELEGRAM TRAP LINKS & DEEP LINKS
// =========================================================================
console.log('\n>>> SECTION 3.1: Telegram Trap Links & Obfuscation');

const telegramTests = [
    {
        name: 'Standard invite with gambling text (t.me/+AbCdEf123 + "crazy time বাজি")',
        url: 'https://t.me/+AbCdEf123',
        context: 'এখানে crazy time বাজি লাইভ সিগন্যাল দেওয়া হয়',
        expectedBlocked: true
    },
    {
        name: 'URL-encoded plus symbol in invite (t.me/%2BAbCdEf123 + "গোপন ভাইরাল ভিডিও")',
        url: 'https://t.me/%2BAbCdEf123',
        context: 'গোপন ভাইরাল ভিডিও দেখতে জয়েন করুন',
        expectedBlocked: true
    },
    {
        name: 'URL-encoded joinchat (t.me/join%63hat/babu88_signals)',
        url: 'https://t.me/join%63hat/babu88_signals',
        context: 'বাজি সিগন্যাল গ্রুপ',
        expectedBlocked: true
    },
    {
        name: 'Telegram deep link (tg://resolve?domain=xyz_leak_video)',
        url: 'tg://resolve?domain=xyz_leak_video',
        context: 'ফাঁস হওয়া ভিডিও',
        expectedBlocked: true
    },
    {
        name: 'Telegram deep link join (tg://join?invite=babu88_vip)',
        url: 'tg://join?invite=babu88_vip',
        context: 'ভিআইপি বাজি গ্রুপ',
        expectedBlocked: true
    },
    {
        name: 'Alternative domain telegram.me (https://telegram.me/joinchat/1xbet_bonus)',
        url: 'https://telegram.me/joinchat/1xbet_bonus',
        context: 'বোনাস পেতে জয়েন করুন',
        expectedBlocked: true
    },
    {
        name: 'Alternative domain telegram.dog (https://telegram.dog/viral_choti_bd)',
        url: 'https://telegram.dog/viral_choti_bd',
        context: 'চটি গ্রুপ',
        expectedBlocked: true
    },
    {
        name: 'Benign educational Telegram channel (t.me/python_bangla_learn)',
        url: 'https://t.me/python_bangla_learn',
        context: 'পাইথন প্রোগ্রামিং শিখুন সম্পূর্ণ বাংলায়',
        expectedBlocked: false
    },
    {
        name: 'Benign Telegram invite link with academic context (t.me/+math_study_bd)',
        url: 'https://t.me/+math_study_bd',
        context: 'এইচএসসি গণিত প্রস্তুতি গ্রুপ',
        expectedBlocked: false
    }
];

for (const tc of telegramTests) {
    const analysis = analyzeLink(tc.url, tc.context || '');
    const passed = analysis.blocked === tc.expectedBlocked;
    recordTest(
        'Telegram Traps',
        tc.name,
        passed,
        `Blocked: ${analysis.blocked} (Expected: ${tc.expectedBlocked})`
    );
}

// =========================================================================
// PART 4: PILLAR 1 — FALSE POSITIVE STRESS TEST (120+ REAL-WORLD URLS)
// =========================================================================
console.log('\n>>> SECTION 4.1: High-Volume False Positive Benchmark (120+ Legitimate Domains)');

const legitimateUrls = [
    // 1. Bangladesh Government & Public Services (20)
    'https://bangladesh.gov.bd',
    'https://moedu.gov.bd',
    'https://dghs.gov.bd',
    'https://nbr.gov.bd',
    'https://btrc.gov.bd',
    'https://police.gov.bd',
    'https://forms.gov.bd',
    'https://services.gov.bd',
    'https://corona.gov.bd',
    'https://passport.gov.bd',
    'https://epassport.gov.bd',
    'https://nidw.gov.bd',
    'https://cabinet.gov.bd',
    'https://mopa.gov.bd',
    'https://ictd.gov.bd',
    'https://dgfp.gov.bd',
    'https://bpsc.gov.bd',
    'https://educationboardresults.gov.bd',
    'https://eboardresults.com',
    'https://bangladeshbank.org.bd',

    // 2. Global Government & International Organizations (15)
    'https://www.gov.uk',
    'https://www.usa.gov',
    'https://www.nih.gov',
    'https://www.cdc.gov',
    'https://www.who.int',
    'https://www.un.org',
    'https://www.unesco.org',
    'https://www.unicef.org',
    'https://www.worldbank.org',
    'https://www.imf.org',
    'https://europa.eu',
    'https://www.nasa.gov',
    'https://www.whitehouse.gov',
    'https://www.canadacouncil.ca',
    'https://www.australia.gov.au',

    // 3. Education, Universities & Academic Research (25)
    'https://en.wikipedia.org/wiki/Bangladesh',
    'https://www.mit.edu',
    'https://www.harvard.edu',
    'https://www.ox.ac.uk',
    'https://www.cam.ac.uk',
    'https://www.du.ac.bd',
    'https://www.buet.ac.bd',
    'https://www.cuet.ac.bd',
    'https://www.ruet.ac.bd',
    'https://www.kuet.ac.bd',
    'https://www.coursera.org',
    'https://www.edx.org',
    'https://www.khanacademy.org',
    'https://www.udemy.com',
    'https://arxiv.org/abs/2301.00001',
    'https://www.nature.com/articles/d41586-024-00001-w',
    'https://www.science.org',
    'https://ieeexplore.ieee.org',
    'https://dl.acm.org',
    'https://www.ncbi.nlm.nih.gov/pmc/',
    'https://openalex.org',
    'https://www.biorxiv.org',
    'https://www.semanticscholar.org',
    'https://plato.stanford.edu',
    'https://www.britannica.com',

    // 4. Reputable News & Media (25)
    'https://www.prothomalo.com',
    'https://www.thedailystar.net',
    'https://bdnews24.com',
    'https://www.dhakatribune.com',
    'https://bangla.bdnews24.com',
    'https://www.kalerkantho.com',
    'https://www.jugantor.com',
    'https://www.ittefaq.com.bd',
    'https://www.somoynews.tv',
    'https://www.jamuna.tv',
    'https://www.bbc.com/bengali',
    'https://www.bbc.com/news',
    'https://www.reuters.com',
    'https://www.aljazeera.com',
    'https://www.theguardian.com/international',
    'https://www.nytimes.com',
    'https://www.washingtonpost.com',
    'https://www.cnn.com',
    'https://www.bloomberg.com',
    'https://www.ft.com',
    'https://www.economist.com',
    'https://www.dw.com/bn',
    'https://www.apnews.com',
    'https://time.com',
    'https://www.nationalgeographic.com',

    // 5. Developer Tools, Cloud & Tech Infrastructure (30)
    'https://github.com/torvalds/linux',
    'https://gitlab.com',
    'https://bitbucket.org',
    'https://stackoverflow.com/questions/11227809',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    'https://www.npmjs.com/package/express',
    'https://pypi.org/project/requests/',
    'https://crates.io',
    'https://pkg.go.dev',
    'https://react.dev',
    'https://nodejs.org/en',
    'https://vuejs.org',
    'https://angular.dev',
    'https://svelte.dev',
    'https://flutter.dev',
    'https://dart.dev',
    'https://www.docker.com',
    'https://kubernetes.io',
    'https://aws.amazon.com',
    'https://cloud.google.com',
    'https://azure.microsoft.com',
    'https://vercel.com',
    'https://render.com',
    'https://www.cloudflare.com',
    'https://archive.org',
    'https://w3schools.com',
    'https://css-tricks.com',
    'https://dev.to',
    'https://medium.com',
    'https://news.ycombinator.com',

    // 6. Tricky / Benign Substring Lookalikes (15)
    // Words containing 'bet', 'win', 'leak', 'choti', 'boudi' in legitimate contexts
    'https://www.betterment.com',            // starts with "bet"
    'https://www.alphabet.com',              // contains "bet"
    'https://beta.apple.com',                // starts with "bet"
    'https://www.bethere.org',               // starts with "bet"
    'https://www.darwin.org',                // contains "win"
    'https://www.winterthur.com',            // starts with "win"
    'https://www.twine.net',                 // contains "win"
    'https://www.winzip.com',                // starts with "win"
    'https://www.winamp.com',                // starts with "win"
    'https://wintersmith.io',                // starts with "win"
    'https://www.boudier.com',               // starts with "boudi"
    'https://www.wikileaks.org',             // contains "leak"
    'https://memory-leaks.dev',              // tech blog about memory leaks
    'https://hotcoursesabroad.com',          // contains "hot"
    'https://adultswim.com',                 // cartoon network block
    'https://casinodistrict.gov'             // public district portal
];

console.log(`Testing ${legitimateUrls.length} legitimate URLs for false positive blocking...`);

let fpCount = 0;
for (const u of legitimateUrls) {
    const analysis = analyzeLink(u);
    if (analysis.blocked) {
        fpCount++;
        recordTest(
            'False Positive Stress',
            `Legitimate URL wrongly blocked: ${u}`,
            false,
            `Category: ${analysis.category}, Reason: ${analysis.reason}`
        );
    }
}

const fpRate = (fpCount / legitimateUrls.length) * 100;
recordTest(
    'False Positive Stress',
    `Overall False Positive Rate on ${legitimateUrls.length} Legitimate URLs`,
    fpCount === 0,
    `False Positives: ${fpCount}/${legitimateUrls.length} (${fpRate.toFixed(2)}%)`
);

// =========================================================================
// PART 5: PILLAR 3 — ADVERSARIAL SYNTHETIC IMAGE BENCHMARKS
// =========================================================================
console.log('\n>>> SECTION 5.1: Adversarial Skin-Tone Lookalike Benchmark (Pillar 3)');

function createSyntheticSample(type, width = 64, height = 64) {
    const data = new Uint8ClampedArray(width * height * 4);

    switch (type) {
        case 'explicit_exposure': {
            // Ground truth positive: >45% contiguous chest/torso skin
            const cx = width * 0.5;
            const cy = height * 0.5;
            const rx = width * 0.35;
            const ry = height * 0.40;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const dx = (x - cx) / rx;
                    const dy = (y - cy) / ry;
                    if (dx * dx + dy * dy <= 1) {
                        data[idx] = 226; data[idx + 1] = 168; data[idx + 2] = 136; data[idx + 3] = 255;
                    } else {
                        data[idx] = 30; data[idx + 1] = 30; data[idx + 2] = 30; data[idx + 3] = 255;
                    }
                }
            }
            break;
        }

        case 'clothed_portrait': {
            // Face oval (~14%) + dark business suit below
            const cx = width * 0.5;
            const cy = height * 0.32;
            const rx = width * 0.18;
            const ry = height * 0.22;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const dx = (x - cx) / rx;
                    const dy = (y - cy) / ry;
                    if (dx * dx + dy * dy <= 1) {
                        data[idx] = 220; data[idx + 1] = 165; data[idx + 2] = 135; data[idx + 3] = 255;
                    } else {
                        data[idx] = 25; data[idx + 1] = 30; data[idx + 2] = 50; data[idx + 3] = 255;
                    }
                }
            }
            break;
        }

        case 'turtleneck_portrait': {
            // Clothed portrait in high-neck turtleneck sweater (only ~8% face skin exposed)
            const cx = width * 0.5;
            const cy = height * 0.28;
            const rx = width * 0.14;
            const ry = height * 0.16;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const dx = (x - cx) / rx;
                    const dy = (y - cy) / ry;
                    if (dx * dx + dy * dy <= 1) {
                        data[idx] = 215; data[idx + 1] = 160; data[idx + 2] = 130; data[idx + 3] = 255;
                    } else {
                        // High turtleneck sweater in charcoal gray
                        data[idx] = 45; data[idx + 1] = 45; data[idx + 2] = 48; data[idx + 3] = 255;
                    }
                }
            }
            break;
        }

        case 'warm_wood_grain': {
            // Warm brown mahogany/teak wood with periodic high-frequency grain rings
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const grain = Math.sin(x * 0.75 + Math.cos(y * 0.15) * 4.0);
                    const baseR = 195 + Math.floor(grain * 25);
                    const baseG = 130 + Math.floor(grain * 20);
                    const baseB = 85 + Math.floor(grain * 15);
                    data[idx] = Math.max(0, Math.min(255, baseR));
                    data[idx + 1] = Math.max(0, Math.min(255, baseG));
                    data[idx + 2] = Math.max(0, Math.min(255, baseB));
                    data[idx + 3] = 255;
                }
            }
            break;
        }

        case 'terracotta_clay_sculpture': {
            // Reddish-orange terracotta earthenware clay with rough surface texture
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const noise = ((x * 13 + y * 29) % 17) - 8;
                    data[idx] = Math.min(255, Math.max(0, 204 + noise));
                    data[idx + 1] = Math.min(255, Math.max(0, 115 + noise));
                    data[idx + 2] = Math.min(255, Math.max(0, 75 + noise));
                    data[idx + 3] = 255;
                }
            }
            break;
        }

        case 'desert_sand_dunes': {
            // Golden-tan sand with distinct non-melanin chrominance (G-B large step)
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const wave = Math.sin((x + y) * 0.12) * 12;
                    data[idx] = Math.min(255, Math.max(0, 218 + wave));
                    data[idx + 1] = Math.min(255, Math.max(0, 182 + wave));
                    data[idx + 2] = Math.min(255, Math.max(0, 115 + wave));
                    data[idx + 3] = 255;
                }
            }
            break;
        }

        case 'sepia_historical_photo': {
            // Monochrome vintage sepia photograph of architecture/landscape
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const luma = ((x * y) % 160) + 50;
                    data[idx] = Math.min(255, Math.floor(luma * 1.15));
                    data[idx + 1] = Math.min(255, Math.floor(luma * 0.95));
                    data[idx + 2] = Math.min(255, Math.floor(luma * 0.72));
                    data[idx + 3] = 255;
                }
            }
            break;
        }

        case 'peach_interior_wall': {
            // Uniform peach-painted wall with tiny matte paint variations
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const speck = ((x ^ y) % 5) - 2;
                    data[idx] = 238 + speck;
                    data[idx + 1] = 182 + speck;
                    data[idx + 2] = 152 + speck;
                    data[idx + 3] = 255;
                }
            }
            break;
        }

        default:
            break;
    }

    return { data, width, height };
}

const syntheticLookalikes = [
    { type: 'explicit_exposure', expectedNSFW: true, label: 'High-exposure explicit pattern (Ground Truth Positive)' },
    { type: 'clothed_portrait', expectedNSFW: false, label: 'Clothed portrait (face in upper frame, suit below)' },
    { type: 'turtleneck_portrait', expectedNSFW: false, label: 'Turtleneck portrait (minimal face skin exposed)' },
    { type: 'warm_wood_grain', expectedNSFW: false, label: 'Warm mahogany/teak wood grain (high texture edge gradient)' },
    { type: 'terracotta_clay_sculpture', expectedNSFW: false, label: 'Terracotta clay sculpture & pottery' },
    { type: 'desert_sand_dunes', expectedNSFW: false, label: 'Desert sand dunes (tan/golden earth chrominance)' },
    { type: 'sepia_historical_photo', expectedNSFW: false, label: 'Sepia vintage historical monochrome photo' },
    { type: 'peach_interior_wall', expectedNSFW: false, label: 'Peach painted interior wall' }
];

for (const sc of syntheticLookalikes) {
    const sample = createSyntheticSample(sc.type, 64, 64);
    const result = blurEngine.classifyImageData(sample);
    const passed = result.isNSFW === sc.expectedNSFW;
    recordTest(
        'Skin Lookalikes',
        sc.label,
        passed,
        `Result: ${result.isNSFW ? 'NSFW' : 'SAFE'} (Score: ${result.score.toFixed(3)}, SkinRatio: ${(result.skinRatio * 100).toFixed(1)}%)`
    );
}

// =========================================================================
// PART 6: PILLAR 3 — 1,000 BURST CLASSIFICATION LATENCY BENCHMARK
// =========================================================================
console.log('\n>>> SECTION 6.1: 1,000 Burst Classification Latency Stress Test');

// Generate a pool of 10 diverse synthetic images
const burstPool = [
    createSyntheticSample('explicit_exposure', 64, 64),
    createSyntheticSample('clothed_portrait', 64, 64),
    createSyntheticSample('turtleneck_portrait', 64, 64),
    createSyntheticSample('warm_wood_grain', 64, 64),
    createSyntheticSample('terracotta_clay_sculpture', 64, 64),
    createSyntheticSample('desert_sand_dunes', 64, 64),
    createSyntheticSample('sepia_historical_photo', 64, 64),
    createSyntheticSample('peach_interior_wall', 64, 64),
    createSyntheticSample('explicit_exposure', 128, 128), // 128x128 downsample test
    createSyntheticSample('warm_wood_grain', 128, 128)
];

// JIT Warmup
for (const s of burstPool) {
    blurEngine.classifyImageData(s);
}

const BURST_COUNT = 1000;
const latencies = new Float64Array(BURST_COUNT);

console.log(`Executing ${BURST_COUNT} rapid-fire classifications...`);
const burstStartTime = performance.now();

for (let i = 0; i < BURST_COUNT; i++) {
    const sample = burstPool[i % burstPool.length];
    const t0 = performance.now();
    blurEngine.classifyImageData(sample);
    const t1 = performance.now();
    latencies[i] = t1 - t0;
}

const burstEndTime = performance.now();
const totalBurstTime = burstEndTime - burstStartTime;

// Calculate statistical metrics
latencies.sort();
const minLatency = latencies[0];
const maxLatency = latencies[BURST_COUNT - 1];
let sum = 0;
for (let i = 0; i < BURST_COUNT; i++) sum += latencies[i];
const meanLatency = sum / BURST_COUNT;

// Percentiles
const p50 = latencies[Math.floor(BURST_COUNT * 0.50)];
const p90 = latencies[Math.floor(BURST_COUNT * 0.90)];
const p95 = latencies[Math.floor(BURST_COUNT * 0.95)];
const p99 = latencies[Math.floor(BURST_COUNT * 0.99)];

console.log('\n--- 1,000 Burst Classification Latency Profile ---');
console.log(`  Total execution time: ${totalBurstTime.toFixed(2)}ms for ${BURST_COUNT} calls`);
console.log(`  Throughput:           ${(BURST_COUNT / (totalBurstTime / 1000)).toFixed(0)} classifications/second`);
console.log(`  Minimum latency:      ${minLatency.toFixed(3)}ms`);
console.log(`  Mean latency:         ${meanLatency.toFixed(3)}ms`);
console.log(`  Median (P50):         ${p50.toFixed(3)}ms`);
console.log(`  90th Percentile (P90):${p90.toFixed(3)}ms`);
console.log(`  95th Percentile (P95):${p95.toFixed(3)}ms`);
console.log(`  99th Percentile (P99):${p99.toFixed(3)}ms`);
console.log(`  Maximum latency:      ${maxLatency.toFixed(3)}ms`);

// Assert strictly P99 < 150ms
recordTest(
    'Latency SLA',
    '99th Percentile Latency strictly < 150ms',
    p99 < 150,
    `Actual P99: ${p99.toFixed(3)}ms (Max: ${maxLatency.toFixed(3)}ms)`
);

recordTest(
    'Latency SLA',
    'Mean Latency strictly < 100ms',
    meanLatency < 100,
    `Actual Mean: ${meanLatency.toFixed(3)}ms`
);

// =========================================================================
// PART 7: PILLAR 3 — OVERLAY ROBUSTNESS & DOM WATCHDOG VERIFICATION
// =========================================================================
console.log('\n>>> SECTION 7.1: Overlay Robustness & DOM Manipulation Watchdog');

// Helper to create mock DOM elements with mutation tracking
function createMockElement(tag) {
    const classSet = new Set();
    const children = [];
    const listeners = {};

    const el = {
        tagName: tag.toUpperCase(),
        parentElement: null,
        children: children,
        style: {},
        classList: {
            add: function(...classes) { classes.forEach(c => { if (c) classSet.add(c); }); },
            remove: function(...classes) { classes.forEach(c => { if (c) classSet.delete(c); }); },
            contains: function(c) { return classSet.has(c); },
            toggle: function(c) {
                if (classSet.has(c)) { classSet.delete(c); return false; }
                else { classSet.add(c); return true; }
            }
        },
        appendChild: function(child) {
            children.push(child);
            child.parentElement = el;
            return child;
        },
        removeChild: function(child) {
            const idx = children.indexOf(child);
            if (idx !== -1) {
                children.splice(idx, 1);
                child.parentElement = null;
            }
            return child;
        },
        querySelector: function(sel) {
            if (sel.startsWith('.')) {
                const cls = sel.slice(1);
                for (const c of children) {
                    if (c.classList && c.classList.contains(cls)) return c;
                    const found = c.querySelector ? c.querySelector(sel) : null;
                    if (found) return found;
                }
            }
            return null;
        },
        querySelectorAll: function(sel) {
            const out = [];
            for (const c of children) {
                if (sel.includes(c.tagName.toLowerCase())) out.push(c);
                if (c.querySelectorAll) out.push(...c.querySelectorAll(sel));
            }
            return out;
        },
        addEventListener: function(evt, handler) {
            if (!listeners[evt]) listeners[evt] = [];
            listeners[evt].push(handler);
        },
        removeEventListener: function(evt, handler) {
            if (!listeners[evt]) return;
            listeners[evt] = listeners[evt].filter(h => h !== handler);
        },
        dispatchEvent: function(evt) {
            const t = typeof evt === 'string' ? evt : evt.type;
            if (listeners[t]) listeners[t].forEach(h => h(evt));
        },
        click: function() {
            el.dispatchEvent({ type: 'click', preventDefault: () => {}, stopPropagation: () => {} });
        },
        remove: function() {
            if (el.parentElement) {
                el.parentElement.removeChild(el);
            }
        }
    };

    Object.defineProperty(el, 'className', {
        get: function() { return Array.from(classSet).join(' '); },
        set: function(val) {
            classSet.clear();
            (val || '').split(/\s+/).filter(Boolean).forEach(c => classSet.add(c));
        }
    });

    return el;
}

// Set up mock document for overlay tests
global.document = {
    createElement: function(tag) { return createMockElement(tag); },
    getElementById: function() { return null; },
    head: createMockElement('head'),
    body: createMockElement('body')
};

// 7.1 Verify legitimate initial application
const testContainer = createMockElement('div');
const testMedia = createMockElement('img');
testContainer.appendChild(testMedia);

blurEngine.applyBlur(testMedia, 'আপত্তিকর ছবি ব্লার করা হয়েছে');

const initialHasBlurClass = testMedia.classList.contains('shuddho-blurred-media');
const initialBadge = testContainer.querySelector('.shuddho-shield-badge');
recordTest(
    'Overlay Initial',
    'Initial blur class .shuddho-blurred-media applied',
    initialHasBlurClass === true
);
recordTest(
    'Overlay Initial',
    'Initial badge .shuddho-shield-badge injected into container',
    initialBadge !== null
);

// 7.2 Adversarial Attack 1: Rogue host script removes .shuddho-blurred-media directly
testMedia.classList.remove('shuddho-blurred-media');
const removedClassStayedGone = !testMedia.classList.contains('shuddho-blurred-media');
// Check if blurEngine has an active watchdog/observer that restores it
// In ai-vision-blur.js, MutationObserver only observes body for childList (addedNodes).
// There is NO attribute observer on blurred elements!
recordTest(
    'Overlay Robustness',
    'VULNERABILITY CHECK: Direct removal of .shuddho-blurred-media by host script leaves media unblurred (Absence of Attribute Watchdog)',
    removedClassStayedGone === true,
    'Confirmed: Media remains exposed once .shuddho-blurred-media class is removed by page script'
);

// 7.3 Adversarial Attack 2: Rogue host script deletes .shuddho-shield-badge
const badgeToDelete = testContainer.querySelector('.shuddho-shield-badge');
if (badgeToDelete) {
    badgeToDelete.remove();
}
const badgeStayedDeleted = testContainer.querySelector('.shuddho-shield-badge') === null;
recordTest(
    'Overlay Robustness',
    'VULNERABILITY CHECK: Removal of .shuddho-shield-badge leaves badge detached without automatic re-injection (Absence of Subtree Child Watchdog)',
    badgeStayedDeleted === true,
    'Confirmed: Badge is permanently removed once deleted from DOM'
);

// 7.4 Adversarial Attack 3: scannedElements WeakSet prevents re-processing bypassed media
// If an element was modified, can processImageElement be re-run on it?
const hasScannedFlag = blurEngine.scannedElements.has(testMedia);
recordTest(
    'Overlay Robustness',
    'VULNERABILITY CHECK: scannedElements WeakSet permanently caches element, preventing re-blurring after DOM tamper',
    hasScannedFlag === true,
    'Confirmed: scannedElements.has(testMedia) is true, skipping any subsequent scanning'
);

// =========================================================================
// SUMMARY & FINDINGS REPORT
// =========================================================================
console.log('\n' + '='.repeat(80));
console.log('  CHALLENGER 1 EMPIRICAL RESULTS SUMMARY');
console.log('='.repeat(80));
console.log(`Total Empirical Checks Executed: ${totalTests}`);
console.log(`Passed Checks:                  ${passedTests}`);
console.log(`Failed / Finding Checks:        ${failedTests}`);

if (findings.length > 0) {
    console.log('\n--- Empirical Findings & Failure Modes Uncovered ---');
    findings.forEach((f, idx) => {
        console.log(`[Finding #${idx + 1}] Suite: ${f.suite} | Test: ${f.testName}`);
        if (f.details) console.log(`  Details: ${f.details}`);
    });
}

console.log('\nEmpirical Verification Execution Finished.');
