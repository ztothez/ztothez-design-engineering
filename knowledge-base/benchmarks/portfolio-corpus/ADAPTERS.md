# Portfolio Stack Adapters

Stack adapters convert local registry declarations into bounded benchmark capabilities. They do not
discover and execute package scripts. The local registry must select an adapter, declare each
capability, and provide an exact command for every executable stage.

## Supported Adapters

| Adapter | Intended project | Browser stages |
|---|---|---|
| `react-vite` | React with Vite or TanStack Router | Supported when declared |
| `nextjs` | Next.js frontend | Supported when declared |
| `angular` | Angular frontend | Supported when declared |
| `static-web` | Static HTML, CSS, and JavaScript | Supported when declared |
| `node-python-fullstack` | Frontend with a Node or Python service | Supported when declared |
| `python-source` | Source-only Python or desktop tool | Not applicable |

Every adapter reports all eight portfolio stages. An undeclared or commandless stage is
`unsupported`. A stage outside the adapter's product surface is `not-applicable`. Neither status is
reported as a pass or a product defect.

## Command Contract

Declare commands under `project.execution.commands`. Each stage may have at most one command.

```yaml
technology:
  framework: React with Vite
  packageManager: npm
  entrypoint: package.json
  adapter: react-vite
capabilities:
  - stage: production-build
    status: supported
    reason: The product has a reviewed production build.
execution:
  fixtureMode: disconnected
  networkPolicy: denied
  lifecycleScripts: false
  allowedEnvironmentVariables: []
  localPorts: []
  commands:
    - stage: production-build
      command: npm
      arguments: [run, build]
      cwd: .
      timeoutMs: 120000
      maxOutputBytes: 2097152
      allowDependencyNetwork: false
```

The executor passes arguments directly without a shell. Adapter policy permits only known
executables and stage-specific package scripts. Direct Node and Python commands must name a
contained relative script and cannot use eval or command-string flags. The snapshot runner then
enforces the working-directory boundary, environment allowlist, network policy, timeout, process
group cleanup, output ceiling, and post-run source mutation check.

## Workflow

1. Validate the local registry.
2. Inspect effective capability support with `zz-design portfolio capabilities --project ID`.
3. Resolve every warning or accept it as a documented limitation.
4. Execute one declared stage with `zz-design portfolio run-stage --project ID --stage STAGE`.
5. Treat `unsupported` and `not-applicable` as limitations, never successful product evidence.
6. Treat command-policy errors, nonzero exits, and timeouts as failed execution evidence.

Original projects remain read-only. All executable commands run in disposable snapshots managed by
the mutation guard.
