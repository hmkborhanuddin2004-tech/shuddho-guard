@echo off
chcp 65001 > nul
title শুদ্ধ গার্ড — আনইনস্টলার

net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
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

set "SCRIPT_DIR=%~dp0"
set "ENGINE=%SCRIPT_DIR%shuddho-pc-engine.ps1"

echo শুদ্ধ গার্ড সুরক্ষা সরিয়ে ফেলা হচ্ছে...

schtasks /delete /f /tn "ShuddhoGuardProtection" >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -File "%ENGINE%" -Mode Uninstall

echo.
echo ✅ শুদ্ধ গার্ড সফলভাবে আনইনস্টল হয়েছে।
echo    (hosts ফাইল ব্যাকআপ থেকে রিস্টোর হয়েছে, DNS রিসেট হয়েছে, টাস্ক ডিলিট হয়েছে)
pause
