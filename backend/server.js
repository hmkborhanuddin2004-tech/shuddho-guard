const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// স্মৃতিতে থাকা প্রাথমিক ডাইনামিক ব্ল্যাকলিস্ট
let dynamicBlacklist = {
    version: "2026.09.23",
    domains: [
        "chotikahini.com", "banglachoti.com", "deshiboudi.com",
        "bdchoti.net", "viralvideo24.net", "leakbangla.com"
    ],
    telegramChannels: [
        "choti_boudi_leak_18", "deshi_mms_zone", "viral_video_bd",
        "gopon_link_adda", "adult_bangla_group"
    ],
    banglishKeywords: [
        "choti", "boudi", "gopon video", "meye link", "deshi viral",
        "bap beti", "hot boudi", "chuda", "choda", "magi", "khanki"
    ]
};

// ইউজারদের জমা দেওয়া নতুন রিপোর্ট তালিকা
let reportedTraps = [];

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

// ৪. বিকাশ/নগদ সাবস্ক্রিপশন ভেরিফিকেশন এপিআই
const subHandler = (req, res) => {
    const { phoneNumber, trxId } = req.body;

    if (!phoneNumber || !trxId) {
        return res.status(400).json({ success: false, message: "ফোন নম্বর ও ট্রানজেকশন আইডি দিন" });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    console.log(`[SUBSCRIPTION ACTIVATED] মোবাইল: ${phoneNumber} | Trx: ${trxId}`);

    res.json({
        success: true,
        status: "ACTIVE",
        plan: "PRO_MONTHLY",
        expiresAt: expiresAt.toISOString(),
        message: "অভিনন্দন! আপনার শুদ্ধ গার্ড প্রো সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে।"
    });
};
app.post('/subscription/verify', subHandler);
app.post('/api/v1/subscription/verify', subHandler);

app.listen(PORT, () => {
    console.log(`🚀 শুদ্ধ গার্ড ক্লাউড সার্ভার পোর্ট ${PORT}-এ সফলভাবে চালু হয়েছে।`);
});
