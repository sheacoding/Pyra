#!/usr/bin/env sh
set -e

has_cmd() { command -v "$1" >/dev/null 2>&1; }

echo "Installing dependencies (Python, uv)..."

if ! has_cmd python3 && ! has_cmd python; then
  if has_cmd brew; then
    echo "Installing Python via Homebrew..."
    brew install python@3.12 || brew install python
  elif has_cmd apt-get; then
    sudo apt-get update && sudo apt-get install -y python3
  elif has_cmd dnf; then
    sudo dnf install -y python3
  elif has_cmd pacman; then
    sudo pacman -S --noconfirm python
  else
    echo "Please install Python manually from https://www.python.org/downloads/" >&2
  fi
fi

if ! has_cmd uv; then
  echo "Installing uv via official install script..."
  curl -fsSL https://astral.sh/uv/install.sh | sh
fi

echo "Dependency installation steps completed."
exit 0

