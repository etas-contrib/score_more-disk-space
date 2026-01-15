# Deletable Items & Risk Assessment

Based on benchmark data from `analysis.md`, here's what each cleanup action removes and the risk of breaking builds.

---

## Breakdown by Item

### 1. .NET Runtime & SDKs (`/usr/share/dotnet`)
- **Size**: ~1–2 GiB
- **Risk Level**: 🔴 **HIGH** – Breaks .NET builds
- **Who needs it**: .NET (C#, F#, VB.NET), Xamarin, MAUI
- **Safe if**: You're not building .NET projects
- **Recovery**: Rebuild runner (no caching available mid-build)

**Affected by:**
- manual · minimal, light, standard, max
- jlumbroso · minimal, light, standard, max
- enderson · light, standard, max
- adityagarg · minimal, light, standard, max

---

### 2. Tool Cache (`/opt/hostedtoolcache`)
- **Size**: ~6–7 GiB
- **Risk Level**: 🔴 **HIGH** – Breaks Node, Python, Ruby, Go, Julia, Java caching
- **Who needs it**: Anyone using `actions/setup-node`, `actions/setup-python`, etc.
- **What's inside**:
  - Node.js versions
  - Python versions
  - Ruby versions
  - Go versions
  - Julia versions
  - Java versions (temurin, etc.)
- **Safe if**: You don't use language setup actions, or you're OK with slower first runs
- **Recovery**: Setup actions will re-download/compile (slow, can timeout)

**Affected by:**
- manual · light, standard, max
- jlumbroso · light, standard, max
- enderson · light, standard, max
- adityagarg · light, standard, max

---

### 3. Haskell Compiler (`/opt/ghc`)
- **Size**: ~1–1.5 GiB
- **Risk Level**: 🟡 **MEDIUM** – Breaks Haskell builds only
- **Who needs it**: Haskell projects
- **Safe if**: You're not building Haskell
- **Recovery**: Rebuild via GHCup (slow)

**Affected by:**
- manual · light, standard, max
- jlumbroso · standard, max
- enderson · standard, max
- adityagarg · standard, max

---

### 4. Android SDK (`/usr/local/lib/android`)
- **Size**: ~5–6 GiB
- **Risk Level**: 🔴 **HIGH** – Breaks Android, Flutter, React Native builds
- **Who needs it**: Android development, Flutter, React Native
- **Safe if**: Mobile dev not in scope
- **Recovery**: `sdkmanager` re-downloads (~5–10 min, can fail)

**Affected by:**
- jlumbroso · light, standard, max
- enderson · light, standard, max
- adityagarg · light, standard, max

---

### 5. Swift (`/usr/share/swift`)
- **Size**: ~1–2 GiB
- **Risk Level**: 🔴 **HIGH** – Breaks iOS/macOS builds
- **Who needs it**: Swift, iOS, macOS development
- **Safe if**: No Apple platform builds
- **Recovery**: Re-download via swift.org (~10–20 min)

**Affected by:**
- manual · standard, max
- enderson · max (partial removal)

---

### 6. Docker Images
- **Size**: ~3–5 GiB
- **Risk Level**: 🟡 **MEDIUM** – Affects local Docker builds
- **Who needs it**: Docker-in-Docker builds, Docker layer caching
- **What it removes**: Pre-cached base images (ubuntu, alpine, etc.)
- **Safe if**: You pull fresh images each time or build from scratch
- **Recovery**: Re-pull base images (slow network I/O)

**Affected by:**
- jlumbroso · light, standard, max
- easimon · light, standard, max
- adityagarg · max

---

### 7. Large APT Packages (~0.5–1 GiB)
- **Includes**: Build tools, compilers, development headers
- **Risk Level**: 🟡 **MEDIUM** – May break language-specific builds
- **Examples**: llvm, gcc variants, postgresql, mysql
- **Safe if**: Pre-installed packages aren't needed mid-build
- **Recovery**: `apt-get install` (requires sudo, network, can be slow)

**Affected by:**
- jlumbroso · standard, max
- enderson · max

---

### 8. Swap Space (`/swapfile`)
- **Size**: ~1–2 GiB (system dependent)
- **Risk Level**: 🟠 **MEDIUM-HIGH** – Affects memory-constrained builds
- **Who needs it**: Large compilations (LLVM, Rust, Go), memory-intensive workloads
- **Impact**: Disabling swap can cause OOM kills
- **Safe if**: Your builds fit in RAM
- **Recovery**: Re-enable swap (requires reboot/service restart)

**Affected by:**
- enderson · standard, max
- jlumbroso · max
- adityagarg · max

---

### 9. Additional Folders (enderson · max only)
- **Size**: ~5–10 GiB cumulative
- **Risk Level**: 🟡 **MEDIUM** – Affects specialized workflows
- **Includes**:
  - `/usr/share/miniconda` – Breaks Conda-based Python
  - `/usr/local/aws-cli` – Breaks AWS CLI usage
  - `/usr/local/julia` – Breaks Julia builds
  - `/usr/local/aws-sam-cli` – Breaks serverless deployments
  - `/usr/share/gradle` – Breaks Gradle builds
  - And more...

---

### 10. LVM Workspace Expansion (easimon)
- **Size**: ~62–82 GiB workspace expansion
- **Risk Level**: 🟢 **LOW** – Doesn't delete anything, just remounts
- **What it does**: Creates LVM volume, remounts `$GITHUB_WORKSPACE` to larger volume
- **Safe if**: Your artifacts are in `$GITHUB_WORKSPACE`
- **Warning**: If your build writes to `/home` outside workspace, it won't benefit
- **Recovery**: Automatic (runner cleanup resets)

