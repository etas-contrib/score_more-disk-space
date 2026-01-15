#!/usr/bin/env bash
set -euo pipefail

IMAGE=${1}
OPTION=${2}
INTENSITY=${3}
REPEAT=${4}
BEFORE_ROOT=${5}
AFTER_ROOT=${6}
BEFORE_WS=${7}
AFTER_WS=${8}
DURATION=${9}

FREED_ROOT=$(( AFTER_ROOT - BEFORE_ROOT ))
FREED_WS=$(( AFTER_WS - BEFORE_WS ))

mkdir -p metrics
OUT=metrics/metrics.csv
if [[ ! -s "$OUT" ]]; then
  echo "image,option,intensity,repeat,before_root,after_root,freed_root,before_ws,after_ws,freed_ws,duration_seconds" > "$OUT"
fi
echo "$IMAGE,$OPTION,$INTENSITY,$REPEAT,$BEFORE_ROOT,$AFTER_ROOT,$FREED_ROOT,$BEFORE_WS,$AFTER_WS,$FREED_WS,$DURATION" >> "$OUT"
cat "$OUT"
