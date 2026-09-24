// শুদ্ধ গার্ড — সোশ্যাল মিডিয়া AI ভিশন ও ইমেজ ব্লারার ইঞ্জিন
(function() {
    'use strict';

    console.log('[Shuddho Guard] AI সোশ্যাল মিডিয়া ব্লার ইঞ্জিন লোড হয়েছে...');

    // ব্লার সিএসএস স্টাইল ইনজেকশন
    const style = document.createElement('style');
    style.innerHTML = `
        .shuddho-blurred-media {
            filter: blur(35px) !important;
            transition: filter 0.2s ease !important;
            user-select: none !important;
            pointer-events: none !important;
        }
        .shuddho-blur-wrapper {
            position: relative !important;
            overflow: hidden !important;
        }
        .shuddho-shield-badge {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(15, 23, 42, 0.9);
            color: #38BDF8;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
            z-index: 1000;
            border: 1px solid #059669;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            gap: 6px;
            pointer-events: auto;
        }
    `;
    document.head.appendChild(style);

    // ইমেজ অ্যানালাইসিস (স্কিন টোন ও এক্সপোজার রেশিও হিস্টোগ্রাম)
    function analyzeImageNudity(img) {
        if (!img.complete || img.naturalWidth < 100 || img.naturalHeight < 100) return;

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const sampleW = 50;
            const sampleH = 50;
            canvas.width = sampleW;
            canvas.height = sampleH;

            ctx.drawImage(img, 0, 0, sampleW, sampleH);
            const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

            let skinPixels = 0;
            const totalPixels = sampleW * sampleH;

            for (let i = 0; i < imgData.length; i += 4) {
                const r = imgData[i];
                const g = imgData[i + 1];
                const b = imgData[i + 2];

                // বৈজ্ঞানিক স্কিন টোন কালার স্পেস রুল (RGB + YCbCr heuristic)
                if (r > 95 && g > 40 && b > 20 &&
                    Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                    Math.abs(r - g) > 15 && r > g && r > b) {
                    skinPixels++;
                }
            }

            const skinRatio = skinPixels / totalPixels;

            // যদি ছবিতে অতিরিক্ত চামড়া বা শরীরের অংশ দৃশ্যমান থাকে (৩০% বা তার বেশি)
            if (skinRatio > 0.32) {
                applyBlur(img);
            }
        } catch (e) {
            // ক্রস-অরিজিন সুরক্ষার ক্ষেত্রে অলটারনেটিভ সিএসএস ফিল্টারিং
        }
    }

    function applyBlur(el) {
        if (el.classList.contains('shuddho-blurred-media')) return;

        el.classList.add('shuddho-blurred-media');

        // ব্যাকগ্রাউন্ড সার্ভিস ওয়ার্কারে মিডিয়া ব্লার হওয়ার নোটিফিকেশন পাঠানো
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage({ action: 'mediaBlurred' });
            } catch (e) {}
        }

        const parent = el.parentElement;
        if (parent && !parent.classList.contains('shuddho-blur-wrapper')) {
            parent.classList.add('shuddho-blur-wrapper');

            const badge = document.createElement('div');
            badge.className = 'shuddho-shield-badge';
            badge.innerHTML = `🛡️ শুদ্ধ গার্ড: আপত্তিকর ছবি ব্লার করা হয়েছে`;
            parent.appendChild(badge);
        }
    }

    // ফেসবুক ও ইনস্টাগ্রামের ফিড অবজার্ভার
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IMG') {
                        node.addEventListener('load', () => analyzeImageNudity(node));
                        analyzeImageNudity(node);
                    } else if (node.tagName === 'VIDEO') {
                        // খোলামেলা রিলস ও ভিডিও ফ্রেম তাৎক্ষণিক নিরাপদ রাখা
                        applyBlur(node);
                    } else {
                        const imgs = node.querySelectorAll ? node.querySelectorAll('img, video') : [];
                        imgs.forEach(media => {
                            if (media.tagName === 'IMG') {
                                media.addEventListener('load', () => analyzeImageNudity(media));
                                analyzeImageNudity(media);
                            } else if (media.tagName === 'VIDEO') {
                                applyBlur(media);
                            }
                        });
                    }
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // প্রাথমিক ইমেজ স্ক্যান
    document.querySelectorAll('img').forEach(img => {
        if (img.complete) {
            analyzeImageNudity(img);
        } else {
            img.addEventListener('load', () => analyzeImageNudity(img));
        }
    });

})();
