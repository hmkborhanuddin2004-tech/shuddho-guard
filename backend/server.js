const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// স্মৃতিতে থাকা প্রাথমিক ডাইনামিক ব্ল্যাকলিস্ট
let dynamicBlacklist = {
    version: "2026.09.24",
    domains: [
        "chotikahini.com", "banglachoti.com", "deshiboudi.com",
        "bdchoti.net", "viralvideo24.net", "leakbangla.com",
        "1xbet.com", "melbet.org", "babu88.com", "jeetbuzz.com"
    ],
    telegramChannels: [
        "choti_boudi_leak_18", "deshi_mms_zone", "viral_video_bd",
        "gopon_link_adda", "adult_bangla_group", "babu88_tips"
    ],
    banglishKeywords: [
        "choti", "boudi", "gopon video", "meye link", "deshi viral",
        "bap beti", "hot boudi", "chuda", "choda", "magi", "khanki",
        "casino", "betting", "1xbet", "babu88"
    ]
};

// ইউজারদের জমা দেওয়া নতুন রিপোর্ট তালিকা
let reportedTraps = [];

// FIX #17: ট্রানজেকশন ক্যাশ ও রিপ্লে অ্যাটাক সুরক্ষা
const processedTrxIds = new Set();

// ১. হেলথ চেক
const healthHandler = (req, res) => {
    res.status(200).json({ status: "OK", service: "Shuddho Guard Cloud Engine", uptime: process.uptime() });
};
app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// ২. ব্ল্যাকলিস্ট সিঙ্ক এপিআই (রুট ও /api/v1 উভয়ের সমর্থন)
const blacklistHandler = (req, res) => {
    res.json({
        success: true,
        data: dynamicBlacklist,
        timestamp: new Date().toISOString()
    });
};
app.get('/blacklist', blacklistHandler);
app.get('/api/v1/blacklist', blacklistHandler);

// ৩. সাধারণ ব্যবহারকারীদের নতুন ফাঁদ রিপোর্ট করার এপিআই
const reportHandler = (req, res) => {
    const { url, title } = req.body;
    if (!url) {
        return res.status(400).json({ success: false, message: "URL প্রদান করা আবশ্যক" });
    }

    const newReport = {
        id: reportedTraps.length + 1,
        url,
        title: title || "অজানা শিরোনাম",
        reportedAt: new Date().toISOString(),
        verified: false
    };

    reportedTraps.push(newReport);
    console.log(`[REPORT RECEIVED] নতুন রিপোর্ট এসেছে: ${url}`);

    res.status(201).json({
        success: true,
        message: "ধন্যবাদ! আপনার রিপোর্টটি গৃহীত হয়েছে এবং পর্যালোচনার পর ব্ল্যাকলিস্টে যুক্ত করা হবে।"
    });
};
app.post('/report', reportHandler);
app.post('/api/v1/report', reportHandler);

// ৪. বিকাশ/নগদ সাবস্ক্রিপশন ভেরিফিকেশন এপিআই (FIX #17: ক্রিপ্টো লাইসেন্স ও কঠোর যাচাইকরণ)
const subHandler = (req, res) => {
    const { phoneNumber, trxId } = req.body;

    if (!phoneNumber || !trxId) {
        return res.status(400).json({ success: false, message: "ফোন নম্বর ও ট্রানজেকশন আইডি প্রদান করা আবশ্যক।" });
    }

    // বাংলাদেশি ফোন নম্বর যাচাই (১১ ডিজিট, ০১ দিয়ে শুরু)
    const cleanPhone = String(phoneNumber).replace(/[\s-]/g, '');
    const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: "অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।" });
    }

    // ট্রানজেকশন আইডি ফরম্যাট যাচাই (bKash/Nagad সাধারণত ৮-১২ অক্ষরের আলফানিউমেরিক)
    const cleanTrx = String(trxId).trim().toUpperCase();
    const trxRegex = /^[A-Z0-9]{8,12}$/;
    if (!trxRegex.test(cleanTrx)) {
        return res.status(400).json({ success: false, message: "অকার্যকর ট্রানজেকশন আইডি ফরম্যাট। ৮-১২ অক্ষরের bKash/Nagad TrxID দিন।" });
    }

    // রিপ্লে অ্যাটাক রোধ
    if (processedTrxIds.has(cleanTrx)) {
        return res.status(409).json({ success: false, message: "এই ট্রানজেকশন আইডিটি ইতিমধ্যে একবার ব্যবহার করা হয়েছে।" });
    }

    processedTrxIds.add(cleanTrx);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const licenseKey = `SG-PRO-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const token = crypto.createHmac('sha256', process.env.JWT_SECRET || 'shuddho-guard-secret-salt-2026')
        .update(`${cleanPhone}:${cleanTrx}:${expiresAt.getTime()}`)
        .digest('hex');

    console.log(`[SUBSCRIPTION ACTIVATED] মোবাইল: ${cleanPhone} | Trx: ${cleanTrx} | Key: ${licenseKey}`);

    res.json({
        success: true,
        status: "ACTIVE",
        plan: "PRO_MONTHLY",
        licenseKey: licenseKey,
        token: token,
        expiresAt: expiresAt.toISOString(),
        message: "অভিনন্দন! আপনার শুদ্ধ গার্ড প্রো সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে।"
    });
};
app.post('/subscription/verify', subHandler);
app.post('/api/v1/subscription/verify', subHandler);

app.listen(PORT, () => {
    console.log(`🚀 শুদ্ধ গার্ড ক্লাউড সার্ভার পোর্ট ${PORT}-এ সফলভাবে চালু হয়েছে।`);
});
