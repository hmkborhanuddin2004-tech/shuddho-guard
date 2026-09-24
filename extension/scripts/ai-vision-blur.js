/**
 * Shuddho Guard (শুদ্ধ গার্ড) — AI Vision & NSFW Media Blur Engine
 * Pillar 3 (R3): Real-Time Social Media Visual Safety Scanning (<150ms Latency)
 * 
 * Multi-stage feature extraction & classification pipeline:
 *  1. Fast downsampling to normalized evaluation resolution (64x64)
 *  2. Multi-color-space skin tone segmentation (YCbCr + HSV + RGB)
 *  3. Connected-component clustering & anatomical geometry analysis (distinguishing clothed portraits from extensive exposed flesh)
 *  4. Texture variance & edge gradient scoring (rejecting textured wood grain, sand, clay, fabric)
 *  5. Cross-origin CDN resilience (handling fbcdn, cdninstagram, ytimg, tiktokcdn without tainted canvas crashes)
 *  6. Intelligent video poster/frame analysis (removing blanket 100% video blur)
 *  7. Verifiable CSS blur (.shuddho-blurred-media) and DOM shield badge overlay (.shuddho-shield-badge)
 */

(function(root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js CommonJS environment
        module.exports = factory();
    } else {
        // Browser environment
        root.ShuddhoAIVisionBlur = factory();
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function() {
    'use strict';

    const EVAL_WIDTH = 64;
    const EVAL_HEIGHT = 64;
    const EVAL_PIXELS = EVAL_WIDTH * EVAL_HEIGHT;

    // Cache of already evaluated elements to prevent redundant re-scans
    const scannedElements = typeof WeakSet !== 'undefined' ? new WeakSet() : {
        _set: new Set(),
        has: function(el) { return el && el._shuddhoScanned === true; },
        add: function(el) { if (el) el._shuddhoScanned = true; }
    };

    /**
     * Convert RGB to YCbCr color space.
     * Human skin clusters tightly in Y: 60-245, Cb: 75-135, Cr: 130-180.
     */
    function rgbToYcbcr(r, g, b) {
        const y  =  0.299 * r + 0.587 * g + 0.114 * b;
        const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
        const cr =  0.5 * r - 0.418688 * g - 0.081312 * b + 128;
        return [y, cb, cr];
    }

    /**
     * Convert RGB to HSV color space.
     * Human skin hue clusters in warm peach/orange/red spectrum: H in [0, 30] or [345, 360].
     */
    function rgbToHsv(r, g, b) {
        const cMax = Math.max(r, g, b);
        const cMin = Math.min(r, g, b);
        const delta = cMax - cMin;
        let h = 0;
        if (delta !== 0) {
            if (cMax === r) {
                h = ((g - b) / delta) % 6;
            } else if (cMax === g) {
                h = (b - r) / delta + 2;
            } else {
                h = (r - g) / delta + 4;
            }
            h = Math.round(h * 60);
            if (h < 0) h += 360;
        }
        const s = cMax === 0 ? 0 : delta / cMax;
        const v = cMax / 255;
        return [h, s, v];
    }

    /**
     * Multi-color-space skin segmentation test.
     * Validates RGB, YCbCr, and HSV constraints simultaneously.
     * Rejects everyday objects like sand/clay by checking red-green vs green-blue chrominance.
     */
    function isSkinPixel(r, g, b) {
        // 1. Basic RGB bounds & chrominance hierarchy
        if (r <= 60 || g <= 35 || b <= 20) return false;
        if (r <= g || r <= b) return false;
        const rg = r - g;
        const gb = g - b;
        if (rg < 10) return false;
        if (Math.max(r, g, b) - Math.min(r, g, b) < 15) return false;

        // Human melanin ratio: (R - G) is greater than or comparable to (G - B).
        // Sand, yellow clay, and cardboard have a much larger green-blue step than red-green step.
        if (rg < gb * 0.82) return false;

        // 2. YCbCr bounds
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        if (y < 60 || y > 245) return false;

        const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
        if (cb < 75 || cb > 135) return false;

        const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;
        if (cr < 130 || cr > 180) return false;

        // Human skin always has positive red-chrominance contrast over blue-chrominance
        if (cr - cb < 10) return false;

        // 3. HSV bounds
        const cMax = Math.max(r, g, b);
        const cMin = Math.min(r, g, b);
        const delta = cMax - cMin;
        let h = 0;
        if (delta !== 0) {
            if (cMax === r) {
                h = ((g - b) / delta) % 6;
            } else if (cMax === g) {
                h = (b - r) / delta + 2;
            } else {
                h = (r - g) / delta + 4;
            }
            h = Math.round(h * 60);
            if (h < 0) h += 360;
        }

        // Melanin hue bounds: 0-30 deg or 345-360 deg
        if (!((h >= 0 && h <= 30) || (h >= 345 && h <= 360))) return false;

        const s = cMax === 0 ? 0 : delta / cMax;
        if (s < 0.12 || s > 0.85) return false;

        const v = cMax / 255;
        if (v < 0.22 || v > 0.98) return false;

        return true;
    }

    /**
     * Generate binary skin mask and calculate total skin ratio.
     */
    function segmentSkin(data, width, height) {
        const totalPixels = width * height;
        const mask = new Uint8Array(totalPixels);
        let skinCount = 0;

        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
            if (isSkinPixel(data[i], data[i + 1], data[i + 2])) {
                mask[p] = 1;
                skinCount++;
            }
        }

        return {
            mask: mask,
            skinCount: skinCount,
            skinRatio: skinCount / totalPixels
        };
    }

    /**
     * Compute texture gradient features on skin candidate regions.
     * Distinguishes smooth organic skin from textured wood grain, sand, tree bark, fabric.
     */
    function computeTextureFeatures(data, skinMask, width, height) {
        const luma = new Float32Array(width * height);
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
            luma[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        let skinGradSum = 0;
        let skinGradSqSum = 0;
        let skinEdgeCount = 0;
        let skinPixelCount = 0;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                if (skinMask[idx] === 1) {
                    skinPixelCount++;
                    const gx = (luma[idx + 1] - luma[idx - 1]) * 0.5;
                    const gy = (luma[idx + width] - luma[idx - width]) * 0.5;
                    const mag = Math.sqrt(gx * gx + gy * gy);
                    skinGradSum += mag;
                    skinGradSqSum += mag * mag;
                    if (mag > 18) {
                        skinEdgeCount++;
                    }
                }
            }
        }

        if (skinPixelCount === 0) {
            return {
                skinGradMean: 0,
                skinGradVariance: 0,
                skinEdgeDensity: 0
            };
        }

        const mean = skinGradSum / skinPixelCount;
        const variance = Math.max(0, (skinGradSqSum / skinPixelCount) - (mean * mean));
        const edgeDensity = skinEdgeCount / skinPixelCount;

        return {
            skinGradMean: mean,
            skinGradVariance: variance,
            skinEdgeDensity: edgeDensity
        };
    }

    /**
     * Connected-component clustering via 4-connectivity flood-fill.
     * Computes cluster areas, bounding boxes, and centroids.
     */
    function extractConnectedComponents(skinMask, width, height) {
        const total = width * height;
        const visited = new Uint8Array(total);
        const clusters = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (skinMask[idx] === 1 && !visited[idx]) {
                    let area = 0;
                    let minX = x, maxX = x, minY = y, maxY = y;
                    let sumX = 0, sumY = 0;
                    const queue = [idx];
                    visited[idx] = 1;

                    while (queue.length > 0) {
                        const curr = queue.pop();
                        const cy = (curr / width) | 0;
                        const cx = curr % width;
                        area++;
                        sumX += cx;
                        sumY += cy;

                        if (cx < minX) minX = cx;
                        if (cx > maxX) maxX = cx;
                        if (cy < minY) minY = cy;
                        if (cy > maxY) maxY = cy;

                        const neighbors = [
                            cy > 0 ? (cy - 1) * width + cx : -1,
                            cy < height - 1 ? (cy + 1) * width + cx : -1,
                            cx > 0 ? cy * width + (cx - 1) : -1,
                            cx < width - 1 ? cy * width + (cx + 1) : -1
                        ];

                        for (let k = 0; k < neighbors.length; k++) {
                            const n = neighbors[k];
                            if (n >= 0 && skinMask[n] === 1 && !visited[n]) {
                                visited[n] = 1;
                                queue.push(n);
                            }
                        }
                    }

                    clusters.push({
                        area: area,
                        ratio: area / total,
                        minX: minX,
                        maxX: maxX,
                        minY: minY,
                        maxY: maxY,
                        width: maxX - minX + 1,
                        height: maxY - minY + 1,
                        cx: sumX / area,
                        cy: sumY / area
                    });
                }
            }
        }

        clusters.sort(function(a, b) { return b.area - a.area; });
        return clusters;
    }

    /**
     * Downsample raw RGBA pixel data to target width and height.
     */
    function downsampleImageData(srcData, srcWidth, srcHeight, dstWidth, dstHeight) {
        dstWidth = dstWidth || EVAL_WIDTH;
        dstHeight = dstHeight || EVAL_HEIGHT;

        if (srcWidth === dstWidth && srcHeight === dstHeight) {
            return { data: srcData, width: dstWidth, height: dstHeight };
        }
        const dstData = new Uint8ClampedArray(dstWidth * dstHeight * 4);
        const xRatio = srcWidth / dstWidth;
        const yRatio = srcHeight / dstHeight;
        for (let dy = 0; dy < dstHeight; dy++) {
            const sy = Math.floor(dy * yRatio);
            const rowDst = dy * dstWidth * 4;
            const rowSrc = sy * srcWidth * 4;
            for (let dx = 0; dx < dstWidth; dx++) {
                const sx = Math.floor(dx * xRatio);
                const dstIdx = rowDst + dx * 4;
                const srcIdx = rowSrc + sx * 4;
                dstData[dstIdx] = srcData[srcIdx];
                dstData[dstIdx + 1] = srcData[srcIdx + 1];
                dstData[dstIdx + 2] = srcData[srcIdx + 2];
                dstData[dstIdx + 3] = srcData[srcIdx + 3];
            }
        }
        return { data: dstData, width: dstWidth, height: dstHeight };
    }

    /**
     * Primary Visual Safety Classifier.
     * Evaluates normalized image data through multi-stage feature extraction.
     */
    function classifyImageData(imageData) {
        if (!imageData || !imageData.data) {
            return { isNSFW: false, score: 0.0, reason: 'invalid_image_data' };
        }

        const normalized = (imageData.width !== EVAL_WIDTH || imageData.height !== EVAL_HEIGHT)
            ? downsampleImageData(imageData.data, imageData.width, imageData.height, EVAL_WIDTH, EVAL_HEIGHT)
            : imageData;

        const data = normalized.data;
        const width = normalized.width;
        const height = normalized.height;

        // Stage 1: Fast Skin Segmentation
        const seg = segmentSkin(data, width, height);
        const mask = seg.mask;
        const skinRatio = seg.skinRatio;

        // Quick exit if skin coverage is minimal (<10%)
        if (skinRatio < 0.10) {
            return {
                isNSFW: false,
                score: 0.0,
                skinRatio: skinRatio,
                largestClusterRatio: 0,
                isFaceOnly: false,
                reason: 'insufficient_skin_ratio'
            };
        }

        // Stage 2: Texture & Edge Analysis
        const texture = computeTextureFeatures(data, mask, width, height);

        // Stage 3: Connected Component Clustering & Anatomical Analysis
        const clusters = extractConnectedComponents(mask, width, height);
        const largestClusterRatio = clusters[0] ? clusters[0].ratio : 0;
        const secondClusterRatio = clusters[1] ? clusters[1].ratio : 0;
        const majorClusters = clusters.filter(function(c) { return c.ratio >= 0.03; });
        const majorClustersRatio = majorClusters.reduce(function(s, c) { return s + c.ratio; }, 0);

        // Stage 4: Clothed Face / Portrait Identification
        // Headshot/portrait has a single dominant face cluster in upper-center and dark clothing below
        let isFaceOnly = false;
        if (
            skinRatio <= 0.32 &&
            largestClusterRatio <= 0.24 &&
            clusters[0] &&
            clusters[0].cy < height * 0.60 &&
            secondClusterRatio < 0.06
        ) {
            isFaceOnly = true;
        }

        // Stage 5: Multi-Factor Scoring Engine
        let score = 0;
        score += Math.min(skinRatio * 1.3, 0.45);
        score += Math.min(largestClusterRatio * 1.5, 0.40);

        if (majorClustersRatio >= 0.25) {
            score += Math.min((majorClustersRatio - 0.25) * 1.0, 0.20);
        }

        // Texture penalty: wood grain, sand, gravel, and fabric have high edge density and variance
        if (texture.skinEdgeDensity > 0.25) {
            score -= (texture.skinEdgeDensity - 0.25) * 2.0;
        }
        if (texture.skinGradMean > 18) {
            score -= Math.min((texture.skinGradMean - 18) * 0.03, 0.35);
        }

        // Clothed portrait protection
        if (isFaceOnly) {
            score -= 0.45;
        }

        score = Math.max(0, Math.min(1, score));
        const isNSFW = score >= 0.55;

        return {
            isNSFW: isNSFW,
            score: score,
            skinRatio: skinRatio,
            largestClusterRatio: largestClusterRatio,
            majorClustersRatio: majorClustersRatio,
            isFaceOnly: isFaceOnly,
            texture: texture
        };
    }

    /**
     * Classify an HTMLImageElement, HTMLCanvasElement, or ImageBitmap.
     */
    function classifyImage(imgOrCanvas) {
        if (!imgOrCanvas) return { isNSFW: false, score: 0 };

        if (typeof document !== 'undefined') {
            const canvas = document.createElement('canvas');
            canvas.width = EVAL_WIDTH;
            canvas.height = EVAL_HEIGHT;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return { isNSFW: false, score: 0 };
            ctx.drawImage(imgOrCanvas, 0, 0, EVAL_WIDTH, EVAL_HEIGHT);
            const imgData = ctx.getImageData(0, 0, EVAL_WIDTH, EVAL_HEIGHT);
            return classifyImageData(imgData);
        }

        return { isNSFW: false, score: 0 };
    }

    /**
     * Create the Shuddho Shield Badge overlay with user toggle button.
     */
    function createShieldBadge(targetElement, reason) {
        reason = reason || 'আপত্তিকর ছবি ব্লার করা হয়েছে';
        if (typeof document === 'undefined') return null;

        const badge = document.createElement('div');
        badge.className = 'shuddho-shield-badge';
        if (badge.classList && badge.classList.add) {
            badge.classList.add('shuddho-shield-badge');
        }

        const textSpan = document.createElement('span');
        textSpan.className = 'shuddho-shield-text';
        if (textSpan.classList && textSpan.classList.add) {
            textSpan.classList.add('shuddho-shield-text');
        }
        textSpan.textContent = `🛡️ শুদ্ধ গার্ড: ${reason}`;

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'shuddho-toggle-blur-btn';
        if (toggleBtn.classList && toggleBtn.classList.add) {
            toggleBtn.classList.add('shuddho-toggle-blur-btn');
        }
        toggleBtn.type = 'button';
        toggleBtn.textContent = 'দেখুন';
        toggleBtn.addEventListener('click', function(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (e && e.stopPropagation) e.stopPropagation();
            toggleBlur(targetElement, toggleBtn);
        });

        badge.appendChild(textSpan);
        badge.appendChild(toggleBtn);
        return badge;
    }

    /**
     * Attach MutationObserver watchdog to blurred media and its container
     * to protect against malicious or hostile script tampering.
     */
    function attachTamperWatchdog(el, reason) {
        if (!el || typeof MutationObserver === 'undefined') return;
        if (el._shuddhoWatcherAttached) return;
        el._shuddhoWatcherAttached = true;

        try {
            const observer = new MutationObserver(function(mutations) {
                if (el._shuddhoUserRevealed) return; // User deliberately revealed media

                // Re-apply .shuddho-blurred-media if stripped by page scripts
                if (el.classList && !el.classList.contains('shuddho-blurred-media')) {
                    el.classList.add('shuddho-blurred-media');
                }

                // Restore .shuddho-shield-badge if deleted from DOM
                const parent = el.parentElement;
                if (parent) {
                    if (parent.classList && !parent.classList.contains('shuddho-blur-wrapper')) {
                        parent.classList.add('shuddho-blur-wrapper');
                    }
                    const badge = parent.querySelector ? parent.querySelector('.shuddho-shield-badge') : null;
                    if (!badge) {
                        const newBadge = createShieldBadge(el, el._shuddhoBlurReason || reason);
                        if (newBadge && parent.appendChild) {
                            parent.appendChild(newBadge);
                        }
                    }
                }
            });

            // Watch attributes on the blurred media element
            observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });

            // Watch parent container for badge removal
            if (el.parentElement) {
                observer.observe(el.parentElement, { childList: true });
            }

            el._shuddhoObserver = observer;
        } catch (e) {}
    }

    /**
     * Apply blur styling and attach shield badge overlay.
     */
    function applyBlur(el, reason) {
        reason = reason || 'আপত্তিকর ছবি ব্লার করা হয়েছে';
        if (!el) return;

        el._shuddhoProtected = true;
        el._shuddhoBlurReason = reason;
        el._shuddhoUserRevealed = false;

        if (el.classList && el.classList.add) {
            el.classList.add('shuddho-blurred-media');
        }

        // Notify background service worker (supporting both snake_case and camelCase action names)
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage({ action: 'media_blurred', type: el.tagName ? el.tagName.toLowerCase() : 'media' });
                chrome.runtime.sendMessage({ action: 'mediaBlurred' });
            } catch (e) {}
        }

        const parent = el.parentElement;
        if (parent) {
            if (parent.classList && parent.classList.add && !parent.classList.contains('shuddho-blur-wrapper')) {
                parent.classList.add('shuddho-blur-wrapper');
            }

            let badge = parent.querySelector ? parent.querySelector('.shuddho-shield-badge') : null;
            if (!badge) {
                badge = createShieldBadge(el, reason);
                if (badge && parent.appendChild) {
                    parent.appendChild(badge);
                }
            }
        }

        attachTamperWatchdog(el, reason);
    }

    /**
     * Remove blur styling from element.
     */
    function removeBlur(el) {
        if (!el || !el.classList) return;
        el.classList.remove('shuddho-blurred-media');
    }

    /**
     * Toggle blur state with button text update.
     */
    function toggleBlur(el, btn) {
        if (!el || !el.classList) return;
        if (el.classList.contains('shuddho-blurred-media')) {
            el._shuddhoUserRevealed = true;
            removeBlur(el);
            if (btn) btn.textContent = 'পুনরায় ব্লার করুন';
        } else {
            el._shuddhoUserRevealed = false;
            el.classList.add('shuddho-blurred-media');
            if (btn) btn.textContent = 'দেখুন';
        }
    }

    /**
     * Process an image element, handling cross-origin CDNs gracefully.
     */
    function processImageElement(img) {
        if (!img || scannedElements.has(img)) return;

        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        if (img.complete && (w < 40 || h < 40) && w > 0 && h > 0) {
            scannedElements.add(img);
            return;
        }

        try {
            if (typeof document === 'undefined') return;
            const canvas = document.createElement('canvas');
            canvas.width = EVAL_WIDTH;
            canvas.height = EVAL_HEIGHT;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            ctx.drawImage(img, 0, 0, EVAL_WIDTH, EVAL_HEIGHT);
            let imgData;
            try {
                imgData = ctx.getImageData(0, 0, EVAL_WIDTH, EVAL_HEIGHT);
            } catch (err) {
                // Handle Cross-Origin Tainted Canvas
                handleCrossOriginImage(img);
                return;
            }

            const result = classifyImageData(imgData);
            if (result.isNSFW) {
                applyBlur(img, 'আপত্তিকর ছবি ব্লার করা হয়েছে');
            }
            scannedElements.add(img);
        } catch (e) {
            // Non-critical catch
        }
    }

    /**
     * Cross-origin retry logic for social media CDNs (fbcdn, cdninstagram, ytimg, tiktokcdn).
     */
    function handleCrossOriginImage(img) {
        if (!img || img._shuddhoCorsRetried) return;
        img._shuddhoCorsRetried = true;

        if (typeof Image === 'undefined') return;

        const corsClone = new Image();
        corsClone.crossOrigin = 'anonymous';
        corsClone.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = EVAL_WIDTH;
                canvas.height = EVAL_HEIGHT;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;
                ctx.drawImage(corsClone, 0, 0, EVAL_WIDTH, EVAL_HEIGHT);
                const data = ctx.getImageData(0, 0, EVAL_WIDTH, EVAL_HEIGHT);
                const res = classifyImageData(data);
                if (res.isNSFW) {
                    applyBlur(img, 'আপত্তিকর সিডিএন ছবি ব্লার করা হয়েছে');
                }
            } catch (err) {
                fetchViaBackground(img);
            } finally {
                scannedElements.add(img);
            }
        };
        corsClone.onerror = function() {
            fetchViaBackground(img);
        };
        corsClone.src = img.currentSrc || img.src;
    }

    /**
     * Request background worker to fetch media blob bypassing page CORS restrictions.
     */
    function fetchViaBackground(img) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage(
                    { action: 'fetch_media_data', url: img.currentSrc || img.src },
                    function(response) {
                        if (response && response.dataUrl && typeof Image !== 'undefined') {
                            const bgImg = new Image();
                            bgImg.onload = function() {
                                try {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = EVAL_WIDTH;
                                    canvas.height = EVAL_HEIGHT;
                                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                                    ctx.drawImage(bgImg, 0, 0, EVAL_WIDTH, EVAL_HEIGHT);
                                    const data = ctx.getImageData(0, 0, EVAL_WIDTH, EVAL_HEIGHT);
                                    const res = classifyImageData(data);
                                    if (res.isNSFW) {
                                        applyBlur(img, 'আপত্তিকর ছবি ব্লার করা হয়েছে');
                                    }
                                } catch (e) {}
                            };
                            bgImg.src = response.dataUrl;
                        }
                    }
                );
            } catch (e) {}
        }
        scannedElements.add(img);
    }

    /**
     * Intelligent video handling:
     * Analyzes video poster thumbnail or initial video frame instead of blanket 100% blur.
     */
    function processVideoElement(video) {
        if (!video || scannedElements.has(video)) return;

        // Check if video has a poster attribute
        if (video.poster && typeof video.poster === 'string' && video.poster.trim().length > 0) {
            if (typeof Image !== 'undefined') {
                const posterImg = new Image();
                posterImg.crossOrigin = 'anonymous';
                posterImg.onload = function() {
                    const result = classifyImage(posterImg);
                    if (result && result.isNSFW) {
                        applyBlur(video, 'আপত্তিকর ভিডিও থাম্বনেইল সনাক্ত হয়েছে');
                    }
                    scannedElements.add(video);
                };
                posterImg.onerror = function() {
                    deferVideoFrameAnalysis(video);
                };
                posterImg.src = video.poster;
                return;
            }
        }

        deferVideoFrameAnalysis(video);
    }

    /**
     * Defer frame capture until video data is available.
     */
    function deferVideoFrameAnalysis(video) {
        if (!video || scannedElements.has(video)) return;

        if (video.readyState >= 2) {
            analyzeVideoFrame(video);
        } else if (video.addEventListener) {
            const onFrameReady = function() {
                if (video.removeEventListener) {
                    video.removeEventListener('loadeddata', onFrameReady);
                    video.removeEventListener('seeked', onFrameReady);
                }
                analyzeVideoFrame(video);
            };
            video.addEventListener('loadeddata', onFrameReady);
            video.addEventListener('seeked', onFrameReady);
        }
    }

    /**
     * Capture and analyze a video frame via canvas.
     */
    function analyzeVideoFrame(video) {
        if (!video || scannedElements.has(video)) return;
        try {
            if (typeof document === 'undefined') return;
            const canvas = document.createElement('canvas');
            canvas.width = EVAL_WIDTH;
            canvas.height = EVAL_HEIGHT;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            ctx.drawImage(video, 0, 0, EVAL_WIDTH, EVAL_HEIGHT);
            const imgData = ctx.getImageData(0, 0, EVAL_WIDTH, EVAL_HEIGHT);
            const result = classifyImageData(imgData);
            if (result && result.isNSFW) {
                applyBlur(video, 'আপত্তিকর ভিডিও ফ্রেম সনাক্ত হয়েছে');
            }
        } catch (e) {
            // Cross-origin video frame or tainted
        } finally {
            scannedElements.add(video);
        }
    }

    /**
     * Inject required extension CSS styles.
     */
    function injectStyles() {
        if (typeof document === 'undefined' || document.getElementById('shuddho-vision-styles')) return;

        const style = document.createElement('style');
        style.id = 'shuddho-vision-styles';
        style.textContent = `
            .shuddho-blurred-media {
                filter: blur(35px) !important;
                transition: filter 0.25s ease !important;
                user-select: none !important;
            }
            .shuddho-blur-wrapper {
                position: relative !important;
            }
            .shuddho-shield-badge {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(15, 23, 42, 0.94);
                color: #38BDF8;
                padding: 8px 14px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                z-index: 1000;
                border: 1px solid #059669;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);
                display: inline-flex;
                align-items: center;
                gap: 8px;
                pointer-events: auto;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                backdrop-filter: blur(8px);
            }
            .shuddho-shield-text {
                white-space: nowrap;
            }
            .shuddho-toggle-blur-btn {
                background: #059669;
                color: #ffffff;
                border: none;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                outline: none;
                transition: background 0.15s ease, transform 0.1s ease;
            }
            .shuddho-toggle-blur-btn:hover {
                background: #10B981;
            }
            .shuddho-toggle-blur-btn:active {
                transform: scale(0.96);
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    /**
     * Browser Content Script Initialization:
     * Sets up IntersectionObserver for viewport virtualization and MutationObserver for infinite scroll.
     */
    function initBrowser() {
        if (typeof document === 'undefined' || typeof window === 'undefined') return;

        injectStyles();

        // Viewport-aware IntersectionObserver for scroll optimization
        let viewportObserver = null;
        if (typeof IntersectionObserver !== 'undefined') {
            viewportObserver = new IntersectionObserver(function(entries) {
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    if (entry.isIntersecting) {
                        const target = entry.target;
                        if (target.tagName === 'IMG') {
                            processImageElement(target);
                        } else if (target.tagName === 'VIDEO') {
                            processVideoElement(target);
                        }
                        viewportObserver.unobserve(target);
                    }
                }
            }, { rootMargin: '200px' });
        }

        function queueMedia(element) {
            if (!element || scannedElements.has(element)) return;
            if (viewportObserver) {
                viewportObserver.observe(element);
            } else {
                if (element.tagName === 'IMG') {
                    if (element.complete) processImageElement(element);
                    else if (element.addEventListener) element.addEventListener('load', function() { processImageElement(element); }, { once: true });
                } else if (element.tagName === 'VIDEO') {
                    processVideoElement(element);
                }
            }
        }

        // MutationObserver for dynamic social media feeds (Facebook, Instagram, TikTok)
        if (typeof MutationObserver !== 'undefined' && document.body) {
            const domObserver = new MutationObserver(function(mutations) {
                for (let m = 0; m < mutations.length; m++) {
                    const mutation = mutations[m];
                    for (let n = 0; n < mutation.addedNodes.length; n++) {
                        const node = mutation.addedNodes[n];
                        if (node.nodeType === 1) {
                            if (node.tagName === 'IMG' || node.tagName === 'VIDEO') {
                                queueMedia(node);
                            } else if (node.querySelectorAll) {
                                const medias = node.querySelectorAll('img, video');
                                for (let i = 0; i < medias.length; i++) {
                                    queueMedia(medias[i]);
                                }
                            }
                        }
                    }

                    // Watchdog: detect class tampering on protected media
                    if (mutation.type === 'attributes' && mutation.target) {
                        const target = mutation.target;
                        if (target._shuddhoProtected && !target._shuddhoUserRevealed) {
                            if (target.classList && !target.classList.contains('shuddho-blurred-media')) {
                                target.classList.add('shuddho-blurred-media');
                            }
                        }
                    } else if (mutation.type === 'childList' && mutation.removedNodes && mutation.removedNodes.length > 0) {
                        for (let r = 0; r < mutation.removedNodes.length; r++) {
                            const removed = mutation.removedNodes[r];
                            if (removed.classList && removed.classList.contains('shuddho-shield-badge')) {
                                const parent = mutation.target;
                                if (parent && parent.querySelector) {
                                    const media = parent.querySelector('img, video');
                                    if (media && media._shuddhoProtected && !media._shuddhoUserRevealed) {
                                        const newBadge = createShieldBadge(media, media._shuddhoBlurReason || 'আপত্তিকর ছবি ব্লার করা হয়েছে');
                                        if (newBadge && parent.appendChild) {
                                            parent.appendChild(newBadge);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            domObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
        }

        // Initial scan of existing media
        if (document.querySelectorAll) {
            const initialList = document.querySelectorAll('img, video');
            for (let i = 0; i < initialList.length; i++) {
                queueMedia(initialList[i]);
            }
        }
    }

    // Auto-run if running in browser
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initBrowser);
        } else {
            initBrowser();
        }
    }

    return {
        EVAL_WIDTH: EVAL_WIDTH,
        EVAL_HEIGHT: EVAL_HEIGHT,
        rgbToYcbcr: rgbToYcbcr,
        rgbToHsv: rgbToHsv,
        isSkinPixel: isSkinPixel,
        segmentSkin: segmentSkin,
        computeTextureFeatures: computeTextureFeatures,
        extractConnectedComponents: extractConnectedComponents,
        downsampleImageData: downsampleImageData,
        classifyImageData: classifyImageData,
        classifyImage: classifyImage,
        createShieldBadge: createShieldBadge,
        attachTamperWatchdog: attachTamperWatchdog,
        applyBlur: applyBlur,
        removeBlur: removeBlur,
        toggleBlur: toggleBlur,
        processImageElement: processImageElement,
        processVideoElement: processVideoElement,
        scannedElements: scannedElements,
        injectStyles: injectStyles,
        initBrowser: initBrowser
    };
}));
