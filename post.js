//  Copyright (c) 2026 Contributors to the Eclipse Foundation

//  See the NOTICE file(s) distributed with this work for additional
//  information regarding copyright ownership.

//  This program and the accompanying materials are made available under the
//  terms of the Apache License Version 2.0 which is available at
//  https://www.apache.org/licenses/LICENSE-2.0

//  SPDX-License-Identifier: Apache-2.0

const { execFileSync } = require('child_process');

// Get available disk space in GiB (gigabytes)
function getAvailableSpaceGiB() {
  const out = execFileSync(
    'df',
    ['--output=avail', '-B1G', '/'],
    { encoding: 'utf8' }
  );

  return Number(out.trim().split('\n')[1]);
}


// Provide helpful suggestions based on available disk space
// Suggests increasing cleanup level if space is low
// Suggests reducing cleanup level if plenty of space remains
function reportSuggestions(availableGiB, level) {
  // Suggest next level if running low
  if (availableGiB < 5) {
    if (level === 4) {
      console.log('⚠️  Warning: Less than 5 GiB remaining and already at max level (4).');
      console.log('   Consider using alternative actions (see docs/alternatives.md)');
    } else {
      console.log('⚠️  Warning: Less than 5 GiB remaining.');
      console.log(`   Consider increasing to level ${level + 1} for your next run.`);
    }
  } else if (availableGiB < 10) {
    console.log(`✅ Moderate buffer remaining (${availableGiB} GiB)`);
  } else {
    // 10+ GiB remaining - suggest lower level
    console.log(`✅ Good buffer remaining (${availableGiB} GiB)`);
    if (level === 1) {
      console.log('💡 Tip: You have plenty of space remaining.');
      console.log('   You may not need this action for your workflow.');
    } else {
      console.log('💡 Tip: You have plenty of space remaining.');
      console.log(`   Consider reducing to level ${level - 1} to speed up your workflow.`);
    }
  }
}


function getState(name) {
  return process.env[`STATE_${name}`];
}

function getStateBool(name) {
  return getState(name) === 'true';
}

function getStateInt(name, fallback) {
  const v = Number(getState(name));
  return Number.isFinite(v) ? v : fallback;
}


async function cleanup() {
  try {
    console.log('');
    console.log('📊 Final disk space report');
    console.log('==========================');

    // Step 1: Read state information that was persisted by the main step (index.js)
    const level = getStateInt('level', 2);
    const githubHosted = getStateBool('githubHosted');
    const supportedPlatform = getStateBool('supportedPlatform');

    // Step 2: If platform is unsupported, skip disk space reporting
    if (!supportedPlatform) {
      console.log(`⏭️  Unsupported platform; skipping disk space report`);
      console.log('');
      return;
    }

    // Step 3: Report current disk space
    const availableGiB = getAvailableSpaceGiB();
    console.log(`Available space: ${availableGiB} GiB`);
    console.log('');

    // Step 4: Provide suggestions for future runs
    if (githubHosted) {
      reportSuggestions(availableGiB, level);
    }

  } catch (error) {
    console.error('Warning: Failed to report final disk space');
    console.error(error.message);
    // Don't fail the job on cleanup errors
  }
}

cleanup();
