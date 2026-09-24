# Shuddho PC Guard Native PowerShell Engine
param (
    [ValidateSet("Install", "Uninstall", "Monitor")]
    [string]$Mode = "Install"
)

$hostsPath = "$env:windir\System32\drivers\etc\hosts"
$backupPath = "$env:windir\System32\drivers\etc\hosts.shuddho.bak"

$safeSearchEntries = @(
    # --- Google SafeSearch (forcesafesearch) ---
    "216.239.38.120 forcesafesearch.google.com",
    "216.239.38.120 www.google.com",
    "216.239.38.120 google.com",
    "216.239.38.120 www.google.com.bd",

    # --- Bing Strict SafeSearch ---
    "204.79.197.220 strict.bing.com",
    "204.79.197.220 www.bing.com",
    "204.79.197.220 bing.com",

    # --- YouTube Restricted Mode ---
    "216.239.38.119 restrict.youtube.com",
    "216.239.38.119 www.youtube.com",
    "216.239.38.119 m.youtube.com",
    "216.239.38.119 youtubei.googleapis.com",
    "216.239.38.119 youtube.googleapis.com"
)

$blockedDomains = @(
    "pornhub.com", "www.pornhub.com", "rt.pornhub.com",
    "xvideos.com", "www.xvideos.com", "xvideos2.com",
    "xnxx.com", "www.xnxx.com",
    "xhamster.com", "www.xhamster.com", "xhamster.desi",
    "chaturbate.com", "bongacams.com", "stripchat.com",
    "onlyfans.com",
    "deshiboudi.com", "banglachoti.com", "chotikahini.com",
    "bdchoti.net", "chotigolpo.com", "banglasex.net",
    "redwap.me", "spankbang.com", "tube8.com", "youporn.com",
    "tnaflix.com", "beeg.com", "brazzers.com", "eporner.com",
    "1xbet.com", "melbet.org", "babu88.com", "jeetbuzz.com", "1win.pro"
)

function Install-ShuddhoProtection {
    Write-Host "[1/3] ব্যাকআপ তৈরি ও হোস্ট ফাইল প্রস্তুত করা হচ্ছে..." -ForegroundColor Cyan
    if (!(Test-Path $backupPath) -and (Test-Path $hostsPath)) {
        Copy-Item $hostsPath $backupPath -Force
    }

    try { Set-ItemProperty -Path $hostsPath -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue } catch {}

    Write-Host "[2/3] সেফ সার্চ ও পর্ন/জুয়া ব্লকিং রুলস অন্তর্ভুক্ত করা হচ্ছে..." -ForegroundColor Cyan
    $currentHosts = Get-Content $hostsPath -Raw -ErrorAction SilentlyContinue
    if (-not $currentHosts) { $currentHosts = "" }

    # FIX #8: পূর্বের কোনো শুদ্ধ গার্ড ব্লক থাকলে তা প্রথমে মুছে ফেলা
    $currentHosts = [regex]::Replace(
        $currentHosts,
        '(?ms)^[ \t]*# === SHUDDHO GUARD SAFE PROTECTION START ===.*?^[ \t]*# === SHUDDHO GUARD SAFE PROTECTION END ===[ \t]*\r?\n?',
        ''
    )

    $newEntries = New-Object System.Text.StringBuilder
    [void]$newEntries.AppendLine($currentHosts.TrimEnd())
    [void]$newEntries.AppendLine("`n# === SHUDDHO GUARD SAFE PROTECTION START ===")

    foreach ($entry in $safeSearchEntries) {
        $pattern = '(?m)^[ \t]*' + [regex]::Escape($entry) + '[ \t]*$'
        if ($currentHosts -notmatch $pattern) {
            [void]$newEntries.AppendLine($entry)
        }
    }

    foreach ($domain in $blockedDomains) {
        $blockLine = "0.0.0.0 $domain"
        $pattern = '(?m)^[ \t]*' + [regex]::Escape($blockLine) + '[ \t]*$'
        if ($currentHosts -notmatch $pattern) {
            [void]$newEntries.AppendLine($blockLine)
        }
    }
    [void]$newEntries.AppendLine("# === SHUDDHO GUARD SAFE PROTECTION END ===")

    # FIX #10(a): UTF-8 BOM ছাড়া ASCII ফরম্যাটে সেভ
    [System.IO.File]::WriteAllText($hostsPath, $newEntries.ToString(), [System.Text.Encoding]::ASCII)

    Write-Host "[3/3] ফ্যামিলি ডিএনএস (CleanBrowsing & Cloudflare) সক্রিয় করা হচ্ছে..." -ForegroundColor Cyan
    try {
        # FIX #20: ভার্চুয়াল অ্যাডাপ্টার বাদ দেওয়া
        $adapters = Get-NetAdapter | Where-Object {
            $_.Status -eq "Up" -and
            $_.InterfaceDescription -notmatch "Virtual|VMware|Hyper-V|Loopback|TAP|VPN|WSL|Tailscale|WireGuard|Docker"
        }
        foreach ($adapter in $adapters) {
            Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses ("185.228.168.10", "1.1.1.3") -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Warning "DNS অ্যাডাপ্টার কনফিগারেশনে সতর্কতা: $_"
    }

    Clear-DnsClientCache -ErrorAction SilentlyContinue
    Write-Host "✅ সুরক্ষা সফলভাবে সক্রিয় হয়েছে।" -ForegroundColor Green
}

function Restore-ShuddhoProtection {
    Write-Host "হোস্ট ফাইল এবং ডিএনএস পূর্বের অবস্থায় ফিরিয়ে নেওয়া হচ্ছে..." -ForegroundColor Yellow

    # Scheduled Task মুছে ফেলা
    try {
        schtasks.exe /delete /f /tn "ShuddhoGuardProtection" 2>&1 | Out-Null
        Write-Host "  ✓ Scheduled Task সরানো হয়েছে।" -ForegroundColor Green
    } catch {}

    try { Set-ItemProperty -Path $hostsPath -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue } catch {}

    if (Test-Path $backupPath) {
        Copy-Item $backupPath $hostsPath -Force
        Write-Host "  ✓ hosts ফাইল ব্যাকআপ থেকে রিস্টোর হয়েছে।" -ForegroundColor Green
    } else {
        $raw = Get-Content $hostsPath -Raw -ErrorAction SilentlyContinue
        if ($raw) {
            $cleaned = [regex]::Replace(
                $raw,
                '(?ms)^[ \t]*# === SHUDDHO GUARD SAFE PROTECTION START ===.*?^[ \t]*# === SHUDDHO GUARD SAFE PROTECTION END ===[ \t]*\r?\n?',
                ''
            )
            [System.IO.File]::WriteAllText($hostsPath, $cleaned, [System.Text.Encoding]::ASCII)
            Write-Host "  ✓ hosts থেকে শুদ্ধ গার্ড রুলস সরানো হয়েছে।" -ForegroundColor Green
        }
    }

    try {
        $adapters = Get-NetAdapter | Where-Object {
            $_.Status -eq "Up" -and
            $_.InterfaceDescription -notmatch "Virtual|VMware|Hyper-V|Loopback|TAP|VPN|WSL|Tailscale|WireGuard|Docker"
        }
        foreach ($adapter in $adapters) {
            Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ResetServerAddresses -ErrorAction SilentlyContinue
        }
        Write-Host "  ✓ DNS স্বাভাবিক অবস্থায় ফিরিয়ে আনা হয়েছে।" -ForegroundColor Green
    } catch {}

    Clear-DnsClientCache -ErrorAction SilentlyContinue
    Write-Host "✅ সিস্টেম স্বাভাবিক অবস্থায় ফিরে এসেছে।" -ForegroundColor Green
}

switch ($Mode) {
    "Install"   { Install-ShuddhoProtection }
    "Monitor"   { Install-ShuddhoProtection }
    "Uninstall" { Restore-ShuddhoProtection }
    default     { Write-Warning "অজানা মোড: $Mode" }
}
