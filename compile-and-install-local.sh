#!/bin/bash
set -eou pipefail

ENV_FILE=.env

# workaround because I don't know how to pass individual env vars to deno compile
temp_file=$(mktemp)
trap 'rm -f "$temp_file"' EXIT
cp $ENV_FILE "$temp_file"

VERSION="${GITHUB_EVENT_RELEASE_TAG_NAME:-dev-$(git rev-parse --short HEAD)}"
echo "VERSION=\"$VERSION\"" >> "$temp_file"

# REVIEW-- this should not need all permissions
deno compile \
    --output autoprovisioner \
    --env-file="$temp_file" \
    -A stdio/index.ts

# TODO-- support windows release
OS=''
case `uname` in
  Darwin*)  OS="macos" ;;
  Linux*)   OS="linux" ;;
  *)        echo "unknown os: $OSTYPE" && exit 1 ;;
esac

ARCH=`uname -m`
case "$ARCH" in
  ix86*|x86_64*)    ARCH="x86_64" ;;
  arm64*|aarch64*)  ARCH="arm64" ;; # TODO-- technically this should be aarch64?
  *)                echo "unknown arch: $ARCH" && exit 1 ;;
esac

is_valid_install_dir() {
  [[ ":$PATH:" == *":$1:"* ]] && [ -w "$1" ]
}

INSTALL_DIR=""
USE_SUDO=""

for dir in "$HOME/bin" "$HOME/.local/bin" "$HOME/.bin"; do
  if is_valid_install_dir "$dir"; then
    INSTALL_DIR="$dir"
    break
  fi
done

if [ -z "$INSTALL_DIR" ]; then
  INSTALL_DIR="/usr/local/bin"
  USE_SUDO=1
fi

MCP_SERVER_AUTOPROVISIONER_TARGET="$INSTALL_DIR/mcp-server-autoprovisioner"

if [ "$USE_SUDO" = "1" ]; then
  echo "No user-writable bin directory found in PATH. Using sudo to install in $INSTALL_DIR"
  sudo mv ./autoprovisioner "$MCP_SERVER_AUTOPROVISIONER_TARGET"
else
  mv ./autoprovisioner "$MCP_SERVER_AUTOPROVISIONER_TARGET"
fi
chmod +x "$MCP_SERVER_AUTOPROVISIONER_TARGET"

echo "Successfully installed ./autoprovisioner to $MCP_SERVER_AUTOPROVISIONER_TARGET"
