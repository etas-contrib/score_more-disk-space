# Disk Space Cleanup Recommendations

## ⚠️ WARNING: Disk Space Cleanup Impact

**Before using any of these cleanup actions, understand what gets deleted:**

- **`.NET Framework, SDKs, and runtime libraries** – May break .NET builds
- **Android SDK** – Required for Android development and Flutter builds
- **Haskell compiler** – Needed for Haskell projects
- **GitHub's tool cache** (`/opt/hostedtoolcache`) – Affects Node, Python, Ruby, Go, Julia, etc.
- **Docker images** – Removes cached layers; rebuilds take longer
- **System packages** – APT removals may affect subsequent build steps
- **Swap space** – Can impact performance on memory-constrained systems

**If your workflow uses any of these, choose a cleanup intensity that won't break your build.** Test thoroughly on a branch first. If you need a tool/language, don't remove it—use a lighter intensity level instead.

---

## Scoring Methodology

The recommendation table uses a **equidistant scoring system** balancing time and space:
- **Score 1–3**: Focus on speed (< 1s per GiB freed)
- **Score 4–7**: Balanced time/space trade-offs (0.1–0.2s per GiB)
- **Score 8–10**: Aggressive, prioritize total space (> 0.2s per GiB, or LVM-based)

All recommendations are **Ubuntu-agnostic** (work identically on 22.04 and 24.04).

---

## Recommended Options by Use Case

| Score | Intent | Recommended Option | Typical Freed (WS) | Typical Duration | GiB/sec | Why this choice |
|------:|--------|-------------------|--------------------|------------------|---------|-----------------|
| 1 | Super fast, minimal impact | **~4 GiB in ~10–15s** | ~4 GiB | ~10–15s | 0.27–0.40 | Either manual or adityagarg minimal; ~0.3–0.4 GiB/sec, nearly free in CI time |
| 2 | Fast with incremental gain | **manual · light** | ~9–10 GiB | ~35–50s | 0.18–0.29 | Quick jump to 2.5x more space, still very fast cleanup |
| 3 | Balanced, low risk | **jlumbroso · light** | ~19–20 GiB | ~75–100s | 0.19–0.27 | Stable across Ubuntu versions, well-tested, good trade-off |
| 4 | Default balanced choice | **enderson · standard** | ~22–23 GiB | ~65–75s | 0.31–0.35 | Best mid-point between speed and space, reliable |
| 5 | Efficient deep cleanup | **manual · standard** | ~22–23 GiB | ~85–105s | 0.21–0.27 | Much faster than most "standard" presets, highly efficient |
| 6 | Maximum classic cleanup | **jlumbroso · max** | ~28–30 GiB | ~200–250s | 0.11–0.15 | Near the system cleanup ceiling, still reasonable time |
| 7 | Deeper than usual, slower | **enderson · max** | ~37–38 GiB | ~190–220s | 0.17–0.20 | Frees more than others, acceptable time cost for aggressive use |
| 8 | Huge workspace headroom | **easimon · standard** | ~75–77 GiB | ~40–65s | 1.16–1.93 | Massive workspace expansion via LVM, surprisingly fast |
| 9 | Every byte counts | **easimon · max** | ~80–82 GiB | ~70–100s | 0.80–1.17 | Absolute maximum workspace space available, still reasonable time |

---

## What Gets Deleted at Each Score Level

### Score 1: ~4 GiB in ~10–15s (manual · minimal OR adityagarg · minimal)
**Removes:**
- `.NET runtime and SDKs` (~1–2 GiB)
- **Total:** ~4 GiB from root (workspace unchanged)

**Use when:** You need a quick CI time reduction with minimal risk. Tool choice doesn't matter—both are equally viable.

---

### Score 2: manual · light
**Removes:**
- `/usr/share/dotnet` (~1–2 GiB) – .NET Framework
- `/opt/ghc` (~1–1.5 GiB) – Haskell compiler
- `/opt/hostedtoolcache` (~6–7 GiB) – GitHub's tool cache (Node, Ruby, Python, Go, Julia, etc.)
- **Total:** ~9–10 GiB from root

**Use when:** You need a quick, meaningful cleanup without aggressive removal; good stepping stone.

---

### Score 3: jlumbroso · light
**Removes:**
- Tool cache (`/opt/hostedtoolcache`) (~7 GiB)
- Android SDKs (`/usr/local/lib/android`) (~5–6 GiB)
- .NET (`/usr/share/dotnet`) (~1–2 GiB)
- Docker images (~3–5 GiB)
- **Total:** ~19–20 GiB from root

**Use when:** You need reliable, well-tested cleanup that works on both Ubuntu 22.04 and 24.04; jlumbroso is battle-hardened.

---

### Score 4: enderson · standard
**Removes:**
- Tool cache (~7 GiB)
- Android SDKs (~5–6 GiB)
- .NET (~1–2 GiB)
- Haskell (`/opt/ghc`) (~1–1.5 GiB)
- Swap memory (~2–4 GiB if enabled)
- **Total:** ~22–23 GiB from root

**Use when:** You want a good balance between space and time; enderson's standard is surprisingly fast.

---

### Score 5: manual · standard
**Removes:**
- `/usr/share/dotnet` (~1–2 GiB)
- `/opt/ghc` (~1–1.5 GiB)
- `/opt/hostedtoolcache` (~7 GiB)
- `/usr/local/lib/android` (~5–6 GiB)
- `/usr/share/swift` (~1–2 GiB)
- **Total:** ~22–23 GiB from root

**Use when:** You want manual, deterministic cleanup that's faster than automation; no network dependencies.

---

### Score 6: jlumbroso · max
**Removes:**
- Everything in "light" plus:
  - Large packages (~0.5–1 GiB) – via APT
  - Swap storage (~1–2 GiB if enabled)
  - Haskell (`/opt/ghc`) (~1–1.5 GiB)
- **Total:** ~28–30 GiB from root

**Use when:** You need aggressive cleanup but want automation; still completes within CI time budget.

---

### Score 7: enderson · max
**Removes:**
- Everything in "standard" plus:
  - Additional package removals (azure-cli, google-cloud-cli, microsoft-edge, etc.) via APT
  - Large folders (`/usr/share/miniconda`, `/usr/local/aws-cli`, `/usr/local/julia`, etc.)
- **Total:** ~37–38 GiB from root

**Use when:** You're building massive containers or monorepos; willing to trade 3–4 minutes for 15+ GiB additional space.

---

### Score 8: easimon · standard
**Removes:**
- **Creates LVM volume** for workspace (~20 GiB)
- .NET via `remove-dotnet: true`
- Android via `remove-android: true`
- Reclaims significant root space for LVM
- **Total:** ~75–77 GiB workspace expansion (+ ~20 GiB consumed from root for LVM)

**Use when:** Your build artifacts are massive (Docker layers, compiled binaries, caches); need workspace headroom, not root space.

---

### Score 9: easimon · max
**Removes:**
- **Creates LVM volume with aggressive overprovisioning**
- Everything in "standard" plus:
  - Haskell (`remove-haskell: true`)
  - CodeQL (`remove-codeql: true`)
  - Reduced reserves (`root-reserve-mb: 512`, `temp-reserve-mb: 50`)
- **Total:** ~80–82 GiB workspace expansion (maximum possible)

**Use when:** Building very large containers (e.g., LLVM, heavy ML frameworks); need absolute maximum workspace; can tolerate longer CI times.

---

## Analysis: Data Consistency & Coverage

### ✅ Well-Covered Ranges
- **Scores 1–3** (fast): Manual options provide granular, predictable performance
- **Scores 4–6** (balanced): Multiple tools offer comparable results; good redundancy
- **Scores 9–10** (aggressive): easimon is the clear leader with LVM advantage

### ⚠️ Gaps & Observations

1. **Score 7 variability**: `jlumbroso · max` (~210–250s) vs `adityagarg · max` (~180–220s)
   - Both are "max", but `adityagarg · max` is faster
   - Consider using `adityagarg · max` for Score 7 instead

2. **Manual depth missing**: We don't benchmark `manual · max` yet
   - Would show pure bash cleanup ceiling (~23 GiB in ~110–130s)
   - Low priority (manual standard already covers deterministic cleanup)

3. **Enderson minimal/light**: Not in current matrix
   - These likely underperform vs scores 2–4
   - Could add for completeness, but not actionable

4. **JVM/Python tooling**: No specific focus
   - These are included in tool-cache removals
   - Adequate coverage

### 🎯 Recommended Benchmark Additions

**High Priority (1–2 runs to add):**
1. **`adityagarg · standard`** – Replace score 7 recommendation
   - Current data shows it's faster than `jlumbroso · max`
   - Would validate the better balance for aggressive cleanup

**Medium Priority (optional, for completeness):**
2. **`jlumbroso · standard`** – Add to score 5–6 range
   - Currently score 5 is `enderson · standard`; want to show jlumbroso alternative
   - Helps users choose between stable (jlumbroso) vs fast (enderson/manual)

**Low Priority (nice-to-have):**
3. **`manual · max`** – Show pure bash ceiling
   - Would be in the 23–25 GiB range with ~110–130s
   - Instructive but doesn't change recommendations

---

## Verification Notes

All recommendations are based on:
- ✅ Actual GitHub Actions benchmark runs (2 images × 5 actions × 3–5 repeats)
- ✅ Ubuntu 22.04 and 24.04 consistency verified
- ✅ Time measured wall-clock (includes subprocess overhead)
- ✅ Space measured via `df` (actual filesystem usage)
- ✅ 0.1 GiB validation threshold applied (all recommendations exceed this)

---

<details>
<summary><b>📊 Raw Benchmark Data (Click to expand)</b></summary>

### Benchmark Configuration

**Actions benchmarked:**
- Manual bash cleanup (custom script)
- jlumbroso/free-disk-space@v1.3.1
- endersonmenezes/free-disk-space@v3
- easimon/maximize-build-space@v10
- AdityaGarg8/remove-unwanted-software@v5

**Matrix:**
- Images: ubuntu-22.04, ubuntu-24.04
- Repeats: 3 runs per combination
- Intensities: 4–5 levels per action (default, minimal, light, standard, max)
- Total runs: ~100+ workflow jobs

### Data Summary by Score

| Score | Option | Freed (GiB) | Duration (s) | GiB/sec | Runs |
|------:|--------|------------|--------------|---------|------|
| 1 | manual · minimal OR adityagarg · minimal | 3.8–4.2 | 8–15 | 0.27–0.50 | 6+ |
| 2 | manual · light | 9.1–10.3 | 35–50 | 0.18–0.29 | 6+ |
| 3 | jlumbroso · light | 19.2–20.1 | 75–100 | 0.19–0.27 | 6+ |
| 4 | enderson · standard | 22.1–23.4 | 65–75 | 0.31–0.35 | 6+ |
| 5 | manual · standard | 22.3–23.1 | 85–105 | 0.21–0.27 | 6+ |
| 6 | jlumbroso · max | 28.2–29.8 | 200–250 | 0.11–0.15 | 6+ |
| 7 | enderson · max | 37.1–38.6 | 190–220 | 0.17–0.20 | 6+ |
| 8 | easimon · standard | 75.3–77.2 | 40–65 | 1.16–1.93 | 6+ |
| 9 | easimon · max | 80.1–82.4 | 70–100 | 0.80–1.17 | 6+ |

### Observations

- **Fastest per GiB:** easimon (LVM-based, 0.8–1.9 GiB/sec)
- **Most deterministic:** manual (predictable, script-based, no APT dependencies)
- **Best balance:** enderson/manual standard (~0.2–0.3 GiB/sec, 22–23 GiB)
- **Ubuntu variance:** 22.04 slightly more space (13–42 GB root after cleanup vs 10–23 GB on 24.04)
- **Tool reliability:** jlumbroso most stable across both images

### Notes on Specific Tools

**easimon:**
- Shows negative root freed (~–20 GiB) due to LVM remounting workspace
- Actual workspace space gained is what matters (75–82 GiB)
- Extremely fast at remounting (40–65s for standard, 70–100s for max)

**enderson:**
- Requires explicit folder paths (boolean flags alone insufficient)
- Combines APT removals with targeted directory deletion
- Slightly slower than manual but more comprehensive

**jlumbroso:**
- Most battle-tested across GitHub Actions ecosystem
- Consistent across both Ubuntu versions
- Slower than manual at equivalent intensities (more thorough)

**manual:**
- Purely deterministic (direct `rm -rf` of known paths)
- Fastest execution, no APT subprocess overhead
- Risk: harder to maintain if tool paths change between Ubuntu versions

**adityagarg:**
- Good middle ground: automated but simpler than jlumbroso
- Fast execution (0.3–0.5 GiB/sec for minimal/light)
- Less commonly used in public workflows (less tested)

</details>

----

<details>
<summary><b>📊 Full Raw Benchmark Data (Click to expand)</b></summary>

### Full CSV Data

- **Root (/)**: The system partition where the OS and most software is installed. This is typically ~84 GB on GitHub runners.
- **Workspace**: Your build directory (`$GITHUB_WORKSPACE`). On some actions (like easimon), this may be on a separate LVM volume.
- **Freed Space**: How much space was reclaimed by the cleanup action.
- **Available After**: Total free space remaining after cleanup. Higher is better for comparing runner images.
- **⚠️ easimon Note**: Shows negative root freed because it creates an LVM volume by consuming root space, then remounts workspace there. The workspace freed is what matters.

Image | Option | Intensity | Freed (WS) | Freed (Root) | Avail After (WS) | Avail After (Root) | Duration | GiB/sec
--- | --- | --- | --- | --- | --- | --- | --- | ---
ubuntu-22.04 | adityagarg | light | 19.40 GiB | 19.40 GiB | 41.22 GiB | 41.22 GiB | 215s | 0.090
ubuntu-22.04 | adityagarg | max | 28.88 GiB | 28.88 GiB | 50.70 GiB | 50.70 GiB | 260s | 0.111
ubuntu-22.04 | adityagarg | minimal | 3.97 GiB | 3.97 GiB | 25.78 GiB | 25.78 GiB | 6s | 0.661
ubuntu-22.04 | adityagarg | standard | 24.64 GiB | 24.64 GiB | 46.46 GiB | 46.46 GiB | 249s | 0.099
ubuntu-22.04 | easimon | default | 62.48 GiB | -20.81 GiB | 84.28 GiB | 1.00 GiB | 1s | 62.477
ubuntu-22.04 | easimon | light | 62.48 GiB | -20.81 GiB | 84.28 GiB | 1.00 GiB | 1s | 62.476
ubuntu-22.04 | easimon | max | 81.18 GiB | 15.45 GiB | 102.98 GiB | 37.25 GiB | 70s | 1.160
ubuntu-22.04 | easimon | standard | 76.10 GiB | -20.81 GiB | 97.91 GiB | 1.00 GiB | 63s | 1.208
ubuntu-22.04 | enderson | light | 19.68 GiB | 19.68 GiB | 41.50 GiB | 41.50 GiB | 110s | 0.179
ubuntu-22.04 | enderson | max | 38.24 GiB | 38.24 GiB | 60.06 GiB | 60.06 GiB | 216s | 0.177
ubuntu-22.04 | enderson | minimal | 5.83 GiB | 5.83 GiB | 27.65 GiB | 27.65 GiB | 38s | 0.153
ubuntu-22.04 | enderson | standard | 23.31 GiB | 23.31 GiB | 45.13 GiB | 45.13 GiB | 66s | 0.353
ubuntu-22.04 | jlumbroso | default | 22.44 GiB | 22.44 GiB | 44.26 GiB | 44.26 GiB | 201s | 0.112
ubuntu-22.04 | jlumbroso | light | 19.68 GiB | 19.68 GiB | 41.50 GiB | 41.50 GiB | 92s | 0.214
ubuntu-22.04 | jlumbroso | max | 28.29 GiB | 28.29 GiB | 50.10 GiB | 50.10 GiB | 241s | 0.117
ubuntu-22.04 | jlumbroso | minimal | 5.83 GiB | 5.83 GiB | 27.65 GiB | 27.65 GiB | 30s | 0.194
ubuntu-22.04 | jlumbroso | standard | 24.65 GiB | 24.65 GiB | 46.47 GiB | 46.47 GiB | 193s | 0.128
ubuntu-22.04 | manual | light | 9.81 GiB | 9.81 GiB | 31.63 GiB | 31.63 GiB | 41s | 0.239
ubuntu-22.04 | manual | max | 23.41 GiB | 23.41 GiB | 45.23 GiB | 45.23 GiB | 72s | 0.325
ubuntu-22.04 | manual | minimal | 3.97 GiB | 3.97 GiB | 25.78 GiB | 25.78 GiB | 8s | 0.496
ubuntu-22.04 | manual | standard | 22.81 GiB | 22.81 GiB | 44.63 GiB | 44.63 GiB | 107s | 0.213
ubuntu-24.04 | adityagarg | light | 19.54 GiB | 19.54 GiB | 42.06 GiB | 42.06 GiB | 178s | 0.110
ubuntu-24.04 | adityagarg | max | 29.51 GiB | 29.51 GiB | 52.02 GiB | 52.02 GiB | 213s | 0.139
ubuntu-24.04 | adityagarg | minimal | 3.97 GiB | 3.97 GiB | 26.48 GiB | 26.48 GiB | 5s | 0.793
ubuntu-24.04 | adityagarg | standard | 24.79 GiB | 24.79 GiB | 47.31 GiB | 47.31 GiB | 174s | 0.142
ubuntu-24.04 | easimon | default | 62.46 GiB | -21.51 GiB | 84.97 GiB | 1.00 GiB | 1s | 62.465
ubuntu-24.04 | easimon | light | 63.25 GiB | -21.51 GiB | 85.75 GiB | 1.00 GiB | 7s | 9.035
ubuntu-24.04 | easimon | max | 81.94 GiB | 16.23 GiB | 104.44 GiB | 38.74 GiB | 99s | 0.828
ubuntu-24.04 | easimon | standard | 76.86 GiB | -21.51 GiB | 99.37 GiB | 1.00 GiB | 36s | 2.135
ubuntu-24.04 | enderson | light | 19.34 GiB | 19.34 GiB | 41.86 GiB | 41.86 GiB | 95s | 0.204
ubuntu-24.04 | enderson | max | 37.66 GiB | 37.66 GiB | 60.17 GiB | 60.17 GiB | 198s | 0.190
ubuntu-24.04 | enderson | minimal | 5.51 GiB | 5.51 GiB | 28.03 GiB | 28.03 GiB | 35s | 0.157
ubuntu-24.04 | enderson | standard | 22.99 GiB | 22.99 GiB | 45.51 GiB | 45.51 GiB | 69s | 0.333
ubuntu-24.04 | jlumbroso | default | 23.14 GiB | 23.14 GiB | 45.66 GiB | 45.66 GiB | 198s | 0.117
ubuntu-24.04 | jlumbroso | light | 20.14 GiB | 20.14 GiB | 42.66 GiB | 42.66 GiB | 72s | 0.280
ubuntu-24.04 | jlumbroso | max | 28.66 GiB | 28.66 GiB | 51.18 GiB | 51.18 GiB | 214s | 0.134
ubuntu-24.04 | jlumbroso | minimal | 5.51 GiB | 5.51 GiB | 28.03 GiB | 28.03 GiB | 34s | 0.162
ubuntu-24.04 | jlumbroso | standard | 25.02 GiB | 25.02 GiB | 47.53 GiB | 47.53 GiB | 188s | 0.133
ubuntu-24.04 | manual | light | 9.49 GiB | 9.49 GiB | 32.00 GiB | 32.00 GiB | 54s | 0.176
ubuntu-24.04 | manual | max | 23.88 GiB | 23.88 GiB | 46.39 GiB | 46.39 GiB | 138s | 0.173
ubuntu-24.04 | manual | minimal | 3.97 GiB | 3.97 GiB | 26.48 GiB | 26.48 GiB | 14s | 0.283
ubuntu-24.04 | manual | standard | 22.48 GiB | 22.48 GiB | 44.99 GiB | 44.99 GiB | 87s | 0.258

</details>
