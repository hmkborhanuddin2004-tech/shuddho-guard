# Orchestration Plan — Shuddho Guard

## Objectives
Deliver the complete, tested, and hardened "Shuddho Guard" content protection system for Bangladesh meeting all requirements R1-R4 and all acceptance criteria.

## Phase 0: Survey & Scope Discovery
- Dispatch 3 exploratory agents:
  1. Explorer 1 (`teamwork_preview_spec_miner`): Focus on existing workspace structure, acceptance criteria tests (`tools/test-banglish-filter.js`, `tools/test-trap-detector.js`, `backend/test-backend.js`), and identify missing components or gaps.
  2. Explorer 2 (`teamwork_preview_explorer`): Focus on R1 (Chrome Extension Manifest V3, icons, popup, honey-trap interceptor) and R2 (Android DNS/VPN filter, VpnService, PIN-protected vault).
  3. Explorer 3 (`teamwork_preview_explorer`): Focus on R3 (Windows hosts blocker, elevation detection, SafeSearch, silent execution) and R4 (Cloud backend Express endpoints, blacklist sync, reporting).

## Phase 1: Synthesize & Establish Project Scope
- Aggregate survey reports into `PROJECT.md` and `TEST_INFRA.md`.
- Establish interfaces, directory boundaries, and clear milestones.

## Phase 2: Implementation & Testing Tracks
- Milestone 1: Banglish & Trap Interceptor Engine + Chrome Extension (R1).
- Milestone 2: Cloud Backend Sync Server & API (R4).
- Milestone 3: Windows Host & SafeSearch Blocker (R3).
- Milestone 4: Android DNS & Safety Filter (R2).
- E2E Test Suite Development (Tiers 1-4).

## Phase 3: Verification, Hardening & Acceptance Gates
- Run all automated tests:
  - `tools/test-banglish-filter.js` (7/7)
  - `tools/test-trap-detector.js` (4/4)
  - `backend/test-backend.js` (4 endpoints)
  - Manifest V3 validation & assets check
  - Windows elevation & silent scripts check
- Forensic Audit verification (`teamwork_preview_auditor`).
- Adversarial hardening.

## Phase 4: Final Reporting
- Present completed system and verification results to sentinel.
