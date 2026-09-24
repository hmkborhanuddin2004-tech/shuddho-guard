@echo off
chcp 65001 > nul
title শুদ্ধ গার্ড — উইন্ডোজ স্থায়ী প্রোটেকশন ইনস্টলার

echo =================================================================
echo   🛡️ শুদ্ধ গার্ড (Shuddho Guard) — উইন্ডোজ স্বয়ংক্রিয় ইনস্টলার
echo =================================================================
echo.

:: অ্যাডমিন প্রিভিলেজ যাচাই এবং স্বয়ংক্রিয় এলিভেশন
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [অনুমতি প্রয়োজন] অ্যাডমিনিস্ট্রেটর হিসেবে চালু করা হচ্ছে...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~dpnx0\"\"' -Verb RunAs"
    exit /b
)

set SCRIPT_DIR=%~dp0
echo ১. সিস্টেম ফাইল ও ডিএনএস সুরক্ষা স্ক্রিপ্ট চালানো হচ্ছে...
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%shuddho-pc-engine.ps1" -Install

echo.
echo ২. উইন্ডোজ টাস্ক শিডিউলারে স্থায়ী সার্ভিস নিবন্ধন করা হচ্ছে...
schtasks /create /f /tn "ShuddhoGuardProtection" /tr "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%SCRIPT_DIR%shuddho-pc-engine.ps1\" -Monitor" /sc onlogon /rl HIGHEST >nul 2>&1

echo.
echo =================================================================
echo  🎯 [অভিনন্দন!] শুদ্ধ গার্ড উইন্ডোজ পিসি সুরক্ষা সফলভাবে সক্রিয় হয়েছে!
echo  - সমস্ত ব্রাউজারে গুগল, বিং ও ইউটিউব SafeSearch লক করা হয়েছে।
echo  - পর্ন ও প্রাপ্তবয়স্ক ডোমেইন ব্লক করা হয়েছে।
echo  - ক্লিনব্রাউজিং ফ্যামিলি ফিল্টার ডিএনএস সক্রিয় করা হয়েছে।
echo  - কম্পিউটার রিস্টার্ট দিলেও এটি স্বয়ংক্রিয়ভাবে সক্রিয় থাকবে।
echo =================================================================
echo.
pause
