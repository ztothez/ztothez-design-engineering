# Installation And Agent Configuration

This guide installs ZtotheZ Design Engineering as a local stdio MCP server. The package includes the compiled runtime, authoritative skill, approved knowledge scope, heuristic schemas, and benchmark contracts. It excludes raw research, converted books, and legacy reference repositories.

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- Chromium only when using browser verification tools
- Bubblewrap on Linux only when running executable portfolio stages inside isolated snapshots

Confirm the runtime:

```bash
node --version
npm --version
```

## Install From A Release Archive

Build and validate a local release from the repository:

```bash
npm ci
npm run package:smoke
npm run release:pack
npm run release:check
```

The release command creates a versioned npm package, a self-contained `offline-runtime/`, `knowledge-index.json`, `OFFLINE-MANIFEST.json`, and `SHA256SUMS` under `.ztothez-design-release/`. The release check verifies their integrity and launches the offline CLI from outside the source tree. Install the generated npm archive globally:

```bash
npm install -g ./.ztothez-design-release/ztothez-design-engineering-2.0.4.tgz
zz-design --version
ztothez-design --help
```

Both command names start the same server. `zz-design` is the short form. For GUI applications, resolve the full executable path and use that path in configuration:

```bash
command -v zz-design
```

On Windows, use:

```powershell
where.exe zz-design
```

For a machine that cannot access a package registry, transfer the complete `.ztothez-design-release/` directory and launch the included runtime directly:

```bash
node .ztothez-design-release/offline-runtime/dist/cli/index.js --version
node .ztothez-design-release/offline-runtime/dist/cli/index.js
```

Keep `offline-runtime/` intact because its local production dependencies and knowledge files are part of the verified bundle. Chromium is still an optional host prerequisite for rendered browser checks.

Portfolio inventory and snapshot creation work without Bubblewrap. An executable stage fails closed
unless the host provides the supported isolation boundary; it never falls back to running inside an
original project directory.

Install the current registry release directly when network access is available:

```bash
npm install -g @ztothez/design-engineering@2.0.4
zz-design --version
```

## Install From Source

Use a source checkout when developing the server:

```bash
git clone https://github.com/ztothez/ztothez-design-engineering.git
cd ztothez-design-engineering
npm ci
npm run build
npm test
```

Register this executable and argument pair:

```text
command: node
args: /absolute/path/to/ztothez-design-engineering/dist/cli/index.js
```

Set `ZTOTHEZ_DESIGN_ENGINEERING_ROOT` to the repository root only when the executable is launched through a wrapper or copied away from the package. A normal source build and packaged installation discover their own root.

## Optional Browser Runtime

Knowledge retrieval, contract validation, heuristic review, and repository auditing do not require a browser. In a source checkout, install Chromium before calling `verify_ui_runtime` or a quality gate with runtime verification:

```bash
npx --no-install playwright-core install chromium
```

After a global package installation, run the matching runtime package explicitly:

```bash
npx -y playwright-core@1.62.1 install chromium
```

On CI or Linux hosts that need system libraries, add `--with-deps` to the applicable command. For a source checkout:

```bash
npx --no-install playwright-core install --with-deps chromium
```

If a managed environment permits Chromium but blocks Playwright from launching it directly, start
Chromium separately with a loopback DevTools endpoint:

```bash
chromium --headless --no-sandbox --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 --user-data-dir=/tmp/ztothez-design-cdp about:blank
```

Then set the endpoint for `verify-ui`, `quality-gate`, or MCP runtime verification:

```bash
export ZTOTHEZ_DESIGN_CHROMIUM_CDP_URL=http://127.0.0.1:9222
```

The server accepts only an `http` or `https` loopback origin with no credentials, path, query, or
fragment. This option does not permit connection to a remote browser.

## Optional Local Portfolio MCP

Portfolio MCP tools are disabled by default because project IDs and benchmark summaries may be
private. Enable read-only access only in a trusted local MCP process:

```bash
export ZTOTHEZ_DESIGN_PORTFOLIO_MCP=enabled
export ZTOTHEZ_DESIGN_PORTFOLIO_REGISTRY=/absolute/path/to/.ztothez-design-local/portfolio-registry.yaml
export ZTOTHEZ_DESIGN_PORTFOLIO_REPORT_ROOT=/absolute/path/to/.ztothez-design-benchmarks/runs
```

This enables `list_portfolio_projects` and `get_portfolio_benchmark_report`. Neither tool exposes
source roots or starts benchmark execution. Leave these variables unset in shared or remote MCP
installations.

## Shared Stdio Configuration

The examples below use `/absolute/path/to/zz-design`, which must be replaced with the result from `command -v zz-design` or `where.exe zz-design`. If you use a source checkout, replace the command with `node` and add the compiled entrypoint as the first argument.

Use this server name everywhere:

```text
ztothez-design-engineering
```

Do not redirect server output. Standard output is reserved for MCP JSON-RPC, and diagnostics are written to standard error.

## Codex

Register the server with Codex CLI:

```bash
codex mcp add ztothez-design-engineering -- /absolute/path/to/zz-design
codex mcp list
```

Equivalent user configuration in `~/.codex/config.toml`:

```toml
[mcp_servers.ztothez-design-engineering]
command = "/absolute/path/to/zz-design"
args = []
```

Project configuration can use `.codex/config.toml` in a trusted project. See the [official Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).

## Claude Code

Register a user-scoped server:

```bash
claude mcp add --scope user ztothez-design-engineering -- /absolute/path/to/zz-design
claude mcp list
```

Use `--scope project` when the configuration should be shared through the repository. See the [official Claude Code MCP documentation](https://docs.anthropic.com/en/docs/mcp).

## Cursor

Add this to project-level `.cursor/mcp.json`, or to `~/.cursor/mcp.json` for all workspaces:

```json
{
  "mcpServers": {
    "ztothez-design-engineering": {
      "command": "/absolute/path/to/zz-design",
      "args": []
    }
  }
}
```

Reload Cursor and confirm the server is enabled in MCP settings. See the [official Cursor MCP documentation](https://cursor.com/docs/context/mcp).

## Windsurf And Cascade

For the Cascade compatibility surface, add the shared stdio entry to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "ztothez-design-engineering": {
      "command": "/absolute/path/to/zz-design",
      "args": []
    }
  }
}
```

Current Windsurf documentation is hosted under Devin Desktop and distinguishes Cascade configuration from the newer Devin Local Agent configuration. Confirm which agent is active before editing its settings. See the [official Cascade MCP documentation](https://docs.devin.ai/desktop/cascade/mcp).

## Antigravity

Create workspace configuration at `.agents/mcp_config.json`, or user configuration at `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "ztothez-design-engineering": {
      "command": "/absolute/path/to/zz-design",
      "args": []
    }
  }
}
```

Restart the agent workspace after changing configuration. See the [official Antigravity MCP documentation](https://antigravity.google/docs/mcp).

## GitHub Copilot

For Copilot Chat in VS Code, create `.vscode/mcp.json`. Copilot uses the top-level key `servers`:

```json
{
  "servers": {
    "ztothez-design-engineering": {
      "type": "stdio",
      "command": "/absolute/path/to/zz-design",
      "args": []
    }
  }
}
```

Start the server from the MCP view, then enable its tools in Agent mode. See the [official GitHub Copilot MCP documentation](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/extend-copilot-chat-with-mcp).

## Kiro

Create workspace configuration at `.kiro/settings/mcp.json`, or user configuration at `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "ztothez-design-engineering": {
      "command": "/absolute/path/to/zz-design",
      "args": []
    }
  }
}
```

Open the MCP Server view to reconnect and inspect server logs. See the [official Kiro MCP configuration documentation](https://kiro.dev/docs/mcp/configuration/).

## Qoder

Register the executable with Qoder CLI:

```bash
qoder mcp add ztothez-design-engineering -- /absolute/path/to/zz-design
```

Qoder also supports user settings in `~/.qoder/settings.json`, local settings in `.qoder/settings.local.json`, and project-level `.mcp.json`. See the [official Qoder MCP documentation](https://docs.qoder.com/cli/mcp-servers).

## Lovable

Lovable Desktop supports custom local MCP processes. Open `Connectors`, choose `Local MCP servers`, select `Custom MCP`, and enter:

```text
Name: ztothez-design-engineering
Command: /absolute/path/to/zz-design
Arguments: none
```

Approve the first connection request. Local stdio servers require Lovable Desktop; the hosted web app uses remote chat connectors instead. See the [official Lovable Desktop MCP documentation](https://docs.lovable.dev/integrations/desktop-app).

## Verify The Connection

After installation, every supported client should report server version `2.0.4` and expose `search_design_knowledge`. Run this first retrieval request:

```text
Search the skill and Figma categories for semantic design tokens and component states. Return at most three results.
```

Expected behavior:

- The result status is `matches`.
- `SKILL.md` is identified as the authority path.
- Every result path is listed in `knowledge-base/retrieval-scope.yaml`.
- No legacy or raw-research path is returned.

## Migration

When upgrading from `2.0.0`, `2.0.1`, `2.0.2`, or `2.0.3`, install `2.0.4`, restart every connected MCP client, and
confirm `zz-design --version` before removing the older package. Existing stdio configuration can
keep the same `ztothez-design-engineering` server name and `zz-design` executable.

Version `2.0.4` retains the V4 delivery-pilot, interaction, holdout, and qualification commands,
removes an obsolete reference-derived specification from distribution, and expands provenance
isolation checks across every approved artifact. It does not migrate private portfolio registries
or evidence. Keep `.ztothez-design-local/`,
`.ztothez-design-benchmarks/`, and `.ztothez-design-runtime/` outside package installation paths,
then regenerate evidence with the new executable. Validate a source checkout with:

```bash
npm ci
npm run build
npm test
npm run package:smoke
```

Do not copy `node_modules` or `dist` from an older installation over the new package. For rollback,
reinstall the prior pinned package version and restart the MCP client; private local evidence remains
unchanged because installation never imports or rewrites it.

## Troubleshooting

### Command not found

Resolve `zz-design` from the same shell environment used to launch the agent. GUI applications often receive a smaller `PATH`, so use the absolute executable path in configuration.

### Server disconnects immediately

Run `zz-design --version` and `zz-design --help`. Confirm Node.js 22 or newer. Remove shell wrappers that print banners or status text to standard output.

### Knowledge root cannot be found

Reinstall from the complete package archive. Do not copy only `dist/`. For a source checkout, run `npm run build` and keep `dist/`, `package.json`, `SKILL.md`, and `knowledge-base/` under the same repository root.

### Browser executable is missing

Install Chromium with the command in Optional Browser Runtime. Retrieval and static audit tools remain available without Chromium.

### Package validation fails

Run:

```bash
npm run package:check
npm run package:smoke
npm run independence:check
npm run release:pack
npm run release:check
```

These commands check package contents, install the tarball into an empty temporary project, validate provenance and dependency boundaries, build the offline release, verify checksums, launch its isolated CLI, and confirm the approved retrieval index.
