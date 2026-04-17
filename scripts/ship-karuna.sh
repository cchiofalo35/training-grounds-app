#!/usr/bin/env bash
# Ship CrossFit Karuna to TestFlight.
#
# Prereqs (one-time):
#   eas login          # uses your Expo password + 2FA
#
# Then just:
#   ./scripts/ship-karuna.sh
#
# This script runs in the foreground, tails the build, and auto-submits to
# TestFlight once the build finishes. ~25 min end-to-end.

set -euo pipefail

cd "$(dirname "$0")/../packages/frontend"

echo "==> Verifying EAS login..."
if ! eas whoami > /dev/null 2>&1; then
  echo "❌ Not logged in. Run: eas login"
  exit 1
fi
echo "   logged in as $(eas whoami 2>/dev/null)"

echo "==> Verifying tenant config resolves..."
NAME=$(EXPO_PUBLIC_TENANT=crossfit-karuna node -e "console.log(require('./app.config.js')().expo.name)")
BUNDLE=$(EXPO_PUBLIC_TENANT=crossfit-karuna node -e "console.log(require('./app.config.js')().expo.ios.bundleIdentifier)")
echo "   name=$NAME bundle=$BUNDLE"

echo "==> Building for iOS (TestFlight)..."
eas build --platform ios --profile crossfit-karuna --non-interactive

echo "==> Submitting to TestFlight..."
eas submit --platform ios --profile crossfit-karuna --latest --non-interactive

echo "✅ Done. Apple will take ~10 min to process the build."
echo "   Invite testers at:"
echo "   https://appstoreconnect.apple.com/apps/6762426665/distribution/ios/testflight"
