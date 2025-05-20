# AutoProvisioner MCP Server (open beta)

## Installation (prerelease)

```
curl -fsSL https://raw.githubusercontent.com/zerosync-co/mcp-server-autoprovisioner/main/install-prerelease.sh | bash
```

### Manual Installation

```
{
  "mcpServers": {
    "autoprovisioner": {
      "command": "path/to/mcp-server-autoprovisioner", // which mcp-server-autoprovisioner
      "args": [
        "run",
        "user_..." // mcp-server-autoprovisioner whoami
      ]
    }
  }
}
```

## From Source

```
deno compile \
    --output mcp-server-autoprovisioner \
    --env-file=".env" \
    -A src/index.ts
```

## Testing options

```
npx @modelcontextprotocol/inspector
```
