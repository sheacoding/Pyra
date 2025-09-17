#!/usr/bin/env sh
set -e

has_cmd() { command -v "$1" >/dev/null 2>&1; }

if { has_cmd python3 || has_cmd python; } && has_cmd uv; then
  echo "Python and uv present"
  exit 0
fi

{ has_cmd python3 || has_cmd python; } || echo "Python missing"
has_cmd uv || echo "uv missing"
exit 1

