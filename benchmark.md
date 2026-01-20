<!--
 Copyright (c) 2026 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0

 SPDX-License-Identifier: Apache-2.0
-->

# More Disk Space – Benchmark Workflow

This repository provides an on-demand GitHub Actions workflow to evaluate different strategies for freeing disk space on GitHub-hosted Ubuntu runners.

## Architecture

**Workflow**: `.github/workflows/benchmark-disk-space.yml`
- Triggers on `workflow_dispatch` with optional `repeats` parameter (1-5, default 3)
- 5 benchmark jobs (manual, jlumbroso, enderson, easimon, adityagarg) × 2 images × varying intensities × repeats
- Total: ~96-200 jobs depending on repeat count

**Composite Actions**:
- `.github/actions/measure-before/action.yml`: Captures baseline disk state, outputs start timestamp
- `.github/actions/measure-after/action.yml`: Measures final state, computes freed space and duration (except easimon which inlines the logic to survive workspace remount)

**Aggregation**:
- `scripts/aggregate.py`: Reads per-run CSVs, groups by (image, option, intensity), computes averages, generates markdown summary with Mermaid chart

## How It Works

1. **Before Cleanup**: Measure available bytes on `/` and workspace
2. **Action-Specific Cleanup**: Run one of the 5 cleanup approaches at selected intensity
3. **After Cleanup**: Measure again, compute freed bytes and duration
4. **Metrics**: Write CSV row with all measurements
5. **Aggregation**: Combine all CSVs, average by group, generate summary

## Intensity Levels

Each action supports 3-4 intensity levels:
- **minimal**: Smallest cleanup (tool-cache only for most)
- **light**: Moderate cleanup (add dotnet, android, etc.)
- **standard**: Aggressive (add haskell, swap, etc.)
- **max**: Full cleanup (includes packages, folders, swap, docker prune)

## Run It On Demand

Trigger the workflow manually from the Actions tab:
1. Open “Benchmark Disk Space Options”.
2. Click “Run workflow”.
3. The workflow will run a matrix over runners, options, intensities, and 3 repeats.

## Outputs

 - Job Summary: A table with averages per image/option/intensity.
 - Artifacts:
	 - Per-run CSV: `metrics.csv` with columns: image, option, intensity, repeat, before_root, after_root, freed_root, before_ws, after_ws, freed_ws, duration_seconds.
	 - Combined CSV: `combined.csv` aggregating all runs for downstream analysis.
