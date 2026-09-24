# Dispatch Assignment — Worker M4 (Android DNS/VPN Filter & Vault)

**Target**: Milestone 4 (Android DNS/VPN Filter & Vault Hardening)
**Input Files**:
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/PROJECT.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/survey_explorer_2/handoff.md

**Exclusive File Ownership**:
- `android/` (all files)

**Tasks**:
1. Read `c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md` and `PROJECT.md`.
2. Inspect `android/app/src/main/java/com/shuddho/guard/services/ShuddhoVpnService.kt`.
3. Add Cloudflare Family IPv6 DNS `2606:4700:4700::1113` to `ShuddhoVpnService.kt` builder alongside CleanBrowsing (`185.228.168.10`) and Cloudflare Family IPv4 (`1.1.1.3`).
4. Ensure IPv6 address configuration (`addAddress("fd00:1::1", 64)` or appropriate interface address) is added if IPv6 DNS is configured to avoid Android OS network stack exceptions.
5. Review `StealthCalculatorActivity.kt` and ensure clean code, PIN mechanism (`1234=`), and documentation for setup and usage.
6. Verify code syntax and consistency across all Kotlin files in `android/app/src/main/java/com/shuddho/guard/`.
7. Document all changes and verification in `handoff.md` and report back.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-23T16:50:38Z
You are worker_m4, a teamwork_preview_worker for Shuddho Guard.
Your working directory is: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/worker_m4
Project root: c:/Users/assdi/Documents/Downloads/shuddho-guard
Authoritative User Request: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md
Master Project Specification: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/PROJECT.md
Your assignment is in: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/worker_m4/DISPATCH.md

Exclusive Write Ownership:
- `android/` (all files)
DO NOT touch any files outside this directory.

Tasks:
1. Read ORIGINAL_REQUEST.md and PROJECT.md.
2. Read survey findings in c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/survey_explorer_2/handoff.md.
3. Inspect `android/app/src/main/java/com/shuddho/guard/services/ShuddhoVpnService.kt`.
4. Add Cloudflare Family IPv6 DNS `2606:4700:4700::1113` to `ShuddhoVpnService.kt` builder alongside CleanBrowsing (`185.228.168.10`) and Cloudflare Family IPv4 (`1.1.1.3`).
5. Ensure IPv6 configuration on the VPN builder (e.g. `addAddress("fd00:1::1", 64)`) to avoid IPv6 DNS route errors on dual-stack networks.
6. Verify `StealthCalculatorActivity.kt`, PIN mechanism (`1234=`), and documentation for setup and usage.
7. Write `handoff.md` in your working directory documenting changes and architecture.
8. Send a message to your parent orchestrator when complete.
