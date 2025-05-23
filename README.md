# AutoProvisioner MCP Server (open beta)

## Installation

1. Remote (Recommended)

- requires [node and npm to be installed](https://nodejs.org/en/download)
- remote, [SSE-based communication](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse)

Update configuration as follows:

```
{
  "mcpServers": {
    "autoprovisioner": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://autoprovisioner-remote.zerosync.co/sse"
      ]
    }
  }
}
```

2. Local

- no system dependencies
- local, [stdio-based communication](https://modelcontextprotocol.io/docs/concepts/transports#standard-input%2Foutput-stdio)

```
curl -fsSL https://raw.githubusercontent.com/zerosync-co/mcp-server-autoprovisioner/main/install-prerelease.sh | bash
```

Run `mcp-server-autoprovisioner init`, or update configuration as follows

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

## Build From Source

```
deno compile \
    --output mcp-server-autoprovisioner \
    --env-file=".env" \
    --no-check \
    -A stdio/index.ts
```

## Testing options

```
npx @modelcontextprotocol/inspector
```
