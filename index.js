//  Copyright (c) 2026 Contributors to the Eclipse Foundation

//  See the NOTICE file(s) distributed with this work for additional
//  information regarding copyright ownership.

//  This program and the accompanying materials are made available under the
//  terms of the Apache License Version 2.0 which is available at
//  https://www.apache.org/licenses/LICENSE-2.0

//  SPDX-License-Identifier: Apache-2.0

const { execSync } = require('child_process');
const fs = require('fs');

function getAvailableSpace() {
  const output = execSync("df --output=avail -B1073741824 / | tail -1", { encoding: 'utf8' });
  return parseInt(output.trim());
}

function rmrf(path) {
  try {
    execSync('sudo', ['rm', '-rf', path], { stdio: 'inherit' });
  } catch (error) {
    // Continue even if removal fails
    console.error(`Warning: Failed to remove ${path}`);
  }
}

async function run() {
  try {
    const level = process.env.INPUT_LEVEL || '2';
    
    console.log(`🗑️  More Disk Space - Level ${level} cleanup`);
    console.log('');
    
    // Validate level
    if (!/^[1-4]$/.test(level)) {
      console.error(`❌ Error: Invalid level '${level}'. Must be 1, 2, 3, or 4.`);
      process.exit(1);
    }
    
    const levelNum = parseInt(level);
    
    // Save level for post step
    fs.appendFileSync(process.env.GITHUB_STATE, `level=${level}\n`);
    
    // Measure before
    const before = getAvailableSpace();
    console.log(`Available space before: ${before} GiB`);
    console.log('');
    
    // Level 1: swift, chromium (fastest items, 4-6 GiB/sec)
    if (levelNum >= 1) {
      console.log('Removing swift...');
      rmrf('/usr/share/swift');
      console.log('Removing chromium...');
      rmrf('/usr/local/share/chromium');
    }
    
    // Level 2: + aws-cli, haskell (fast items, 0.5-0.6 GiB/sec)
    if (levelNum >= 2) {
      console.log('Removing aws-cli...');
      rmrf('/usr/local/aws-cli');
      console.log('Removing haskell...');
      rmrf('/usr/local/.ghcup');
      rmrf('/opt/ghc');
    }
    
    // Level 3: + miniconda, dotnet (medium items, 0.2 GiB/sec)
    if (levelNum >= 3) {
      console.log('Removing miniconda...');
      rmrf('/usr/share/miniconda');
      console.log('Removing dotnet...');
      rmrf('/usr/share/dotnet');
    }
    
    // Level 4: + android (bottleneck, 0.1 GiB/sec)
    if (levelNum >= 4) {
      console.log('Removing android...');
      rmrf('/usr/local/lib/android');
    }
    
    // Measure after
    const after = getAvailableSpace();
    const freed = after - before;
    console.log('');
    console.log('✅ Cleanup complete!');
    console.log(`Available space after: ${after} GiB`);
    console.log(`Space freed: ${freed} GiB`);
    
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

run();
