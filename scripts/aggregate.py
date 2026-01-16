#!/usr/bin/env python3
"""Aggregate benchmark metrics and generate summary with Mermaid chart."""

import csv
import sys
from collections import defaultdict

if len(sys.argv) < 3:
    print("Usage: aggregate.py <combined.csv> <summary.md>")
    sys.exit(1)

combined_path = sys.argv[1]
summary_path = sys.argv[2]

groups: dict[tuple[str, str, str], dict[str, int]] = defaultdict(
    lambda: {
        "count": 0,
        "sum_freed_root": 0,
        "sum_freed_ws": 0,
        "sum_dur": 0,
        "sum_after_root": 0,
        "sum_after_ws": 0,
    }
)

rows: list[dict[str, str]] = []
with open(combined_path, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Group results by (image, option, intensity) combination and sum metrics across repeats
for r in rows:
    key = (r["image"], r["option"], r["intensity"])
    g = groups[key]
    g["count"] += 1
    g["sum_freed_root"] += int(r["freed_root"])
    g["sum_freed_ws"] += int(r["freed_ws"])
    g["sum_dur"] += int(r["duration_seconds"])
    g["sum_after_root"] += int(r["after_root"])
    g["sum_after_ws"] += int(r["after_ws"])


def fmt_gib(bytes_: int) -> str:
    """Format bytes as GiB with 2 decimal places."""
    return f"{bytes_ / (1024**3):.2f} GiB"


lines: list[str] = []
lines.append("## Disk Space Benchmark Summary\n")
lines.append("\n")
lines.append("### Understanding the Metrics\n")
lines.append("\n")
lines.append(
    "- **Root (/)**: The system partition where the OS and most software is installed. This is typically ~84 GB on GitHub runners.\n"
)
lines.append(
    "- **Workspace**: Your build directory (`$GITHUB_WORKSPACE`). On some actions (like easimon), this may be on a separate LVM volume.\n"
)
lines.append("- **Freed Space**: How much space was reclaimed by the cleanup action.\n")
lines.append(
    "- **Available After**: Total free space remaining after cleanup. Higher is better for comparing runner images.\n"
)
lines.append(
    "- **⚠️ easimon Note**: Shows negative root freed because it creates an LVM volume by consuming root space, then remounts workspace there. The workspace freed is what matters.\n"
)
lines.append("\n")
# Generate markdown table with averages. Integer division used for consistency with CSV values.
lines.append(
    "Image | Option | Intensity | Freed (WS) | Freed (Root) | Avail After (WS) | Avail After (Root) | Duration | GiB/sec\n"
)
lines.append("--- | --- | --- | --- | --- | --- | --- | --- | ---\n")
# Compute averages for each (image, option, intensity) group
for (image, option, intensity), g in sorted(groups.items()):
    c = g["count"] or 1
    avg_ws = g["sum_freed_ws"] // c
    avg_root = g["sum_freed_root"] // c
    avg_dur = g["sum_dur"] // c
    avg_after_ws = g["sum_after_ws"] // c
    avg_after_root = g["sum_after_root"] // c
    # Compute GiB/sec using workspace freed (avoid division by zero)
    gib_per_sec = (avg_ws / (1024**3)) / avg_dur if avg_dur > 0 else 0
    lines.append(
        f"{image} | {option} | {intensity} | {fmt_gib(avg_ws)} | {fmt_gib(avg_root)} | {fmt_gib(avg_after_ws)} | {fmt_gib(avg_after_root)} | {avg_dur}s | {gib_per_sec:.3f}\n"
    )

summary = "".join(lines)
print(summary)
with open(summary_path, "w", encoding="utf-8") as f:
    f.write(summary)
    # Append Mermaid xychart visualizing average workspace freed per combination.
    # Limited to 50 data points for readability (safety cap).
    f.write("\n\n")
    f.write("```mermaid\n")
    f.write("xychart-beta\n")
    f.write('  title "Avg Workspace Freed (GiB)"\n')
    f.write("  x-axis [")
    # Collect labels first
    labels = []
    for image, option, intensity in sorted(groups.keys())[:50]:
        labels.append(f'"{option}/{intensity}"')
    f.write(", ".join(labels))
    f.write("]\n")
    f.write('  y-axis "GiB" 0 --> 100\n')
    f.write("  bar [")
    # Use all groups; limit to a reasonable number if excessive
    values = []
    chart_count = 0
    for (image, option, intensity), g in sorted(groups.items()):
        avg_ws = (g["sum_freed_ws"] // (g["count"] or 1)) / (1024**3)
        values.append(f"{avg_ws:.2f}")
        chart_count += 1
        if chart_count >= 50:  # safety cap
            break
    f.write(", ".join(values))
    f.write("]\n")
    f.write("```\n")
