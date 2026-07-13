#!/usr/bin/env bash
# Build the CrazyGames submission ZIP.
#   ./build-crazygames.sh [out.zip]
# Takes the live game files, activates the CrazyGames SDK <script> tag, and
# zips everything the portal needs (index.html at the ZIP root, as required).
# Source art in assets/raw and dev/test files are excluded.
set -euo pipefail
cd "$(dirname "$0")"
OUT="${1:-crazygames.zip}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp index.html ads.js game.js sprites.js dungeon.js sheets.js audio.js "$STAGE/"
mkdir "$STAGE/assets"
find assets -maxdepth 1 -type f ! -name '.slice-report.json' ! -name 'README.md' \
  -exec cp {} "$STAGE/assets/" \;

# activate the CrazyGames SDK: swap the commented portal-SDK block for a live tag
python3 - "$STAGE/index.html" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
s2 = re.sub(r'<!-- Portal SDKs:.*?-->',
            '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
            s, count=1, flags=re.S)
assert s2 != s, 'portal SDK comment block not found'
open(p, 'w', encoding='utf-8').write(s2)
PY

( cd "$STAGE" && zip -qr9 out.zip . -x out.zip )
mv "$STAGE/out.zip" "$OUT"
echo "built $OUT ($(du -h "$OUT" | cut -f1)) — contents:"
unzip -l "$OUT" | tail -n +4 | head -30
