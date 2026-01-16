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

async function cleanup() {
  try {
    console.log('');
    console.log('📊 Final disk space report');
    console.log('==========================');
    
    const final = getAvailableSpace();
    
    // Read level from state
    let level = 2; // default
    try {
      const state = fs.readFileSync(process.env.GITHUB_STATE, 'utf8');
      const match = state.match(/level=(\d)/);
      if (match) {
        level = parseInt(match[1]);
      }
    } catch (error) {
      // Use default if state reading fails
    }
    
    console.log(`Available space: ${final} GiB`);
    console.log('');
    
    // Suggest next level if running low
    if (final < 5) {
      if (level === 4) {
        console.log('⚠️  Warning: Less than 5 GiB remaining and already at max level (4).');
        console.log('   Consider using alternative actions (see docs/alternatives.md)');
      } else {
        const nextLevel = level + 1;
        console.log('⚠️  Warning: Less than 5 GiB remaining.');
        console.log(`   Consider increasing to level ${nextLevel} for your next run.`);
      }
    } else if (final < 10) {
      console.log(`✅ Moderate buffer remaining (${final} GiB)`);
    } else {
      // 10+ GiB remaining - suggest lower level
      console.log(`✅ Good buffer remaining (${final} GiB)`);
      if (level === 1) {
        console.log('💡 Tip: You have plenty of space remaining.');
        console.log('   You may not need this action for your workflow.');
      } else {
        const lowerLevel = level - 1;
        console.log('💡 Tip: You have plenty of space remaining.');
        console.log(`   Consider reducing to level ${lowerLevel} to speed up your workflow.`);
      }
    }
    
  } catch (error) {
    console.error('Warning: Failed to report final disk space');
    console.error(error.message);
    // Don't fail the job on cleanup errors
  }
}

cleanup();
