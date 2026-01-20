//  Copyright (c) 2026 Contributors to the Eclipse Foundation

//  See the NOTICE file(s) distributed with this work for additional
//  information regarding copyright ownership.

//  This program and the accompanying materials are made available under the
//  terms of the Apache License Version 2.0 which is available at
//  https://www.apache.org/licenses/LICENSE-2.0

//  SPDX-License-Identifier: Apache-2.0

const { execSync, execFileSync } = require('child_process');
const fs = require('fs');


// Detect the runner environment from RUNNER_ENVIRONMENT variable
// Returns 'github-hosted' or 'self-hosted' (or 'unknown' if not set)
function runnerEnvironment() {
  return process.env.RUNNER_ENVIRONMENT || 'unknown';
}

// Check if running on a GitHub-hosted runner (as opposed to self-hosted)
function isGithubHosted() {
  return runnerEnvironment() === 'github-hosted';
}

// Get the operating system platform (returns 'linux', 'win32', 'darwin', etc.)
function platform() {
  return process.platform || 'unknown';
}

// Check if running on Linux
function isLinux() {
  return platform() === 'linux';
}

// Persist data to the post step via GITHUB_STATE file
// The post step (post.js) will read these values to report results
function persistForPostStep(stateObject) {
  if (!process.env.GITHUB_STATE) throw new Error('GITHUB_STATE not set');

  for (const [key, value] of Object.entries(stateObject)) {
    fs.appendFileSync(process.env.GITHUB_STATE, `${key}=${value}\n`);
  }
}

// Recursively remove a directory using 'rm -rf'
// Continues silently if removal fails (e.g., permission denied)
function rmRf(path) {
  try {
    execFileSync('sudo', ['rm', '-rf', path], { stdio: 'inherit' });
  } catch (error) {
    // Continue even if removal fails
    console.error(`Warning: Failed to remove ${path}`);
  }
}

// Execute cleanup for the specified level
// Level determines which directories to remove (1-4 progressively more)
function performCleanup(levelNum) {
  // Level 1: swift, chromium (fastest items, 4-6 GiB/sec)
  if (levelNum >= 1) {
    console.log('Removing swift...');
    rmRf('/usr/share/swift');
    console.log('Removing chromium...');
    rmRf('/usr/local/share/chromium');
  }

  // Level 2: + aws-cli, haskell (fast items, 0.5-0.6 GiB/sec)
  if (levelNum >= 2) {
    console.log('Removing aws-cli...');
    rmRf('/usr/local/aws-cli');
    console.log('Removing haskell...');
    rmRf('/usr/local/.ghcup');
    rmRf('/opt/ghc');
  }

  // Level 3: + miniconda, dotnet (medium items, 0.2 GiB/sec)
  if (levelNum >= 3) {
    console.log('Removing miniconda...');
    rmRf('/usr/share/miniconda');
    console.log('Removing dotnet...');
    rmRf('/usr/share/dotnet');
  }

  // Level 4: + android (bottleneck, 0.1 GiB/sec)
  if (levelNum >= 4) {
    console.log('Removing android...');
    rmRf('/usr/local/lib/android');
  }
}

function getAvailableSpaceGiB() {
  const out = execFileSync(
    'df',
    ['--output=avail', '-B1G', '/'],
    { encoding: 'utf8' }
  );

  return Number(out.trim().split('\n')[1]);
}

function parseLevel() {
  const level = process.env.INPUT_LEVEL || '2';

  // Validate level
  if (!/^[1-4]$/.test(level)) {
    console.error(`❌ Error: Invalid level '${level}'. Must be 1, 2, 3, or 4.`);
    process.exit(1);
  }

  return parseInt(level);
}

async function run() {
  try {
    const level = parseLevel();
    const githubHosted = isGithubHosted();
    const supportedPlatform = isLinux();

    persistForPostStep({ level, githubHosted, supportedPlatform });

    console.log(`🗑️  More Disk Space - Level ${level} cleanup`);
    console.log('');

    // Check if running on Linux
    if (!supportedPlatform) {
      console.log(`ℹ️  Unsupported platform: ${platform()}`);
      console.log('⏭️  This action only runs on Linux');
      console.log('');
      return;
    }


    // Measure before
    const before = getAvailableSpaceGiB();
    console.log(`Available space before: ${before} GiB`);
    console.log('');

    // Skip cleanup if not GitHub-hosted
    if (githubHosted) {
      console.log('✅ Running on GitHub-hosted runner');
      console.log('');

      // Perform cleanup
      performCleanup(level);

      // Measure after
      const after = getAvailableSpaceGiB();
      const freed = after - before;
      console.log('');
      console.log('✅ Cleanup complete!');
      console.log(`Available space after: ${after} GiB`);
      console.log(`Space freed: ${freed} GiB`);
    }
    else {
      console.log('ℹ️  Not running on GitHub-hosted runner - cleanup skipped');
      console.log('');
    }

  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

run();
