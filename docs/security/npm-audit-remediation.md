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

- Publish the second-wave revision when separately authorized, then run the remote frontend quality workflow and manual E2E with the published full frontend/backend SHAs. No commit or push was authorized for this validation pass.

## Second-wave result

Completed dependency resolution at `2026-09-05T14:21:47-03:00` with Node.js `v24.16.0` and npm `11.13.0`.

Angular's package-group updater moved only `@angular/build` and `@angular/cli` from 21.2.13 to 21.2.23. Production Angular and `@angular/compiler-cli` remained at 21.2.22. The direct non-vulnerable parent Vitest moved within its declared range from 4.1.7 to 4.1.11 because it shares Vite, esbuild, PostCSS, nanoid, and immutable paths with the Angular build graph; its manifest range remained unchanged.

After all compatible parents were current, five vulnerable versions remained selected by the lock despite accepting safe patches. A targeted normal `npm update` selected the safe versions within every existing consumer range. No transitive was promoted to the manifest and no override or peer relaxation was used.

| Previously vulnerable transitive | Final version | Verified direct roots |
|---|---:|---|
| `@babel/core` | 7.29.7 | `@angular/build`, `@angular/compiler-cli` |
| `@hono/node-server` | 2.1.1 | `@angular/cli` |
| `body-parser` | 2.3.0 | `@angular/cli` |
| `brace-expansion` | 5.0.9 | `@angular/cli` |
| `browserslist` | 4.28.9 | `@angular/build`, `@angular/compiler-cli` |
| `esbuild` | 0.28.1 | `@angular/build`, `vitest` |
| `fast-uri` | 3.1.7 | `@angular/build`, `@angular/cli` |
| `hono` | 4.13.7 | `@angular/cli` |
| `immutable` | 5.1.9 | `@angular/build`, `vitest` |
| `ip-address` | 10.7.0 | `@angular/cli` |
| `nanoid` | 3.3.18 | `@angular/build`, `vitest` |
| `pacote` | 21.5.1 | `@angular/cli` |
| `piscina` | 5.2.0 | `@angular/build` |
| `postcss` | 8.5.28 | `@angular/build`, `vitest` |
| `qs` | 6.16.0 | `@angular/cli` |
| `tar` | 7.5.22 | `@angular/cli` |
| `undici` | 6.28.1 and 7.29.0 | `@angular/build`, `@angular/cli`, `jsdom`, `vitest` |
| `vite` | 7.3.6 | `@angular/build`, `vitest` |

Pre-clean-install audit result: zero vulnerabilities in both the complete and production graphs. The final hashes before the clean-install gate were:

- `package.json`: `4422975D8F264CE0F01272784D1400649A34BF1177A10BC4B6C9DA333554E470`
- `package-lock.json`: `4A09BC86E05992E487CCD654A3CFC7418470C80EDF1964734A0F43017B05A0C4`

## Final local acceptance

Completed on `2026-09-05` with Node.js `v24.16.0` and npm `11.13.0`.

### Clean install, dependency tree, and comparative audit

- `npm.cmd ci` installed 472 packages and reported zero vulnerabilities.
- The post-install hashes exactly matched the pre-install hashes recorded above; the clean install did not change either dependency file.
- `npm.cmd ls --all --json` exited with zero, with no invalid package or peer dependency.
- Final complete audit: 0 info, 0 low, 0 moderate, 0 high, 0 critical; total 0.
- Final production audit (`--omit=dev`): 0 info, 0 low, 0 moderate, 0 high, 0 critical; total 0.

| Audit | Baseline | First wave | Final | Baseline-to-final change |
|---|---:|---:|---:|---:|
| Complete total | 27 | 20 | 0 | -27 |
| Low | 3 | 3 | 0 | -3 |
| Moderate | 2 | 2 | 0 | -2 |
| High | 21 | 14 | 0 | -21 |
| Critical | 1 | 1 | 0 | -1 |
| Production total | 6 | 0 | 0 | -6 |

There are no residual npm vulnerabilities to accept or defer, including no production residual. Consequently there is no incompatible-major exception, mitigation owner, or review date to record. No new advisory appeared.

### Regression and integration evidence

- Unit tests: 8 files and 20 tests passed; no test file or assertion changed.
- Production build: passed with an initial bundle of 321.60 kB raw / 83.11 kB estimated transfer, below the existing 500 kB warning and 1 MB error budgets.
- E2E preflight: ports 4200, 8080, and 9090 had no listeners; all three were free again after the run.
- Isolation: `reuseExistingServer: false`; Angular ran on 4200, the real Spring application ran on 8080 with the `test` profile and in-memory H2, and every configured external-provider URL pointed to the local stub on 9090.
- E2E: the first run exposed an existing timing sensitivity after the AAPL purchase (the immediate next action occurred before the `2 cotas` position became visible). No code or test was changed; an immediate clean rerun passed the single complete journey in 18.0 seconds, with the test itself taking 1.9 seconds. This remains a flakiness risk to monitor, not a dependency or audit acceptance failure.
- Generated `dist`, Playwright report, and test-result artifacts were not added to Git; the two E2E report directories were removed after inspection.

### Workflow correspondence

Static checks confirmed that frontend `quality.yml` and `e2e.yml` pin Node.js 24.16.0 and npm 11.13.0, cache by `package-lock.json`, use `npm ci`, run the expected tests/build or Chromium/E2E commands, validate full 40-character E2E SHAs, pin actions to immutable SHAs, restrict permissions to `contents: read`, and contain no forced dependency-resolution command.

The local equivalents completed against the final lockfile: clean install, unit tests, production build, lockfile-compatible Chromium installation, and the integrated E2E rerun. Remote workflow execution remains intentionally pending because the current second-wave files have not been committed or pushed.

### Scope and prohibited mechanisms

The final frontend change is limited to `package.json`, `package-lock.json`, and this security record. No application source, test, workflow, backend, `.env`, Docker, Flyway, or Liquibase file changed. No `npm audit fix --force`, `--legacy-peer-deps`, Angular 22, incompatible override, artificial direct transitive, or tool/test removal was used.
