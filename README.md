<!--
 Copyright (c) 2026 Contributors to the Eclipse Foundation

 See the NOTICE file(s) distributed with this work for additional
 information regarding copyright ownership.

 This program and the accompanying materials are made available under the
 terms of the Apache License Version 2.0 which is available at
 https://www.apache.org/licenses/LICENSE-2.0

 SPDX-License-Identifier: Apache-2.0
-->

# More-Disk-Space

**Trivial to use and fast disk cleanup**

## Safety

This action is **designed exclusively for GitHub-hosted Ubuntu runners**. If run on other environments (local machines, self-hosted runners, or non-Linux systems), it will:
- ⏭️ **Skip all deletions** (no-op mode)
- ✅ **Exit successfully** without errors

This ensures safe testing and prevents accidental data loss.

*⚠️ Before using any of these cleanup actions, understand what gets deleted ⚠️*

## Quick Start

**Default (recommended):** 7.6 GiB freed in ~4 seconds
```yaml
- uses: eclipse-score/more-disk-space@v1
  with:
    level: 2  # Default
```

## Overview

| Level | Freed Space | Duration | Efficiency | What Gets Deleted |
|------:|------------|----------|---------|-------------------|
| 1 | 3.7 GiB | ~1s | 3.7 GiB/sec | swift, chromium |
| 2 | 7.6 GiB | ~4s | 1.9 GiB/sec | +aws-cli, haskell |
| 3 | 12.3 GiB | ~16s | 0.8 GiB/sec | +miniconda, dotnet |
| 4 | 22.2 GiB | ~40s | 0.6 GiB/sec | +android |


## Why A Custom Action?

* Existing cleanup actions are **4–5× slower**:
  - **APT overhead**: Package manager queries, dependency checks, validation
  - **Extra thoroughness**: Scanning for edge cases that more-disk-space simply ignores
* Trade-Offs:
  - **Different models**: LVM expansion trades root space (see [alternatives](docs/alternatives.md))
- Usability
  * **what gets deleted**: Focused on known large items safe for S-CORE workflows
  * **simple**: Sorted list by deletion speed, not a list of deletable items

## Detailed Breakdown

### Level 1 · Minimal (3.7 GiB in ~1s)

**Removes:**
- Swift compiler (~1.5 GiB)
- Chromium browser (~0.4 GiB)

**Impact:** Safe unless building iOS/macOS apps or testing web UIs locally.

---

### Level 2 · Light — **DEFAULT** (7.6 GiB in ~4s)

**Adds to Level 1:**
- AWS CLI v2 (~0.75 GiB)
- Haskell compiler & ghcup (~1.25 GiB)

**Impact:** Safe unless using Haskell or AWS CLI directly (most workflows use SDKs or pre-cached tools).

---

### Level 3 · Standard (12.3 GiB in ~16s)

**Adds to Level 2:**
- Miniconda Python environment (~1.5 GiB)
- .NET runtime & SDKs (~1.5 GiB)

**Impact:** Safe unless using Conda Python or building C#/F#/VB.NET projects.

---

### Level 4 · Max (22.2 GiB in ~40s)

**Adds to Level 3:**
- Android SDK (~5.5 GiB) — **slowest item, the bottleneck**

**Impact:** Safe unless building Android/Flutter/React Native apps.

---

## Alternative Options

Why those 4 levels?

Need more space or different trade-offs?

See [docs/alternatives.md](docs/alternatives.md).