#!/usr/bin/env bash
set -euo pipefail

ROOT_AVAIL=$(df --output=avail -B1 / | tail -1)
WS_PATH=${GITHUB_WORKSPACE:-$PWD}
WS_AVAIL=$(df --output=avail -B1 "$WS_PATH" | tail -1)

echo "root_avail=$ROOT_AVAIL" >> "$GITHUB_OUTPUT"
echo "ws_path=$WS_PATH" >> "$GITHUB_OUTPUT"
echo "ws_avail=$WS_AVAIL" >> "$GITHUB_OUTPUT"
