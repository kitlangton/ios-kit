#!/bin/sh
# Link macOS's SF Mono into fonts/ so the static server can serve it (Chromium doesn't map ui-monospace).
cd "$(dirname "$0")/.." && mkdir -p fonts
ln -sf /System/Library/Fonts/SFNSMono.ttf fonts/SFNSMono.ttf
ln -sf /System/Library/Fonts/SFNSMonoItalic.ttf fonts/SFNSMonoItalic.ttf
echo "linked SF Mono into $(pwd)/fonts"
