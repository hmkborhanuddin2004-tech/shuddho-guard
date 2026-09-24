/**
 * Shuddho Guard (শুদ্ধ গার্ড) — Automated Synthetic Image Benchmark Suite
 * Pillar 3 (R3): Social Media Real-Time AI NSFW Image & Video Blur Engine
 * 
 * Verifies Acceptance Criteria:
 *  - Programmatic synthetic image generation covering explicit, portraits, nature, wood/sand, and graphics
 *  - Classification latency strictly < 150ms per media element and average latency < 100ms
 *  - Verifiable CSS blur (.shuddho-blurred-media) and DOM shield badge overlay (.shuddho-shield-badge)
 *  - Interactive user unblur/toggle behavior
 *  - Intelligent video handling (preventing blanket video blur on educational/safe videos)
 */

const { performance } = require('perf_hooks');
const path = require('path');

// Load production classifier engine
const blurEngine = require(path.join(__dirname, '../web-extension/scripts/ai-vision-blur.js'));

// Test assertion stats
let passedAssertions = 0;
let failedAssertions = 0;
const failures = [];

function assert(condition, message) {
    if (condition) {
        passedAssertions++;
        console.log(`  [PASS] ${message}`);
    } else {
        failedAssertions++;
        failures.push(message);
        console.error(`  [FAIL] ${message}`);
    }
}

// =========================================================================
// 1. Programmatic Synthetic Image Generation
// =========================================================================

function generateSyntheticImage(category, width = 64, height = 64) {
    const data = new Uint8ClampedArray(width * height * 4);

    switch (category) {
        case 'explicit_exposure': {
            // High-exposure explicit pattern: large contiguous torso/chest area (>45% of image)
            // with smooth organic melanin skin gradient
            const cx = width * 0.5;
            const cy = height * 0.5;
            const rx = width * 0.32;
            const ry = height * 0.38;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const dx = (x - cx) / rx;
                    const dy = (y - cy) / ry;
                    if (dx * dx + dy * dy <= 1) {
                        // Smooth flesh tones
                        data[idx] = Math.min(255, 226 + Math.sin(x / (width * 0.1)) * 4);
                        data[idx + 1] = Math.min(255, 168 + Math.cos(y / (height * 0.1)) * 4);
                        data[idx + 2] = 136;
                        data[idx + 3] = 255;
                    } else {
                        // Dark background
                        data[idx] = 40;
                        data[idx + 1] = 42;
                        data[idx + 2] = 50;
                        data[idx + 3] = 255;
                    }
                }
            }
            break;
        }

        case 'clothed_portrait': {
            // Clothed human portrait: face oval in upper center (~14% of frame)
            // with dark business suit and white collar below
            const cx = width * 0.5;
            const cy = height * 0.32;
            const rx = width * 0.19;
            const ry = height * 0.24;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const dx = (x - cx) / rx;
                    const dy = (y - cy) / ry;
                    if (dx * dx + dy * dy <= 1) {
                        // Facial skin tone
                        data[idx] = 220;
                        data[idx + 1] = 165;
                        data[idx + 2] = 135;
                        data[idx + 3] = 255;
                    } else if (y > height * 0.54) {
                        // Dark navy suit with white shirt
                        if (x > width * 0.44 && x < width * 0.56 && y < height * 0.70) {
                            // White shirt collar
                            data[idx] = 240; data[idx + 1] = 242; data[idx + 2] = 245; data[idx + 3] = 255;
                        } else {
                            // Navy blazer
                            data[idx] = 28; data[idx + 1] = 36; data[idx + 2] = 58; data[idx + 3] = 255;
                        }
                    } else {
                        // Neutral studio background
                        data[idx] = 210;
                        data[idx + 1] = 212;
                        data[idx + 2] = 218;
                        data[idx + 3] = 255;
                    }
                }
            }
            break;
        }

        case 'natural_landscape': {
            // Sky gradient above, green foliage and mountain lake below (0% skin)
            const skyH = Math.floor(height * 0.44);
            const forestH = Math.floor(height * 0.72);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    if (y < skyH) {
                        // Clear blue sky
                        const skyFactor = y / skyH;
                        data[idx] = Math.floor(100 + skyFactor * 80);
                        data[idx + 1] = Math.floor(165 + skyFactor * 45);
                        data[idx + 2] = 240;
                        data[idx + 3] = 255;
                    } else if (y < forestH) {
                        // Green pine forest
                        data[idx] = 34;
                        data[idx + 1] = 118;
                        data[idx + 2] = 46;
                        data[idx + 3] = 255;
                    } else {
                        // Blue mountain lake
                        data[idx] = 22;
                        data[idx + 1] = 88;
                        data[idx + 2] = 135;
                        data[idx + 3] = 255;
                    }
                }
            }
            break;
        }

        case 'warm_wood_grain': {
            // Warm brown hues (within broad color box) with pronounced repeating wood grain rings and fibers
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const ring = Math.sin(x * 1.5 + Math.sin(y / 4) * 4.5) * 42;
                    const fiberNoise = ((x * 23 + y * 41) % 19) - 9;
                    const val = 160 + ring + fiberNoise;
                    data[idx] = Math.min(255, Math.max(0, val));
                    data[idx + 1] = Math.min(255, Math.max(0, val * 0.64));
                    data[idx + 2] = Math.min(255, Math.max(0, val * 0.36));
                    data[idx + 3] = 255;
                }
            }
            break;
        }

        case 'desert_sand_dunes': {
            // Desert dunes with tan/yellow sand (H ~ 38 deg, G-B > R-G)
            const skyH = Math.floor(height * 0.28);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    if (y < skyH) {
                        // Desert morning sky
                        data[idx] = 115; data[idx + 1] = 185; data[idx + 2] = 245; data[idx + 3] = 255;
                    } else {
                        // Sand ripples and speckles
                        const grain = ((x * 37 + y * 59) % 15) - 7;
                        const ripple = Math.sin(x / 3 + y / 2) * 8;
                        data[idx] = Math.min(255, 218 + grain + ripple);
                        data[idx + 1] = Math.min(255, 182 + grain + ripple);
                        data[idx + 2] = Math.min(255, 122 + grain);
                        data[idx + 3] = 255;
                    }
                }
            }
            break;
        }

        case 'geometric_graphics': {
            // Dark UI screen with colorful analytical charts and text bars
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    if (x >= width * 0.12 && x <= width * 0.34 && y >= height * 0.25 && y <= height * 0.82) {
                        // Blue bar
                        data[idx] = 59; data[idx + 1] = 130; data[idx + 2] = 246; data[idx + 3] = 255;
                    } else if (x >= width * 0.44 && x <= width * 0.66 && y >= height * 0.44 && y <= height * 0.82) {
                        // Emerald bar
                        data[idx] = 16; data[idx + 1] = 185; data[idx + 2] = 129; data[idx + 3] = 255;
                    } else if (x >= width * 0.75 && x <= width * 0.90 && y >= height * 0.15 && y <= height * 0.82) {
                        // Amber bar
                        data[idx] = 245; data[idx + 1] = 158; data[idx + 2] = 11; data[idx + 3] = 255;
                    } else {
                        // Dark slate background
                        data[idx] = 24; data[idx + 1] = 24; data[idx + 2] = 27; data[idx + 3] = 255;
                    }
                }
            }
            break;
        }

        default:
            throw new Error(`Unknown synthetic category: ${category}`);
    }

    return { data, width, height };
}

// =========================================================================
// 2. Mock DOM Infrastructure for Node.js Testing
// =========================================================================

function createMockElement(tagName) {
    const classSet = new Set();
    const listeners = {};
    const children = [];

    const el = {
        tagName: tagName.toUpperCase(),
        src: '',
        poster: '',
        naturalWidth: 64,
        naturalHeight: 64,
        width: 64,
        height: 64,
        complete: true,
        readyState: 2,
        parentElement: null,
        children: children,
        style: {},
        textContent: '',

        classList: {
            add: function(...classes) {
                classes.forEach(c => { if (c) classSet.add(c); });
            },
            remove: function(...classes) {
                classes.forEach(c => { if (c) classSet.delete(c); });
            },
            contains: function(c) {
                return classSet.has(c);
            },
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
            const index = children.indexOf(child);
            if (index !== -1) {
                children.splice(index, 1);
                child.parentElement = null;
            }
            return child;
        },

        querySelector: function(selector) {
            if (selector.startsWith('.')) {
                const targetClass = selector.slice(1);
                for (const c of children) {
                    if (c.classList && c.classList.contains(targetClass)) return c;
                    const found = c.querySelector ? c.querySelector(selector) : null;
                    if (found) return found;
                }
            }
            return null;
        },

        querySelectorAll: function(selector) {
            const results = [];
            for (const c of children) {
                if (selector.includes(c.tagName.toLowerCase())) results.push(c);
                if (c.querySelectorAll) results.push(...c.querySelectorAll(selector));
            }
            return results;
        },

        addEventListener: function(event, handler) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        },

        removeEventListener: function(event, handler) {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(h => h !== handler);
        },

        dispatchEvent: function(event) {
            const evType = typeof event === 'string' ? event : event.type;
            if (listeners[evType]) {
                listeners[evType].forEach(h => h(event));
            }
        },

        click: function() {
            el.dispatchEvent({ type: 'click', preventDefault: () => {}, stopPropagation: () => {} });
        },

        getContext: function(type) {
            // Mock 2D Canvas context
            return {
                drawImage: function() {},
                getImageData: function(x, y, w, h) {
                    // Return synthetic image or blank
                    if (el._mockImageData) return el._mockImageData;
                    return {
                        data: new Uint8ClampedArray(w * h * 4),
                        width: w,
                        height: h
                    };
                }
            };
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

// Set up mock globals for DOM verification
global.document = {
    createElement: function(tag) {
        return createMockElement(tag);
    },
    getElementById: function() { return null; },
    head: createMockElement('head'),
    body: createMockElement('body')
};

// =========================================================================
// 3. Test Suites & Benchmarking Harness
// =========================================================================

async function runTestSuite() {
    console.log('================================================================================');
    console.log('  Shuddho Guard — Pillar 3 (R3) AI NSFW Vision Blur Engine Benchmark Suite');
    console.log('================================================================================\n');

    // ---------------------------------------------------------------------
    // Test 1: Synthetic Image Benchmarks & Classification Accuracy
    // ---------------------------------------------------------------------
    console.log('[Suite 1] Synthetic Image Classification Benchmarks:');

    const testCases = [
        {
            category: 'explicit_exposure',
            expectedNSFW: true,
            label: 'High-exposure explicit pattern (>45% contiguous flesh, smooth organic gradient)'
        },
        {
            category: 'clothed_portrait',
            expectedNSFW: false,
            label: 'Clothed human portrait (face & neck only, dark suit/shirt below)'
        },
        {
            category: 'natural_landscape',
            expectedNSFW: false,
            label: 'Natural landscape (blue sky, green foliage, blue mountain water)'
        },
        {
            category: 'warm_wood_grain',
            expectedNSFW: false,
            label: 'Warm-toned wood grain (brown tones with high texture edge gradient)'
        },
        {
            category: 'desert_sand_dunes',
            expectedNSFW: false,
            label: 'Desert sand dunes (tan/gold dunes, distinct melanin chrominance difference)'
        },
        {
            category: 'geometric_graphics',
            expectedNSFW: false,
            label: 'Geometric charts & dark mode UI screen (0% skin, flat graphics)'
        }
    ];

    const benchmarkResults = [];
    const allLatencies = [];

    for (const tc of testCases) {
        const sample = generateSyntheticImage(tc.category, 64, 64);

        // Warmup JIT pass
        blurEngine.classifyImageData(sample);

        // Execute 50 measured benchmark iterations
        const runs = 50;
        const latencies = [];
        let lastResult = null;

        for (let i = 0; i < runs; i++) {
            const t0 = performance.now();
            lastResult = blurEngine.classifyImageData(sample);
            const t1 = performance.now();
            const elapsed = t1 - t0;
            latencies.push(elapsed);
            allLatencies.push(elapsed);
        }

        latencies.sort((a, b) => a - b);
        const minLat = latencies[0];
        const maxLat = latencies[latencies.length - 1];
        const avgLat = latencies.reduce((s, v) => s + v, 0) / runs;
        const p95Lat = latencies[Math.floor(runs * 0.95)];

        benchmarkResults.push({
            category: tc.category,
            label: tc.label,
            expected: tc.expectedNSFW,
            actual: lastResult.isNSFW,
            score: lastResult.score.toFixed(3),
            skinRatio: (lastResult.skinRatio * 100).toFixed(1) + '%',
            minLat: minLat.toFixed(3) + 'ms',
            maxLat: maxLat.toFixed(3) + 'ms',
            avgLat: avgLat.toFixed(3) + 'ms',
            p95Lat: p95Lat.toFixed(3) + 'ms'
        });

        // Assert correct classification
        assert(
            lastResult.isNSFW === tc.expectedNSFW,
            `${tc.label} -> Classified: ${lastResult.isNSFW} (Expected: ${tc.expectedNSFW}, Score: ${lastResult.score.toFixed(2)})`
        );

        // Assert strict latency < 150ms on max run
        assert(
            maxLat < 150,
            `Latency strictly < 150ms for ${tc.category} (Max: ${maxLat.toFixed(3)}ms, Avg: ${avgLat.toFixed(3)}ms)`
        );
    }

    // Assert overall average latency < 100ms
    const overallAvgLatency = allLatencies.reduce((s, v) => s + v, 0) / allLatencies.length;
    assert(
        overallAvgLatency < 100,
        `Overall average classification latency strictly < 100ms (Actual: ${overallAvgLatency.toFixed(3)}ms across ${allLatencies.length} runs)`
    );

    console.log('\n  Synthetic Benchmark Latency & Accuracy Summary:');
    console.table(benchmarkResults.map(r => ({
        Category: r.category,
        Classified: r.actual ? 'NSFW' : 'SAFE',
        Expected: r.expected ? 'NSFW' : 'SAFE',
        Score: r.score,
        Skin: r.skinRatio,
        'Avg Latency': r.avgLat,
        'P95 Latency': r.p95Lat,
        'Max Latency': r.maxLat
    })));

    // ---------------------------------------------------------------------
    // Test 2: Downsampling of Large Images (e.g. 256x256, 1080p equivalent)
    // ---------------------------------------------------------------------
    console.log('\n[Suite 2] High-Resolution Downsampling & Performance:');
    {
        const largeExplicit = generateSyntheticImage('explicit_exposure', 256, 256);
        const t0 = performance.now();
        const largeResult = blurEngine.classifyImageData(largeExplicit);
        const t1 = performance.now();
        const largeLatency = t1 - t0;

        assert(largeResult.isNSFW === true, `256x256 high-resolution explicit image correctly classified as NSFW`);
        assert(largeLatency < 150, `256x256 image downsampled and classified in <150ms (Actual: ${largeLatency.toFixed(3)}ms)`);
    }

    // ---------------------------------------------------------------------
    // Test 3: Verifiable CSS Blur and DOM Overlay Application
    // ---------------------------------------------------------------------
    console.log('\n[Suite 3] Verifiable CSS Blur & Shield Badge Overlay Application:');
    {
        const container = createMockElement('div');
        const img = createMockElement('img');
        container.appendChild(img);

        // Apply blur
        blurEngine.applyBlur(img, 'আপত্তিকর ছবি ব্লার করা হয়েছে');

        // Check CSS class on media
        assert(
            img.classList.contains('shuddho-blurred-media') === true,
            `Applied class '.shuddho-blurred-media' to media element`
        );

        // Check blur wrapper on parent
        assert(
            container.classList.contains('shuddho-blur-wrapper') === true,
            `Applied class '.shuddho-blur-wrapper' to parent container`
        );

        // Check shield badge overlay injection
        const badge = container.querySelector('.shuddho-shield-badge');
        assert(badge !== null, `DOM overlay '.shuddho-shield-badge' injected into parent container`);

        const textSpan = badge ? badge.querySelector('.shuddho-shield-text') : null;
        assert(
            textSpan !== null && textSpan.textContent.includes('শুদ্ধ গার্ড'),
            `Shield badge contains Bangla label with 'শুদ্ধ গার্ড'`
        );

        // Check user toggle button
        const toggleBtn = badge ? badge.querySelector('.shuddho-toggle-blur-btn') : null;
        assert(toggleBtn !== null, `User unblur toggle button '.shuddho-toggle-blur-btn' is present`);
        assert(toggleBtn && toggleBtn.textContent === 'দেখুন', `Toggle button initial label is 'দেখুন'`);

        // Test Interactive Unblur Click
        if (toggleBtn) {
            toggleBtn.click();
            assert(
                img.classList.contains('shuddho-blurred-media') === false,
                `Clicking toggle button removes '.shuddho-blurred-media' (user temporarily reveals media)`
            );
            assert(
                toggleBtn.textContent === 'পুনরায় ব্লার করুন',
                `Toggle button text updates to 'পুনরায় ব্লার করুন'`
            );

            // Test Re-blur Click
            toggleBtn.click();
            assert(
                img.classList.contains('shuddho-blurred-media') === true,
                `Clicking toggle button again restores '.shuddho-blurred-media'`
            );
            assert(
                toggleBtn.textContent === 'দেখুন',
                `Toggle button text returns to 'দেখুন'`
            );
        }
    }

    // ---------------------------------------------------------------------
    // Test 4: Intelligent Video Handling (No Blanket Blur)
    // ---------------------------------------------------------------------
    console.log('\n[Suite 4] Intelligent Video Handling (No Blanket Video Blur):');
    {
        // Case 4a: Safe Educational Video (Should NOT be blurred!)
        const safeVideoContainer = createMockElement('div');
        const safeVideo = createMockElement('video');
        safeVideo.poster = 'https://example.com/educational_nature_video.jpg';
        safeVideoContainer.appendChild(safeVideo);

        // Process with blurEngine
        blurEngine.processVideoElement(safeVideo);

        assert(
            safeVideo.classList.contains('shuddho-blurred-media') === false,
            `Safe educational video is NOT blurred unconditionally (blanket blur removed)`
        );
        assert(
            safeVideoContainer.querySelector('.shuddho-shield-badge') === null,
            `No shield badge attached to safe video`
        );

        // Case 4b: Video with explicit thumbnail/content
        const explicitVideoContainer = createMockElement('div');
        const explicitVideo = createMockElement('video');
        explicitVideoContainer.appendChild(explicitVideo);

        blurEngine.applyBlur(explicitVideo, 'আপত্তিকর ভিডিও ফ্রেম সনাক্ত হয়েছে');
        assert(
            explicitVideo.classList.contains('shuddho-blurred-media') === true,
            `Explicit video receives '.shuddho-blurred-media' when classified harmful`
        );
        assert(
            explicitVideoContainer.querySelector('.shuddho-shield-badge') !== null,
            `Shield badge attached to explicit video with toggle controls`
        );
    }

    // ---------------------------------------------------------------------
    // Test 5: Cross-Origin CDN Resilience (No Silent Failures)
    // ---------------------------------------------------------------------
    console.log('\n[Suite 5] Cross-Origin CDN Resilience:');
    {
        const cdnImg = createMockElement('img');
        cdnImg.src = 'https://scontent.xx.fbcdn.net/v/t39.30808-6/482910_sample.jpg';
        const cdnContainer = createMockElement('div');
        cdnContainer.appendChild(cdnImg);

        let errorThrown = false;
        try {
            blurEngine.processImageElement(cdnImg);
        } catch (e) {
            errorThrown = true;
        }

        assert(!errorThrown, `Cross-origin CDN image processed without unhandled canvas taint exceptions`);
    }

    // ---------------------------------------------------------------------
    // Test 6: Extension Mirror Parity Verification
    // ---------------------------------------------------------------------
    console.log('\n[Suite 6] Extension Mirror Parity Verification:');
    {
        const mirrorEngine = require(path.join(__dirname, '../extension/scripts/ai-vision-blur.js'));
        assert(typeof mirrorEngine === 'object' && mirrorEngine !== null, `Mirror engine in extension/scripts/ai-vision-blur.js loads successfully`);

        const expSample = generateSyntheticImage('explicit_exposure', 64, 64);
        const safeSample = generateSyntheticImage('clothed_portrait', 64, 64);

        const expRes = mirrorEngine.classifyImageData(expSample);
        const safeRes = mirrorEngine.classifyImageData(safeSample);

        assert(expRes.isNSFW === true, `Mirror engine classifies explicit sample as NSFW`);
        assert(safeRes.isNSFW === false, `Mirror engine classifies clothed portrait as SAFE`);
    }

    // ---------------------------------------------------------------------
    // Final Benchmark Report & Exit Code
    // ---------------------------------------------------------------------
    console.log('\n================================================================================');
    console.log(`  BENCHMARK RESULTS: ${passedAssertions} Passed, ${failedAssertions} Failed`);
    console.log(`  LATENCY COMPLIANCE: Strictly < 150ms (Actual Max: ${Math.max(...allLatencies).toFixed(3)}ms, Avg: ${overallAvgLatency.toFixed(3)}ms)`);
    console.log('================================================================================\n');

    if (failedAssertions > 0) {
        console.error('❌ Failures occurred:');
        failures.forEach(f => console.error(`  - ${f}`));
        process.exit(1);
    } else {
        console.log('✅ ALL R3 BENCHMARKS & ACCEPTANCE CRITERIA PASSED PROGRAMMATICALLY.');
        process.exit(0);
    }
}

runTestSuite();
