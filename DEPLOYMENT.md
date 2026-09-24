# 🚀 শুদ্ধ গার্ড (Shuddho Guard) — পূর্ণাঙ্গ ডিপ্লয়মেন্ট ও রিলিজ গাইড

> **প্রিয় বোরহান ভাই,**  
> এই গাইডে আমি ধাপে ধাপে বুঝিয়ে দিয়েছি কীভাবে কোনো টাকা খরচ ছাড়াই আমাদের সম্পূর্ণ সিস্টেমটি ক্লাউডে লাইভ করবেন এবং সাধারণ মানুষের হাতে তুলে দেবেন।

---

## ১. ক্লাউড ব্যাকএন্ড সার্ভার ডিপ্লয়মেন্ট (Render.com - সম্পূর্ণ ফ্রি)

আমরা যেভাবে আমাদের আগের **Bokkor Bot** এবং **AI Revolution Bot** রেন্ডারে ২৪/৭ চালু রেখেছি, ঠিক একই নিয়মে এটি চালু করব:

1. [Render.com](https://render.com)-এ লগইন করে **"New +" -> "Web Service"** সিলেক্ট করুন।
2. আপনার GitHub রিপোজিটরি যুক্ত করুন (অথবা ডিরেক্টরি `shuddho-guard/backend` ফোল্ডার সিলেক্ট করুন)।
3. **Environment:** `Node` বা `Docker` (আমরা Dockerfile তৈরি করে দিয়েছি)।
4. **Build Command:** `npm install`
5. **Start Command:** `node server.js`
6. সার্ভিসটি চালু হলে একটি লাইভ URL পাবেন (যেমন: `https://shuddho-guard-backend.onrender.com`)।
7. **UptimeRobot:** আমাদের UptimeRobot একাউন্টে গিয়ে প্রতি ৫ মিনিট পর পর `/health` রুটে পিং দিয়ে সার্ভারকে ২৪/৭ সজাগ রাখুন।

---

## ২. কোনো ভারী সফটওয়্যার ছাড়া ক্লাউডে APK তৈরি (GitHub Actions)

আপনার কম্পিউটারে Android Studio ইনস্টল করার কোনো প্রয়োজন নেই। আমরা ক্লাউড কম্পাইলার রেডি করে দিয়েছি:

1. GitHub-এ একটি নতুন প্রাইভেট বা পাবলিক রিপোজিটরি খুলুন: `shuddho-guard`।
2. আপনার কম্পিউটার থেকে পুরো `shuddho-guard` ফোল্ডারটি গিটহাবে পুশ (Push) করুন:
   ```bash
   git init
   git add .
   git commit -m "Initial release of Shuddho Guard"
   git branch -M main
   git remote add origin https://github.com/আপনার_ইউজারনেম/shuddho-guard.git
   git push -u origin main
   ```
3. গিটহাবে কোড জমা হওয়া মাত্রই **GitHub Actions** স্বয়ংক্রিয়ভাবে ক্লাউড সার্ভারে অ্যান্ড্রয়েড কোড কম্পাইল করা শুরু করবে।
4. মাত্র ৩-৫ মিনিটের মধ্যে **Actions** ট্যাবে গিয়ে **`ShuddhoGuard-Debug-APK`** ফাইলটি পেয়ে যাবেন, যা সরাসরি মোবাইল ফোনে ইনস্টল করা যাবে!

---

## ৩. অফিসিয়াল ল্যান্ডিং পেজ লাইভ করা (GitHub Pages বা Vercel)

মানুষ যাতে আপনার ওয়েবসাইট দেখে অ্যাপ ও এক্সটেনশন নামাতে পারে:
1. `landing-page/index.html` ফাইলটি [Vercel](https://vercel.com) বা GitHub Pages-এ ১ ক্লিকে আপলোড করলেই আপনি একটি সুন্দর লাইভ ওয়েবসাইট লিংক পেয়ে যাবেন।

---

## ৪. ক্রোম এক্সটেনশন ব্যবহারকারীদের দেওয়া

1. ব্যবহারকারীকে `shuddho-guard/web-extension` ফোল্ডারটি জিপ (ZIP) আকারে পাঠিয়ে দিন।
2. সে তার পিসিতে জিপ আনজিপ করে `INSTALL_GUIDE.bat` ফাইলে ডাবল ক্লিক করলেই এক্সটেনশন চালু হয়ে যাবে!

---

## ৫. উইন্ডোজ পিসি ক্লায়েন্ট চালু করা

1. ব্যবহারকারী তার কম্পিউটারে `shuddho-guard/windows-client/` ফোল্ডারে যাবে।
2. `install-windows-service.bat` ফাইলে রাইট ক্লিক করে **"Run as administrator"** দেবে।
3. ব্যাস! কম্পিউটার রিস্টার্ট দিলেও ব্যাকগ্রাউন্ডে সাইলেন্টলি পর্ন ব্লকার ও SafeSearch চালু থাকবে।
