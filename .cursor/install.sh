#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for koishi-plugin-warframe.
#
# Mirrors the repository CI (.github/workflows/build-and-test.yml):
#   Node 24.x + Corepack Yarn 4.5.3, then install -> build -> type -> lint -> test.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# --- Node.js -----------------------------------------------------------------
# Several dependencies (e.g. warframe-worldstate-parser) require Node
# "^22.18.0 || >=24.11.0", and CI pins Node 24.x. The Cloud Agent default node
# is older, so install and pin Node 24 through nvm.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
OVERRIDE_DIR="/usr/local/cargo/bin"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install 24 >/dev/null
  nvm use 24 >/dev/null
  NODE_BIN_DIR="$(dirname "$(nvm which 24)")"

  # The Cloud Agent injects an older `node` earlier in PATH than nvm. Publish
  # the selected toolchain into the first writable PATH entry so every shell
  # (this install, later terminals, and future agents) defaults to Node 24.
  if [ -d "$OVERRIDE_DIR" ] && [ -w "$OVERRIDE_DIR" ]; then
    for bin in node npm npx corepack; do
      ln -sf "$NODE_BIN_DIR/$bin" "$OVERRIDE_DIR/$bin"
    done
    export PATH="$OVERRIDE_DIR:$PATH"
  fi
fi

hash -r || true
echo "Using Node $(node -v)"

# --- Yarn (Corepack) ---------------------------------------------------------
# Install the Corepack package-manager shims next to the overridden node so
# `yarn` (pinned to 4.5.3, matching CI) is available on the default PATH.
if [ -d "$OVERRIDE_DIR" ] && [ -w "$OVERRIDE_DIR" ]; then
  corepack enable --install-directory "$OVERRIDE_DIR"
else
  corepack enable
fi
corepack prepare yarn@4.5.3 --activate
hash -r || true
echo "Using Yarn $(yarn -v)"

# --- Dependencies ------------------------------------------------------------
# Warframe Market's export dependency is unavailable on some mirrors, so pin the
# canonical npm registry for this install only. No committed lockfile exists in
# this standalone checkout (it is normally workspace-managed), so allow Yarn to
# resolve one locally without treating it as immutable.
YARN_NPM_REGISTRY_SERVER="https://registry.npmjs.org" yarn install --no-immutable

# --- Build -------------------------------------------------------------------
# The test suite includes bundle/asset-boundary checks that read build output
# (lib/), so produce it during setup to keep `yarn test` green out of the box.
yarn build

# --- Test-path shim ----------------------------------------------------------
# Structure/boundary tests locate the package through `external/warframe`
# (the canonical Koishi workspace layout) or a directory whose name ends in
# "warframe". The Cloud Agent checks the repo out at /workspace, so expose the
# expected path. This directory is git-ignored.
mkdir -p external
ln -sfn "$REPO_ROOT" external/warframe

echo "Cloud Agent install complete."
