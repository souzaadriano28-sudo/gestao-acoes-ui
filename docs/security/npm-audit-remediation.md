# NPM audit remediation: `remediate-frontend-dependencies`

## Scope

This record tracks the dependency-only remediation in `gestao-acoes-ui`. Package counts below are npm vulnerability entries; they are not counts of distinct advisories. No `npm audit fix --force`, Angular 22, override, application-code change, test removal, or provider substitution is part of the first wave.

## Baseline

- Captured at: `2026-09-05T13:49:58-03:00`
- Node.js: `v24.16.0`
- npm: `11.13.0`
- `package.json` SHA-256: `32FEC13E4AE5408ECE12736CAD2ED35DA40C45545C669B60B0016B5FD83971D8`
- `package-lock.json` SHA-256: `9FD2414E69C31154D85ED1A5C4479D730E8F422961C59CEA5C77B7A9891293AC`
- Unique advisory identifiers represented by the vulnerable entries: 66
- The two hashes were unchanged after all baseline queries.

Commands:

```powershell
npm.cmd audit --json --package-lock-only
npm.cmd audit --json --package-lock-only --omit=dev
npm.cmd outdated --json --long
npm.cmd explain <package> --json
```

### Counts by scope and severity

| Scope | Info | Low | Moderate | High | Critical | Total |
|---|---:|---:|---:|---:|---:|---:|
| Complete dependency graph | 0 | 3 | 2 | 21 | 1 | 27 |
| Production graph (`--omit=dev`) | 0 | 0 | 0 | 6 | 0 | 6 |

Classification of the 27 vulnerable package entries:

- Direct production: 6, all high severity.
- Direct development: 3, all high severity.
- Transitive development: 18, comprising 3 low, 2 moderate, 12 high, and 1 critical entries.

### Direct production dependencies

| Package | Baseline | Compatible target (`wanted`) | Latest | Baseline severity |
|---|---:|---:|---:|---|
| `@angular/common` | 21.2.15 | 21.2.22 | 22.1.5 | High |
| `@angular/compiler` | 21.2.15 | 21.2.22 | 22.1.5 | High |
| `@angular/core` | 21.2.15 | 21.2.22 | 22.1.5 | High |
| `@angular/forms` | 21.2.15 | 21.2.22 | 22.1.5 | High |
| `@angular/platform-browser` | 21.2.15 | 21.2.22 | 22.1.5 | High |
| `@angular/router` | 21.2.15 | 21.2.22 | 22.1.5 | High |

The vulnerable Angular 21 range ends at 21.2.18. The first wave therefore raises the declared floor and resolved versions to the compatible 21.2.22 patch. Angular 22.1.5 is intentionally not selected.

### Direct development dependencies

| Package | Baseline | Compatible target (`wanted`) | Latest | Baseline severity |
|---|---:|---:|---:|---|
| `@angular/build` | 21.2.13 | 21.2.23 | 22.1.7 | High |
| `@angular/cli` | 21.2.13 | 21.2.23 | 22.1.7 | High |
| `@angular/compiler-cli` | 21.2.15 | 21.2.22 | 22.1.5 | High |

`@angular/compiler-cli` is authorized to move to 21.2.22 in the first wave solely because its exact peer must match `@angular/compiler@21.2.22`. `@angular/build` and `@angular/cli` remain unchanged and reserved for the second wave.

### Transitive development dependencies and direct roots

| Vulnerable package | Severity | Direct roots observed with `npm explain` |
|---|---|---|
| `@babel/core` | Low | `@angular/build`, `@angular/compiler-cli` |
| `@hono/node-server` | Moderate | `@angular/cli` |
| `body-parser` | Low | `@angular/cli` |
| `brace-expansion` | High | `@angular/cli` |
| `browserslist` | High | `@angular/build`, `@angular/compiler-cli` |
| `esbuild` | Low | `@angular/build`, `vitest` |
| `fast-uri` | High | `@angular/build`, `@angular/cli` |
| `hono` | High | `@angular/cli` |
| `immutable` | High | `@angular/build`, `vitest` |
| `ip-address` | High | `@angular/cli` |
| `nanoid` | High | `@angular/build`, `vitest` |
| `pacote` | High | `@angular/cli` |
| `piscina` | High | `@angular/build` |
| `postcss` | High | `@angular/build`, `vitest` |
| `qs` | Moderate | `@angular/cli` |
| `tar` | Critical | `@angular/cli` through `pacote` and `node-gyp` |
| `undici` | High | `@angular/build`, `@angular/cli`, `jsdom`, `vitest` |
| `vite` | High | `@angular/build`, `vitest` |

The second wave will address this development-only graph through compatible parent upgrades. No transitive package is promoted to a direct dependency and no override is introduced in the first wave.

## First-wave result

Completed at `2026-09-05T14:06:04-03:00` with Node.js `v24.16.0` and npm `11.13.0`.

The initial production-only boundary was blocked because `@angular/compiler-cli@21.2.15` has an exact peer on `@angular/compiler@21.2.15`. The corrected `@angular/compiler-cli@21.2.22` instead requires exactly `@angular/compiler@21.2.22`. The first-wave boundary was amended and explicitly authorized to include this single companion package. `@angular/build` and `@angular/cli` remained at 21.2.13.

Normal npm incremental resolution attempts returned `ERESOLVE` while validating the old exact-peer cluster stored in the lock. No relaxation flag was used. The update was completed with Angular's supported package-group updater:

```powershell
npx.cmd --no-install ng update @angular/core@21.2.22 --allow-dirty
```

The updater used a temporary Angular CLI 21.2.23 to perform package-group resolution but did not change the declared or resolved `@angular/cli` or `@angular/build`. It modified only `package.json` and `package-lock.json`; no application source or migration file changed. Manual lockfile surgery was not used.

### Resolved versions

| Package | Before | After |
|---|---:|---:|
| `@angular/common` | 21.2.15 | 21.2.22 |
| `@angular/compiler` | 21.2.15 | 21.2.22 |
| `@angular/core` | 21.2.15 | 21.2.22 |
| `@angular/forms` | 21.2.15 | 21.2.22 |
| `@angular/platform-browser` | 21.2.15 | 21.2.22 |
| `@angular/router` | 21.2.15 | 21.2.22 |
| `@angular/compiler-cli` | 21.2.15 | 21.2.22 |
| `@angular/build` | 21.2.13 | 21.2.13 |
| `@angular/cli` | 21.2.13 | 21.2.13 |

- First-wave `package.json` SHA-256: `E62D31F916FB391FEAC049A83CF67A18296CE9C988C1EBAD0B89E373A17C999E`
- First-wave `package-lock.json` SHA-256: `85997AA581DD47861FF4F4D3E4B960F1DA10DB6CA43551F7136E56FB7E6572F3`
- `npm ci` installed 476 packages and left both hashes unchanged.
- `npm ls --all` exited with zero and reported no invalid dependency or peer.

### Comparative audit

| Audit | Baseline | After first wave | Change |
|---|---:|---:|---:|
| Complete total | 27 | 20 | -7 |
| Low | 3 | 3 | 0 |
| Moderate | 2 | 2 | 0 |
| High | 21 | 14 | -7 |
| Critical | 1 | 1 | 0 |
| Production total | 6 | 0 | -6 |

All six direct production findings and the direct `@angular/compiler-cli` finding were removed. The 20 remaining entries are development-only: two direct (`@angular/build`, `@angular/cli`) and eighteen transitive. Their remediation remains assigned to the second wave. `@babel/core@7.29.7` was added below `@angular/compiler-cli` as a compatible consequence, while another vulnerable Babel path remains through the unchanged build toolchain.

### Regression gates

- Unit tests: passed, 8 test files and 20 tests (`npm.cmd test -- --watch=false`).
- Production build: passed (`npm.cmd run build`).
- Initial bundle: 321.50 kB raw / 83.00 kB estimated transfer, below the configured 500 kB warning and 1 MB error budgets.
- No test, application source, workflow, E2E configuration, or backend file changed.
- `npm audit fix --force`, `--legacy-peer-deps`, Angular 22, and overrides were not used.

## Remaining work

- Second-wave Angular development-tool updates and transitive remediation.
- Final clean-install audit and explicit residual-risk assessment.
- E2E with real Angular and Spring processes and local provider stub.
- Static, local-equivalent, and authorized remote workflow validation.
