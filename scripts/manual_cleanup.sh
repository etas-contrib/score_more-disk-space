#!/usr/bin/env bash
set -euo pipefail

INTENSITY=${1:-fast}
echo "Manual cleanup intensity: $INTENSITY"

if [[ "$INTENSITY" == "fast" ]]; then
  [[ -d /usr/share/dotnet ]] && { echo "Removing dotnet"; sudo rm -rf /usr/share/dotnet; }
  [[ -d /opt/ghc ]] && { echo "Removing ghc"; sudo rm -rf /opt/ghc; }
  [[ -d /usr/local/.ghcup ]] && { echo "Removing ghcup"; sudo rm -rf /usr/local/.ghcup; }
fi

if [[ "$INTENSITY" == "standard" ]]; then
  [[ -d /usr/share/dotnet ]] && { echo "Removing dotnet"; sudo rm -rf /usr/share/dotnet; }
  [[ -d /opt/ghc ]] && { echo "Removing ghc"; sudo rm -rf /opt/ghc; }
  [[ -d /usr/local/.ghcup ]] && { echo "Removing ghcup"; sudo rm -rf /usr/local/.ghcup; }
  [[ -d /usr/local/lib/android ]] && { echo "Removing android"; sudo rm -rf /usr/local/lib/android; }
  [[ -d /usr/share/swift ]] && { echo "Removing swift"; sudo rm -rf /usr/share/swift; }
fi

if [[ "$INTENSITY" == "max" ]]; then
  [[ -d /usr/share/dotnet ]] && { echo "Removing dotnet"; sudo rm -rf /usr/share/dotnet; }
  [[ -d /opt/ghc ]] && { echo "Removing ghc"; sudo rm -rf /opt/ghc; }
  [[ -d /usr/local/.ghcup ]] && { echo "Removing ghcup"; sudo rm -rf /usr/local/.ghcup; }
  [[ -d /usr/local/lib/android ]] && { echo "Removing android"; sudo rm -rf /usr/local/lib/android; }
  [[ -d /usr/share/swift ]] && { echo "Removing swift"; sudo rm -rf /usr/share/swift; }
  [[ -d /usr/local/share/chromium ]] && { echo "Removing chromium"; sudo rm -rf /usr/local/share/chromium; }
  [[ -d /opt/hostedtoolcache ]] && { echo "Removing hosted toolcache"; sudo rm -rf /opt/hostedtoolcache; }
  echo "Pruning docker images (if any)"; sudo docker system prune -af || true
  echo "Disabling swap (if present)"; sudo swapoff -a || true; sudo rm -f /swapfile || true
fi
