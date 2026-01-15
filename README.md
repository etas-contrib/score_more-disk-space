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

This repository provides an on-demand GitHub Actions workflow to evaluate different strategies for freeing disk space on GitHub-hosted Ubuntu runners.

What it does:
 - Runs on ubuntu-22.04 and ubuntu-24.04.
 - Tests multiple options:
	 - Manual deletion sets (minimal, light, standard, max) based on common large directories.
	 - Marketplace actions (latest stable):
		 - jlumbroso/free-disk-space@v1.3.1
		 - endersonmenezes/free-disk-space@v3
		 - easimon/maximize-build-space@v10
		 - AdityaGarg8/remove-unwanted-software@v5
 - Measures cleanup duration and space freed (bytes) for both `/` and the workspace mount.
 - Repeats each combination (configurable, default 3) and computes averages.
 - Publishes a markdown job summary with table and Mermaid chart, uploads CSV artifacts.

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

## Notes

 - “Workspace freed” is the most relevant metric for build/install tasks; “root freed” is also reported for reference.
 - The `easimon/maximize-build-space` action remounts the workspace; measurements reflect space available to build tasks.
 - Intensities map to typical removal sets:
	 - fast: minimal removals.
	 - standard: removes common SDKs/tooling.
	 - max: aggressive cleanup including caches, toolcache, swap, and large packages (where supported).

## Future Work

 - Make repeats configurable via input.
 - Add more intensity levels (1–10) and map to presets per action.
 - Provide a reusable composite action that wraps the chosen option based on a single “intensity” parameter.

# more-disk-space
GitHub Action to make more disk space available in Ubuntu based GitHub Actions runners
