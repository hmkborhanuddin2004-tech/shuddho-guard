/**
 * Shuddho Guard — Unified E2E Test Runner & Verification Harness
 * 
 * Executes all 4 core defense pillar test suites plus auxiliary filters and backend:
 *   1. Pillar 1 (R1): Malicious Ad & Trap-Link Interceptor (tools/test-trap-detector.js)
 *   2. Pillar 2 (R2): PureGram Safe Telegram Client Integrity (tools/verify-puregram-integrity.js)
 *   3. Pillar 3 (R3): AI NSFW Vision Blur Engine & Benchmark (tools/test-nsfw-blur-engine.js)
 *   4. Pillar 4 (R4): Device Admin Watchdog & Rogue VPN Blocker (tools/test-device-admin-watchdog.js)
 *   5. Aux 1: Banglish Slang & Adult Lexicon Filter (tools/test-banglish-filter.js)
 *   6. Aux 2: Cloud Backend Health & Blacklist API (backend/test-backend.js)
 *   7. (Optional --gradle): Android JUnit Watchdog Test (cd android && gradlew.bat test)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Test suite definitions
const SUITES = [
  {
    id: 'pillar1-trap-detector',
    pillar: 'Pillar 1 (R1)',
    name: 'Trap-Link Interceptor & Ad Blocker',
    script: path.join(PROJECT_ROOT, 'tools', 'test-trap-detector.js'),
    expectedTests: 35,
    parseResults: (stdout) => {
      const match = stdout.match(/মোট টেস্ট:\s*(\d+),\s*উত্তীর্ণ:\s*(\d+)\/(\d+)/);
      if (match) {
        return { total: parseInt(match[1], 10), passed: parseInt(match[2], 10), failed: parseInt(match[1], 10) - parseInt(match[2], 10) };
      }
      return null;
    }
  },
  {
    id: 'pillar2-puregram-integrity',
    pillar: 'Pillar 2 (R2)',
    name: 'PureGram Safe Client Code Integrity',
    script: path.join(PROJECT_ROOT, 'tools', 'verify-puregram-integrity.js'),
    expectedTests: 33,
    parseResults: (stdout) => {
      const match = stdout.match(/PureGram Verification Results:\s*(\d+)\s*PASSED,\s*(\d+)\s*FAILED/i);
      if (match) {
        const passed = parseInt(match[1], 10);
        const failed = parseInt(match[2], 10);
        return { total: passed + failed, passed, failed };
      }
      return null;
    }
  },
  {
    id: 'pillar3-nsfw-blur-engine',
    pillar: 'Pillar 3 (R3)',
    name: 'AI NSFW Vision Blur Engine & Latency Benchmark',
    script: path.join(PROJECT_ROOT, 'tools', 'test-nsfw-blur-engine.js'),
    expectedTests: 33,
    parseResults: (stdout) => {
      const match = stdout.match(/BENCHMARK RESULTS:\s*(\d+)\s*Passed,\s*(\d+)\s*Failed/i);
      if (match) {
        const passed = parseInt(match[1], 10);
        const failed = parseInt(match[2], 10);
        return { total: passed + failed, passed, failed };
      }
      return null;
    }
  },
  {
    id: 'pillar4-device-admin-watchdog',
    pillar: 'Pillar 4 (R4)',
    name: 'Device Admin Watchdog & Rogue VPN Blocker',
    script: path.join(PROJECT_ROOT, 'tools', 'test-device-admin-watchdog.js'),
    expectedTests: 74,
    parseResults: (stdout) => {
      const match = stdout.match(/Test Summary:\s*Total\s*=\s*(\d+)\s*\|\s*Passed\s*=\s*(\d+)\s*\|\s*Failed\s*=\s*(\d+)/i);
      if (match) {
        return { total: parseInt(match[1], 10), passed: parseInt(match[2], 10), failed: parseInt(match[3], 10) };
      }
      return null;
    }
  },
  {
    id: 'aux-banglish-filter',
    pillar: 'Auxiliary',
    name: 'Bangla/Banglish Keyword & Slang Filter',
    script: path.join(PROJECT_ROOT, 'tools', 'test-banglish-filter.js'),
    expectedTests: 7,
    parseResults: (stdout) => {
      const match = stdout.match(/মোট টেস্ট:\s*(\d+),\s*উত্তীর্ণ:\s*(\d+)\/(\d+)/);
      if (match) {
        return { total: parseInt(match[1], 10), passed: parseInt(match[2], 10), failed: parseInt(match[1], 10) - parseInt(match[2], 10) };
      }
      return null;
    }
  },
  {
    id: 'aux-backend-api',
    pillar: 'Auxiliary',
    name: 'Cloud Backend Health, Blacklist & License API',
    script: path.join(PROJECT_ROOT, 'backend', 'test-backend.js'),
    expectedTests: 6,
    parseResults: (stdout) => {
      const passMatches = stdout.match(/টেস্ট:\s*PASS/g);
      if (passMatches) {
        const passed = passMatches.length;
        return { total: passed, passed, failed: 0 };
      }
      return null;
    }
  }
];

// CLI options
const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose') || args.includes('-v');
const isQuiet = args.includes('--quiet') || args.includes('-q');
const includeGradle = args.includes('--gradle');
const filterSuite = args.find(a => a.startsWith('--suite='))?.split('=')[1];

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgGreen: '\x1b[42m\x1b[30m\x1b[1m',
  bgRed: '\x1b[41m\x1b[37m\x1b[1m'
};

function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function runScript(suite) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdoutData = '';
    let stderrData = '';

    console.log(`\n${colors.cyan}${colors.bold}▶ Running [${suite.pillar}] ${suite.name}...${colors.reset}`);
    console.log(`${colors.gray}  File: ${path.relative(PROJECT_ROOT, suite.script)}${colors.reset}`);

    const child = spawn(process.execPath, [suite.script], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
      if (!isQuiet) {
        process.stdout.write(chunk);
      }
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
      if (!isQuiet) {
        process.stderr.write(chunk);
      }
    });

    child.on('error', (err) => {
      const duration = Date.now() - startTime;
      resolve({
        suite,
        exitCode: 1,
        duration,
        stdout: stdoutData,
        stderr: stderrData + '\n' + err.message,
        total: suite.expectedTests,
        passed: 0,
        failed: suite.expectedTests,
        error: err
      });
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      let parsed = null;
      try {
        if (suite.parseResults) {
          parsed = suite.parseResults(stdoutData);
        }
      } catch (e) {
        // Ignore parse error
      }

      const total = parsed ? parsed.total : suite.expectedTests;
      const passed = parsed ? parsed.passed : (code === 0 ? total : 0);
      const failed = parsed ? parsed.failed : (code === 0 ? 0 : total);

      resolve({
        suite,
        exitCode: code,
        duration,
        stdout: stdoutData,
        stderr: stderrData,
        total,
        passed,
        failed,
        success: code === 0 && failed === 0
      });
    });
  });
}

function runGradleTests() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    console.log(`\n${colors.cyan}${colors.bold}▶ Running [Pillar 4 (R4)] Android JUnit Watchdog Test (Gradle)...${colors.reset}`);

    const androidDir = path.join(PROJECT_ROOT, 'android');
    const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    const gradlewPath = path.join(androidDir, gradlewCmd);

    // Locate bundled portable JDK if JAVA_HOME not set or invalid
    const env = { ...process.env };
    const portableJdk = path.join(androidDir, '.jdk', 'jdk-17.0.10+7');
    if (fs.existsSync(portableJdk)) {
      env.JAVA_HOME = portableJdk;
      env.PATH = `${path.join(portableJdk, 'bin')};${env.PATH || ''}`;
    }

    let stdoutData = '';
    let stderrData = '';

    const child = process.platform === 'win32'
      ? spawn('cmd.exe', ['/c', gradlewCmd, 'test'], { cwd: androidDir, env })
      : spawn(gradlewPath, ['test'], { cwd: androidDir, env });

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
      if (!isQuiet) process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
      if (!isQuiet) process.stderr.write(chunk);
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const passed = code === 0 ? 5 : 0;
      resolve({
        suite: {
          pillar: 'Pillar 4 (R4)',
          name: 'Android JUnit Unit Tests (WatchdogUnitTest)'
        },
        exitCode: code,
        duration,
        stdout: stdoutData,
        stderr: stderrData,
        total: 5,
        passed,
        failed: code === 0 ? 0 : 5,
        success: code === 0
      });
    });
  });
}

async function main() {
  console.log('='.repeat(80));
  console.log(`${colors.bold}🛡️  SHUDDHO GUARD — MASTER VERIFICATION & TEST RUNNER${colors.reset}`);
  console.log(`${colors.gray}Environment: Node ${process.version} | Platform: ${process.platform} | Time: ${new Date().toISOString()}${colors.reset}`);
  console.log('='.repeat(80));

  const targetSuites = filterSuite
    ? SUITES.filter(s => s.id.includes(filterSuite) || s.pillar.toLowerCase().includes(filterSuite.toLowerCase()))
    : SUITES;

  if (targetSuites.length === 0) {
    console.error(`${colors.red}No test suites matched filter: ${filterSuite}${colors.reset}`);
    process.exit(1);
  }

  const results = [];
  const masterStart = Date.now();

  for (const suite of targetSuites) {
    const res = await runScript(suite);
    results.push(res);
  }

  if (includeGradle) {
    const gradleRes = await runGradleTests();
    results.push(gradleRes);
  }

  const masterDuration = Date.now() - masterStart;

  // Print Summary Table
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bold}📊 FINAL VERIFICATION & TEST EXECUTION SUMMARY${colors.reset}`);
  console.log('='.repeat(80));

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let allPassed = true;

  const colPillar = 18;
  const colName = 36;
  const colPass = 10;
  const colTime = 10;
  const colStatus = 10;

  console.log(
    `${colors.bold}${'Pillar / Tier'.padEnd(colPillar)} ` +
    `${'Suite Description'.padEnd(colName)} ` +
    `${'Tests'.padStart(colPass)} ` +
    `${'Duration'.padStart(colTime)} ` +
    `${'Status'.padStart(colStatus)}${colors.reset}`
  );
  console.log('-'.repeat(88));

  for (const r of results) {
    totalTests += r.total;
    totalPassed += r.passed;
    totalFailed += r.failed;
    if (!r.success) allPassed = false;

    const statusBadge = r.success
      ? `${colors.green}PASS ✅${colors.reset}`
      : `${colors.red}FAIL ❌${colors.reset}`;

    const testFraction = `${r.passed}/${r.total}`;

    console.log(
      `${r.suite.pillar.padEnd(colPillar)} ` +
      `${r.suite.name.slice(0, colName - 1).padEnd(colName)} ` +
      `${testFraction.padStart(colPass)} ` +
      `${formatDuration(r.duration).padStart(colTime)} ` +
      `${statusBadge.padStart(colStatus + (r.success ? 9 : 9))}`
    );
  }

  console.log('='.repeat(88));
  console.log(
    `${colors.bold}${'CUMULATIVE TOTALS:'.padEnd(colPillar + colName)} ` +
    `${`${totalPassed}/${totalTests}`.padStart(colPass)} ` +
    `${formatDuration(masterDuration).padStart(colTime)} ` +
    `${(allPassed ? '100% PASS' : 'FAILURES').padStart(colStatus)}${colors.reset}`
  );
  console.log('='.repeat(88));

  if (allPassed) {
    console.log(`\n${colors.bgGreen}  🎉 ACCEPTANCE CRITERIA 5 SATISFIED: ALL TEST SUITES PASSED CLEANLY (100%)  ${colors.reset}\n`);
    console.log(`  - Total Suites Executed: ${results.length}`);
    console.log(`  - Total Tests Verified:  ${totalTests}`);
    console.log(`  - Success Rate:          100.0%`);
    console.log(`  - Total Elapsed Time:    ${formatDuration(masterDuration)}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bgRed}  ❌ VERIFICATION FAILED: ONE OR MORE TEST SUITES ENCOUNTERED ERRORS  ${colors.reset}\n`);
    console.log(`  - Total Passed: ${totalPassed} / ${totalTests}`);
    console.log(`  - Total Failed: ${totalFailed}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
