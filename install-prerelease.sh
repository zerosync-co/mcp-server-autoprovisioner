#!/bin/bash
set -eou pipefail

MCP_SERVER_AUTOPROVISIONER_RELEASE_API_URL="https://api.github.com/repos/zerosync-co/mcp-server-autoprovisioner/releases"
MCP_SERVER_AUTOPROVISIONER_RESPONSE=$(curl -s "$MCP_SERVER_AUTOPROVISIONER_RELEASE_API_URL" | jq -r '[.[] | select(.prerelease == true)] | first')
if [ -z "$MCP_SERVER_AUTOPROVISIONER_RESPONSE" ]; then
    echo hello 1

    echo "Error: Failed to fetch the latest mcp-server-autoprovisioner release from GitHub API."
    exit 1
fi



MCP_SERVER_AUTOPROVISIONER_LATEST_TAG=$(echo "$MCP_SERVER_AUTOPROVISIONER_RESPONSE" | grep -m 1 '"tag_name":' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
echo $MCP_SERVER_AUTOPROVISIONER_LATEST_TAG
if [ -z "$MCP_SERVER_AUTOPROVISIONER_LATEST_TAG" ]; then
    echo "Error: Could not find the latest mcp-server-autoprovisioner release tag."
    exit 1
fi

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

MCP_SERVER_AUTOPROVISIONER_DOWNLOAD_URL="https://github.com/zerosync-co/mcp-server-autoprovisioner/releases/download/$MCP_SERVER_AUTOPROVISIONER_LATEST_TAG/mcp-server-autoprovisioner-$OS-$ARCH-$MCP_SERVER_AUTOPROVISIONER_LATEST_TAG"

# Function to check if a directory is in PATH and writable
is_valid_install_dir() {
  [[ ":$PATH:" == *":$1:"* ]] && [ -w "$1" ]
}

INSTALL_DIR=""
USE_SUDO=""

# Check for common user-writable directories in PATH
for dir in "$HOME/bin" "$HOME/.local/bin" "$HOME/.bin"; do
  if is_valid_install_dir "$dir"; then
    INSTALL_DIR="$dir"
    break
  fi
done

# If no user-writable directory found, use system directory
if [ -z "$INSTALL_DIR" ]; then
  INSTALL_DIR="/usr/local/bin"
  USE_SUDO=1
fi

echo "Installing mcp-server-autoprovisioner release with tag: $MCP_SERVER_AUTOPROVISIONER_LATEST_TAG"

MCP_SERVER_AUTOPROVISIONER_TARGET="$INSTALL_DIR/mcp-server-autoprovisioner"
echo "Downloading mcp-server-autoprovisioner from: $MCP_SERVER_AUTOPROVISIONER_DOWNLOAD_URL"

if curl -fL --progress-bar --output /tmp/mcp-server-autoprovisioner "$MCP_SERVER_AUTOPROVISIONER_DOWNLOAD_URL"; then
  if [ "$USE_SUDO" = "1" ]; then
    echo "No user-writable bin directory found in PATH. Using sudo to install in $INSTALL_DIR"
    sudo mv /tmp/mcp-server-autoprovisioner "$MCP_SERVER_AUTOPROVISIONER_TARGET"
  else
    mv /tmp/mcp-server-autoprovisioner "$MCP_SERVER_AUTOPROVISIONER_TARGET"
  fi
  chmod +x "$MCP_SERVER_AUTOPROVISIONER_TARGET"

  echo "Successfully installed mcp-server-autoprovisioner to $MCP_SERVER_AUTOPROVISIONER_TARGET"
else
  echo "Failed to download or install mcp-server-autoprovisioner. Curl exit code: $?"
  exit
fi

echo "Installation complete. Ready to initialize..."

echo -n "Do you want to proceed? (Y/n): "
read -r response < /dev/tty
case "$response" in
    [yY]*|"")
        echo "Proceeding..."
        ;;
    [nN]*)
        echo "Aborting. Type 'mcp-server-autoprovisioner init' to complete setup"
        exit 1
        ;;
    *)
        echo "Invalid input. Type 'mcp-server-autoprovisioner init' to complete setup"
        exit 1
        ;;
esac

mcp-server-autoprovisioner init
