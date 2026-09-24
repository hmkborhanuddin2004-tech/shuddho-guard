@echo off
chcp 65001 > nul
title শুদ্ধ গার্ড — উইন্ডোজ আনইনস্টলার

echo =================================================================
echo   🛡️ শুদ্ধ গার্ড: উইন্ডোজ আনইনস্টল যাচাইকরণ
echo =================================================================
echo.

:: অ্যাডমিন প্রিভিলেজ যাচাই
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~dpnx0\"\"' -Verb RunAs"
    exit /b
)

set /p PIN="অনুগ্রহ করে মাস্টার পিন (Master PIN) প্রবেশ করান: "
if not "%PIN%"=="1234" (
    echo.
    echo ❌ পিন ভুল হয়েছে! সুরক্ষা আনইনস্টল করা সম্ভব নয়।
    echo.
    pause
    exit /b 1
)

echo.
echo পিন সঠিক। সিস্টেম রিস্টোর করা হচ্ছে...
set SCRIPT_DIR=%~dp0
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%shuddho-pc-engine.ps1" -Uninstall

schtasks /delete /tn "ShuddhoGuardProtection" /f >nul 2>&1

echo.
echo =================================================================
echo  ✅ শুদ্ধ গার্ড সার্ভিস সফলভাবে নিষ্ক্রিয় করা হয়েছে।
echo =================================================================
echo.
pause
