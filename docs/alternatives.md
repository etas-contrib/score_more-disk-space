# Alternatives

[← Back to main README](../README.md)

This document explains the design choices behind **more-disk-space**.

---

## Alternative Actions Were Benchmarked

5 different cleanup approaches across multiple intensity levels on actual GitHub
runners (ubuntu-22.04 & ubuntu-24.04) were benchmarked. For each of them a
several configurations were selected.

Let's group them by disk space cleaned:

### Minimal Cleanup (~4 GiB)

| Action                      | Space Freed | Duration (range) | GiB/sec (range) |
| --------------------------- | ----------- | ---------------- | --------------- |
| **more-disk-space level 1** | 3.7 GiB     | 1s               | 3.7             |
| **more-disk-space level 2** | 7.6 GiB     | 3-4s             | 1.90-2.53       |
| jlumbroso                   | 4.0 GiB     | 6-8s             | 0.50-0.66       |
| enderson                    | 4.0 GiB     | 7-13s            | 0.31-0.57       |
| adityagarg                  | 4.0 GiB     | 4-6s             | 0.66-0.99       |

**Result:** All tools achieve similar cleanup. more-disk-space is **4-7×
faster**. And even level 2 is faster, freeing double the space in just 3-4
seconds.

### Light Cleanup (~13 GiB)

| Action                      | Space Freed | Duration (range) | GiB/sec (range) |
| --------------------------- | ----------- | ---------------- | --------------- |
| **more-disk-space level 3** | 12.3 GiB    | 15-16s           | 0.77-0.82       |
| jlumbroso                   | 13.8 GiB    | 30-50s           | 0.28-0.46       |
| enderson                    | 13.8 GiB    | 34-44s           | 0.31-0.41       |
| adityagarg                  | 19.5 GiB    | 151-187s         | 0.10-0.13       |

**Result:** more-disk-space cleans slightly less than the others, but is **2-6×
faster** at this level.

### Standard Cleanup (~20 GiB)

| Action                      | Space Freed | Duration (range) | GiB/sec (range) |
| --------------------------- | ----------- | ---------------- | --------------- |
| **more-disk-space level 4** | 22.2 GiB    | 30-49s           | 0.45-0.74       |
| jlumbroso                   | 22.4 GiB    | 138-177s         | 0.13-0.16       |
| enderson                    | 17.5 GiB    | 38-46s           | 0.38-0.46       |
| enderson                    | 31.4 GiB    | 158-190s         | 0.17-0.20       |
| adityagarg                  | 24.7 GiB    | 142-203s         | 0.12-0.17       |

**Result:** Others may clean more (up to 31 GiB), but they are **3-5× slower**
than more-disk-space level 4.

### Standard Cleanup (~20 GiB)

| Action  | Space Freed | Duration (range) | GiB/sec (range) |
| ------- | ----------- | ---------------- | --------------- |
| easimon | 76.0 GiB    | 34-38s           | 2.00-2.24       |
| easimon | 81.0 GiB    | 34-41s           | 1.98-2.39       |

**Result:** easimon achieves massive workspace sizes by consuming root space via
LVM. It is fast but leaves minimal root space (~1 GiB).

### Summary: Why more-disk-space Wins on Speed

**Direct `rm -rf` deletion:**
- No APT overhead (dependency checking, validation, index updates)
- No package scanning or filtering operations
- Hardcoded paths on known GitHub runner images

**Result:** 4-5× faster than existing actions at equivalent cleanup levels.

---

## Why 4 Levels? (Size/Speed Trade-off Analysis)

Each level adds items with similar **deletion efficiency** (GiB/sec). This
creates natural breakpoints:

### Level Progression

| Level | Items Added        | Total Space | Duration   | New GiB/sec           | Cumulative     |
| ----- | ------------------ | ----------- | ---------- | --------------------- | -------------- |
| 1     | swift, chromium    | 3.7 GiB     | ~1s        | 3.7 GiB/sec           | ⚡ Ultra-fast   |
| 2     | +aws-cli, haskell  | +3.9 GiB    | ~4s total  | 1.3 GiB/sec per added | ⚡ Still fast   |
| 3     | +miniconda, dotnet | +4.7 GiB    | ~16s total | 0.4 GiB/sec per added | ⚠️ Slower items |
| 4     | +android           | +9.9 GiB    | ~40s total | 0.4 GiB/sec per added | 🐌 Bottleneck   |

### Decision Logic

**Why not more levels?**
- Adding **Level 5-x**: The next level would be apt-base, but it only cleans 2-9
  GiB more but takes 140+ seconds longer. Not worth it.
- Each marginal GiB becomes increasingly expensive in time

**Why not fewer levels?**
- **Level 1 alone**: 3.7 GiB is too modest for many workflows
- **Level 2 as default**: Sweet spot—7.6 GiB in ~4s catches 80% of space issues
- **Levels 3-4**: Options for workflows that need more aggressive cleanup

**The breakpoint:** Android SDK at Level 4 is the final practical item. It's
slow (51 seconds for 5.5 GiB) but adds massive space. Beyond that, APT tools
become necessary.

---

## Excluded: Different Trade-off Model

---

## Excluded: Extreme Runtime (4-5× Slower)

APT-based tools sacrifice speed for comprehensiveness. Not worth the trade-off
for GitHub Actions.

**Performance data:**
- **adityagarg · standard**: 24.7 GiB in ~177s (0.14 GiB/sec)
  - Only **2 GiB more** than more-disk-space Level 4
  - Takes **135+ seconds longer** (3.4× slower)
- **enderson · max**: 31.5 GiB in ~183s (0.17 GiB/sec)
  - Only **9 GiB more** than more-disk-space Level 4
  - Takes **140+ seconds longer** (3.5× slower)
- **jlumbroso · max**: ~22 GiB in ~165s (0.13 GiB/sec)
  - Similar cleanup to more-disk-space Level 4
  - Takes **4× longer** (125+ seconds extra)

**Why they're slow:**
1. **APT overhead**: `apt remove` checks dependencies, validates packages,
   updates indices
2. **Package queries**: Scanning installed packages, filtering by patterns
3. **Cleanup operations**: `apt autoremove`, `apt clean`, index updates
4. **Safety checks**: More thorough validation before deletion

**Time cost breakdown:**
- more-disk-space Level 4: 40 seconds = actual deletion
- APT tools: 177 seconds = ~137 seconds of APT overhead + deletion

**When to consider:**
- You need **absolute maximum cleanup** (30+ GiB) **AND** time isn't critical
- Your build already takes forever, so adding some minutes is acceptable

**Recommendation:** For most GitHub Actions workflows, the time penalty isn't
worth it. The marginal gains don't justify 135+ extra seconds. Use
more-disk-space Level 3-4 instead.

---

## Excluded: Different Trade-off Model

### easimon/maximize-build-space

**The different approach:** Instead of deleting files, it expands workspace by
consuming root space via LVM.

**Performance data:**
- **easimon 1**: 76 GiB workspace in ~36s (2.11 GiB/sec)
- **easimon 2**: 81 GiB workspace in ~41s (1.98 GiB/sec)

**How it works:** Instead of just deleting files, it:
1. Removes some large packages (dotnet, android)
2. Creates an LVM volume by **consuming root partition space**
3. Remounts `/home/runner/work` (workspace) on the new LVM volume
4. Result: Huge workspace (75-80 GiB) but **minimal root space (~1 GiB)**

**Trade-offs:**
- ✅ **Fast**: 2+ GiB/sec efficiency (faster than direct deletion!)
- ✅ **Massive workspace**: 75-80 GiB available for builds
- ⚠️ **Root space sacrifice**: Only ~1 GiB left on root partition
- ⚠️ **Risk**: Multi-step workflows that write to root may fail
- ⚠️ **Complexity**: Requires understanding LVM partitioning model

**When to consider:**
- **Single-step builds** that need massive workspace:
  - Compiling LLVM or kernel (10+ GiB artifacts)
  - Building very large containers (30+ GiB layers)
  - Machine learning model training (large datasets)
- You understand LVM and accept the root space trade-off
- Your workflow doesn't install APT packages or write to `/tmp` after cleanup

**When NOT to use:**
- Multi-step workflows (checkout → build → test → deploy)
- Workflows that install packages mid-build (`apt install` needs root space)
- Workflows that write logs/artifacts to `/tmp` or other root paths
- You're not sure what LVM is or why it matters

**Recommendation:** easimon is excellent for specific use cases (single-step
massive builds), but most workflows don't need 75 GiB workspace. Use
more-disk-space Level 3-4 for safe, predictable cleanup instead.

---

## Why more-disk-space is Different (Design Philosophy)

### Design Philosophy

**Goal:** Maximum space/time efficiency for typical GitHub Actions workflows

**Approach:**
1. **Benchmark-driven**: Measured individual package deletion times on actual
   runners
2. **Efficiency-sorted**: Remove fast items first (swift: 6.5 GiB/sec) before
   slow items (android: 0.1 GiB/sec)
3. **Direct deletion**: `sudo rm -rf` on known paths—no APT overhead
4. **Predictable**: Same paths on Ubuntu 22.04 and 24.04

**Result:** 5-10× faster than size-sorted or APT-based approaches

**Sacrifices:**
- Less comprehensive: Only known large items safe for S-CORE workflows
- Hardcoded paths: Tied to specific GitHub runner images
- No package management: Ignores dependencies, may leave orphaned packages
- Limited customization: 4 fixed levels, not granular control
- No cleanup: directories are simply deleted, tools remain "installed"


## Risk Assessment: What to Delete

Complete inventory of deletable items from GitHub runners, categorized by risk
level.

### 🟢 Safe to Delete (Included in more-disk-space levels)
|---|---|---|---|
| 1 | `/usr/share/dotnet` | 1-2 GiB | Level 3 | .NET runtime & SDKs |
| 2 | `/usr/local/lib/android` | 5-6 GiB | Level 4 | Android SDK |
| 3 | `/opt/ghc`, `/usr/local/.ghcup` | 1-1.5 GiB | Level 2 | Haskell compiler |
| 4 | `/usr/share/swift` | 1-2 GiB | Level 1 | Swift compiler |
| 5 | `/usr/share/miniconda` | 1-2 GiB | Level 3 | Conda Python environment |
| 6 | `/usr/local/aws-cli` | 0.5-1 GiB | Level 2 | AWS CLI v2 |
| 7 | `/usr/local/share/chromium` | 0.3-0.5 GiB | Level 1 | Chromium browser |

**Also safe but not in more-disk-space** (due to APT overhead or marginal
gains, while increasing deletion time):

| Path/Package                             | Size             | Why Not Included                 |
| ---------------------------------------- | ---------------- | -------------------------------- |
| `/usr/share/gradle`                      | ~0 GiB           | Small, APT overhead not worth it |
| `dotnet-sdk-*` (APT)                     | 0.5-1 GiB        | APT overhead                     |
| `/usr/local/julia`                       | ~0 GiB           | Uncommon, small                  |
| `temurin-*` (APT)                        | 0.5-1 GiB        | APT overhead                     |
| `/usr/local/aws-sam-cli`                 | 0.3-0.5 GiB      | Marginal gain                    |
| `/usr/local/share/powershell`            | 0.2-0.3 GiB      | Marginal gain                    |
| Browser packages (firefox, chrome, edge) | 0.5-1 GiB        | APT overhead                     |
| `postgresql-*`, `mysql-*` (APT)          | 0.3-0.5 GiB each | APT overhead                     |
| `google-cloud-cli` (APT)                 | 0.3-0.5 GiB      | APT overhead                     |
| `*-llvm-*` (APT)                         | 0.5-2 GiB        | APT overhead                     |

### 🔴 Do NOT Delete (Critical Caches)

These intentionally **NOT deleted** by more-disk-space. Removing them forces
re-downloads/rebuilds, adding 5-15 minutes to workflows.

| Path/Package                  | Size        | Impact if Deleted                                                             |
| ----------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `/opt/hostedtoolcache`        | 6-7 GiB     | Node, Python, Ruby, Go, Java caches — Forces re-download of language runtimes |
| Docker layer cache            | 3-5 GiB     | Forces full image rebuilds (~5-15 min slowdown)                               |
| `/var/cache/apt`              | 1-2 GiB     | APT package cache — Forces re-download on `apt install`                       |
| `/usr/local/lib/node_modules` | 0.5-1 GiB   | Global npm packages — Forces `npm install -g`                                 |
| Pip/Python cache              | 0.5-1 GiB   | Python package cache — Forces PyPI re-downloads                               |
| Gem cache (Ruby)              | 0.3-0.5 GiB | Forces `gem install`                                                          |
| Go module cache               | 0.3-0.5 GiB | `/root/go/pkg/mod` — Forces re-download                                       |
| Cargo cache (Rust)            | 0.5-1 GiB   | Forces crate re-downloads                                                     |
| Maven/Gradle caches           | 0.5-1 GiB   | Java dependency re-downloads                                                  |

**Total potential savings:** 15-20 GiB  
**Cost:** 5-15 minutes added to build time

**Verdict:** Never worth it. More-disk-space preserves these intentionally.

---

## Benchmark Methodology

All performance data comes from
[benchmark-disk-space.yml](../.github/workflows/benchmark-disk-space.yml):

- **Runners tested:** ubuntu-22.04, ubuntu-24.04 (GitHub-hosted free tier)
- **Actions benchmarked:** manual, jlumbroso, enderson, easimon, adityagarg
- **Measurements:** Wall-clock time, `df` space readings, individual package
  deletion times
- **Repeats:** 5 runs per configuration for statistical validity
- **Validation:** All cleanup actions verified to free ≥0.1 GiB

The revolutionary insight: **Android SDK takes 51 seconds to delete but swift
takes 0.23 seconds.** By deleting fast items first, we achieve 5-10× better
performance at small cleanup levels.

[← Back to main README](../README.md)

