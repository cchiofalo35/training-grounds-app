#!/usr/bin/env bash
# Ship CrossFit Karuna to TestFlight via local Xcode build (no EAS required).
#
# Steps:
#   1. expo prebuild --clean --platform ios with EXPO_PUBLIC_TENANT=crossfit-karuna
#   2. pod install
#   3. xcodebuild archive (automatic signing — needs Xcode signed in to Apple ID)
#   4. xcodebuild -exportArchive → .ipa
#   5. Print next-step instructions for upload (Organizer or altool)
#
# Prereqs (one-time):
#   - Xcode signed in with Apple ID on team ZM54C3W52G
#     (Xcode → Settings → Accounts → +)
#   - Xcode → Settings → Accounts → select team → Manage Certificates →
#     + Apple Distribution (if not already created)
#
# Usage:
#   ./scripts/ship-karuna-local.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$REPO_ROOT/packages/frontend"
BUILD_DIR="$REPO_ROOT/build/karuna"
TEAM_ID="ZM54C3W52G"
BUNDLE_ID="com.crossfitkaruna.app"
SCHEME="CrossFitKaruna"

cd "$FRONTEND"

echo "==> [1/5] Generating native iOS project for CrossFit Karuna..."
EXPO_PUBLIC_TENANT=crossfit-karuna npx expo prebuild --clean --platform ios --no-install

echo "==> [2/5] Installing CocoaPods..."
cd ios
pod install
cd ..

# Detect the actual scheme/workspace name (Expo names them based on tenant.name)
WORKSPACE=$(ls ios/*.xcworkspace 2>/dev/null | head -1)
if [ -z "$WORKSPACE" ]; then
  echo "❌ No .xcworkspace found in ios/"
  exit 1
fi
SCHEME=$(basename "$WORKSPACE" .xcworkspace)
echo "   using scheme: $SCHEME"
echo "   workspace: $WORKSPACE"

mkdir -p "$BUILD_DIR"
ARCHIVE_PATH="$BUILD_DIR/CrossFitKaruna.xcarchive"
EXPORT_PATH="$BUILD_DIR/export"

echo "==> [3/5] Archiving (this takes ~5-10 min)..."
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  CODE_SIGN_STYLE=Automatic \
  archive || {
    echo "❌ Archive failed. Common causes:"
    echo "   - Xcode not signed in to Apple ID (Xcode → Settings → Accounts)"
    echo "   - Distribution cert missing (same dialog → Manage Certificates → +)"
    echo "   - Team ID $TEAM_ID not accessible under this Apple ID"
    exit 1
  }

echo "==> [4/5] Exporting .ipa for App Store..."
cat > "$BUILD_DIR/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>teamID</key>
  <string>$TEAM_ID</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>uploadSymbols</key>
  <true/>
  <key>stripSwiftSymbols</key>
  <true/>
</dict>
</plist>
PLIST

xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$BUILD_DIR/ExportOptions.plist" \
  -allowProvisioningUpdates || {
    echo "❌ Export failed. Check $BUILD_DIR for logs."
    exit 1
  }

IPA="$EXPORT_PATH/$SCHEME.ipa"
ls -lh "$IPA"

echo ""
echo "==> [5/5] .ipa ready at:"
echo "    $IPA"
echo ""
echo "=============================================="
echo "  Choose one of these to upload to TestFlight:"
echo "=============================================="
echo ""
echo "  A) EASIEST — Open Xcode Organizer (GUI):"
echo "     open '$ARCHIVE_PATH'"
echo "     then click 'Distribute App' → 'App Store Connect' → 'Upload'"
echo ""
echo "  B) CLI with app-specific password:"
echo "     1. Create one at: https://appleid.apple.com/account/manage"
echo "        Sign-In and Security → App-Specific Passwords → +"
echo "     2. Run:"
echo "     xcrun altool --upload-app --type ios --file '$IPA' \\"
echo "       --username chris@zorro-studios.com --password <app-specific-password>"
echo ""
echo "  C) CLI with App Store Connect API key:"
echo "     1. Create one at: https://appstoreconnect.apple.com/access/integrations/api"
echo "     2. Save AuthKey_XXXXXX.p8 to ~/.private_keys/"
echo "     3. Run:"
echo "     xcrun altool --upload-app --type ios --file '$IPA' \\"
echo "       --apiKey <key-id> --apiIssuer <issuer-id>"
echo ""
echo "After upload, Apple processes ~10 min, then invite testers at:"
echo "  https://appstoreconnect.apple.com/apps/6762426665/distribution/ios/testflight"
