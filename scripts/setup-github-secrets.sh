#!/usr/bin/env bash
# One-time setup: uploads the release signing key, Firebase config and .env values to this
# repository's GitHub Actions secrets so .github/workflows/android-release.yml can build APKs.
#
# Run from the project folder (Git Bash on Windows works):
#   bash scripts/setup-github-secrets.sh ../tuitiontrack-release.jks
# It asks for the keystore password (see tuitiontrack-release-key.txt next to the .jks).
set -euo pipefail

REPO="shakib-mehrab/TuitionTrack"
KEYSTORE="${1:-../tuitiontrack-release.jks}"
ALIAS="${2:-tuitiontrack}"

[ -f "$KEYSTORE" ] || { echo "Keystore not found: $KEYSTORE"; exit 1; }
[ -f google-services.json ] || { echo "google-services.json not found in this folder"; exit 1; }
[ -f .env ] || { echo ".env not found in this folder"; exit 1; }

read -r -s -p "Keystore password: " KS_PASS
echo

base64 -w0 "$KEYSTORE" | gh secret set ANDROID_KEYSTORE_BASE64 -R "$REPO"
printf "%s" "$KS_PASS" | gh secret set ANDROID_KEYSTORE_PASSWORD -R "$REPO"
printf "%s" "$ALIAS" | gh secret set ANDROID_KEY_ALIAS -R "$REPO"
base64 -w0 google-services.json | gh secret set GOOGLE_SERVICES_JSON_BASE64 -R "$REPO"
gh secret set -R "$REPO" -f .env

echo "Secrets set:"
gh secret list -R "$REPO"
echo "Now start the first build:  gh workflow run android-release.yml -R $REPO"
