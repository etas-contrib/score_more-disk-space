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
    lambda: {"count": 0, "sum_freed_root": 0, "sum_freed_ws": 0, "sum_dur": 0}
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


def fmt_gib(bytes_: int) -> str:
    """Format bytes as GiB with 2 decimal places."""
    return f"{bytes_ / (1024**3):.2f} GiB"


lines: list[str] = []
lines.append("## Disk Space Benchmark Summary\n")
lines.append("\n")
# Generate markdown table with averages. Integer division used for consistency with CSV values.
lines.append(
    "Image | Option | Intensity | Avg Freed (Workspace) | Avg Freed (Root) | Avg Duration\n"
)
lines.append("--- | --- | --- | --- | --- | ---\n")
# Compute averages for each (image, option, intensity) group
for (image, option, intensity), g in sorted(groups.items()):
    c = g["count"] or 1
    avg_ws = g["sum_freed_ws"] // c
    avg_root = g["sum_freed_root"] // c
    avg_dur = g["sum_dur"] // c
    lines.append(
        f"{image} | {option} | {intensity} | {fmt_gib(avg_ws)} | {fmt_gib(avg_root)} | {avg_dur}s\n"
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
    f.write("  title: Avg Workspace Freed (GiB)\n")
    f.write("  x-axis: label Group, type category\n")
    f.write("  y-axis: label GiB\n")
    f.write("  series:\n")
    f.write("    - title: Workspace\n")
    f.write("      data:\n")
    # Use all groups; limit to a reasonable number if excessive
    chart_count = 0
    for (image, option, intensity), g in sorted(groups.items()):
        avg_ws = (g["sum_freed_ws"] // (g["count"] or 1)) / (1024**3)
        # Cap to two decimals for readability
        yval = f"{avg_ws:.2f}"
        label = f"{image}/{option}/{intensity}"
        f.write(f"        - x: {label}\n")
        f.write(f"          y: {yval}\n")
        chart_count += 1
        if chart_count >= 50:  # safety cap
            break
    f.write("```\n")
