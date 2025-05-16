#!/bin/bash

# TODO-- refactor into github workflow on release-action branch

DIST_DIR="dist"
SOURCE_FILE="src/index.ts"
VERSION="${GITHUB_EVENT_RELEASE_TAG_NAME:-dev-$(git rev-parse --short HEAD)}"

mkdir -p "$DIST_DIR"

compile_binary() {
    local name="$1"
    local target="$2"
    local extension="$3"

    echo "Compiling for $name..."

    # REVIEW-- this should not need all permissions
    deno compile \
        --target "$target" \
        -A \
        --output "${DIST_DIR}/mcp-server-autoprovisioner-${name}-${VERSION}${extension}" \
        --env-file=".env" \
        "$SOURCE_FILE"

    if [ $? -eq 0 ]; then
        echo "Successfully compiled mcp-server-autoprovisioner-${name}-${VERSION}${extension}"
    else
        echo "Failed to compile for $name"
        exit 1
    fi
}

compile_binary "linux" "x86_64-unknown-linux-gnu" ""
compile_binary "linux-arm64" "aarch64-unknown-linux-gnu" ""
compile_binary "macos" "x86_64-apple-darwin" ""
compile_binary "macos-arm64" "aarch64-apple-darwin" ""
# compile_binary "windows" "x86_64-pc-windows-msvc" ".exe"

echo "Compilation complete!"
