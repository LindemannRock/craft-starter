# Craft CMS Starter by LindemannRock

[![Craft CMS](https://img.shields.io/badge/Craft%20CMS-5.9%2B-orange.svg)](https://craftcms.com/)
[![PHP](https://img.shields.io/badge/PHP-8.3%2B-blue.svg)](https://php.net/)
[![Node](https://img.shields.io/badge/Node-22%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

An opinionated, interactive Craft CMS 5 starter. Run `make create`, answer a few questions, and end up with a configured DDEV project — Tailwind CSS 4, TypeScript, Alpine.js, the plugins you need, and hosting wired up — all installed and ready to develop.

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Make commands](#make-commands)
- [After `make create`](#after-make-create)
- [Project structure](#project-structure)
- [Stack](#stack)
- [Plugins](#plugins)
- [Template hierarchy](#template-hierarchy)
- [Environment variables](#environment-variables)
- [What `make create` does differently based on your choices](#what-make-create-does-differently-based-on-your-choices)
- [Testing](#testing)
- [Device testing (Tailscale)](#device-testing-tailscale)
- [Versioning & releases (release-please)](#versioning--releases-release-please)
- [Support](#support)
- [License](#license)

## Features

- **Interactive installer** — `make create` walks you through project name, timezone, language, admin credentials, plugin selection, hosting, and feature toggles with a modern TUI (review loop + per-section editing if you change your mind)
- **Auto-generated credentials** — Craft security key, app ID, and LR plugin IP salts generated locally, never committed
- **Multi-hosting ready** — Servd, Craft Cloud, or self-hosted with plugin-level conditionals
- **Email transport configured automatically** — Postmark, SMTP (Servd SMTP, Mailgun, etc.), or Mailpit as a safe dev default; written to project config so the CP shows the right value and Servd's sendmail alert never fires
- **Redis opt-in** — cache + optional sessions. Adds `ddev/ddev-redis` addon + `yii2-redis` package, env-var-gated components in `app.php` (DB 0 for cache, DB 1 for sessions). Each Redis feature prompted separately
- **Critical CSS opt-in** — slow builds (Chromium-based) are off by default; `make prod` is fast, `make critical` generates above-the-fold CSS when you need it. Declining removes `rollup-plugin-critical` + ~20 Chromium apt packages from DDEV
- **Multi-site support** — 1 to N sites with per-site language, URL prefix, name, and RTL detection. Sites created via Craft's project-config API, translation files scaffolded per locale, favicon generation with per-site web manifests
- **Vite 8 build pipeline** — Rolldown-powered (10-30× faster), single `web/dist/` output, Subresource Integrity (SRI), gzip compression, page-specific asset splitting. For per-environment runtime config (Algolia keys, Mapbox tokens, etc.) inject from Twig into `window.__APP_CONFIG__` — do **not** rely on `import.meta.env.VITE_*` baking values into the bundle.
- **TypeScript-first frontend** — Alpine.js session/UTM store, lazy-loaded Swiper + mmenu, conditional `svgo` (with Icon Manager)
- **Tailwind CSS 4 (CSS-first)** — no `tailwind.config.*` file, theme in `src/css/global.css` via `@theme`
- **Template hierarchy** — `_boilerplate → base-web → base-html → base → header/footer` with an entry router pattern (`_routerEntries.twig`)
- **release-please** automated versioning via conventional commits
- **Prettier + Twig formatting** with the same config used across LR client projects
- **Consolidated Makefile** — `make help` shows the essential commands; heavy tooling (`make update`, `make registry`, `make db`) opens interactive pickers instead of polluting the help with N sub-targets

## Requirements

- [Docker](https://www.docker.com)
- [DDEV](https://ddev.com) 1.25+
- Node 22+ and npm 10+ (for running the CLI outside DDEV — DDEV provides Node internally for the project itself)

### Optional

- [Tailscale](https://tailscale.com) — only if you want `make share` / `make funnel` for device testing. Free for personal use. See the [Device testing](#device-testing) section below for install details (app cask vs. CLI).

> The `make create` installer checks that Docker, DDEV, and Node are present before running. If any are missing you'll get a clean error with install links.

## Quick Start

```bash
git clone git@github.com:LindemannRock/craft-starter.git my-project
cd my-project
make create
```

`make create` will:

1. Prompt you for project details, sites, features (Redis, critical CSS), plugins, hosting, and email transport
2. Let you review the full configuration and jump back to edit any section
3. Write `composer.json`, `package.json`, `.ddev/config.yaml`, `.env`, plugin configs, and translation scaffolding
4. Strip or keep conditional code based on your choices (critical CSS deps, hosting-specific env sections, unused plugin env vars)
5. Start DDEV (plus the Redis add-on if enabled)
6. Run Composer + NPM installs
7. Install Craft CMS with your credentials (non-interactive, idempotent)
8. Activate all selected plugins
9. Apply project config and persist your email transport choice

When it finishes you'll see the site URL, CP URL, login, and a hint about which commands to run next (`make dev`, `make prod`, `make critical` if enabled).

## Make commands

Run `make` (or `make help`) with no arguments to see a grouped, color-coded list of every available command — `help` is the default target.

### Setup & install

| Command                    | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `make create`              | Interactive setup (end-to-end: prompts → install → ready)  |
| `make install`             | Install or re-sync the project (idempotent — needs `.env`) |
| `make start`               | `ddev start` + Vite dev server                             |
| `make keys`                | Generate Craft security key + app ID into `.env`           |
| `make npm-install`         | Run `npm install` inside DDEV                              |

### Development

| Command                    | Alias  | Description                                       |
| -------------------------- | ------ | ------------------------------------------------- |
| `make dev`                 |        | Start Vite dev server (HMR)                       |
| `make test`                |        | Run CLI unit tests (vitest — no DDEV needed)      |
| `make prod`                |        | Production build (fast — skips critical CSS)      |
| `make critical`            |        | Production build + critical CSS (slow — spawns Chromium per page). Only available if you opted in to critical CSS during `make create` |
| `make favicons`            |        | Generate favicons from `src/img/favicon.svg`      |
| `make format`              | `fmt`  | Format everything with Prettier                   |
| `make kill-vite`           | `kv`   | Kill stuck Vite processes                         |
| `make launch`              | `l`    | Launch the site in your browser                   |
| `make tableplus`           | `tp`   | Launch TablePlus                                  |
| `make mailpit`             | `mp`   | Launch Mailpit                                    |

### Device testing (Tailscale)

| Command                    | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `make share`               | Share the site over your Tailnet (test device needs Tailscale) |
| `make funnel`              | Share the site publicly via Tailscale Funnel (no Tailscale on test device) |

### Maintenance

Three commands open interactive pickers so you don't have to remember sub-target names. Direct sub-targets are still callable (documented under each picker below).

| Command                 | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `make up`               | Apply project config + run pending migrations              |
| `make update`           | Interactive picker — Craft / Composer / Frontend / CLI / All |
| `make registry`         | Maintain the plugin list offered by `make create` (check / update / add / fetch configs) |
| `make db`               | Database picker — pull from Servd / export / import        |
| `make verify`           | Scan `.env` for unfilled `# TODO:` placeholders (run before deploy) |
| `make clean`            | Remove vendor & node_modules then reinstall                |
| `make clean-logs`       | Remove `storage/logs/*.log`                                |
| `make reindex-search`   | Rebuild the search index                                   |

#### `make update` sub-targets (hidden from help, still callable)

| Command                 | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `make update-craft`     | `craft update all` — Craft CMS + plugins via Craft's updater |
| `make update-composer`  | `composer update` — latest matching versions              |
| `make update-npm`       | Frontend packages in project `node_modules/` (via `npm-check`) |
| `make update-cli`       | CLI scaffolding packages in `cli/node_modules/`           |

Tip: pick "Craft CMS + plugins" in the picker to get Craft's native interactive flow (pick a specific plugin handle, or update all).

#### `make registry` sub-targets (hidden)

| Command                       | Description                                    |
| ----------------------------- | ---------------------------------------------- |
| `make registry-plugins-check` | Compare registry versions against Packagist   |
| `make registry-plugins-update`| Apply version bumps (confirms major bumps)    |
| `make registry-plugins-add`   | Search Packagist + add a plugin to the registry |
| `make registry-plugins-fetch` | Pull default `config.php` from each plugin's GitHub repo |

#### `make db` sub-targets (hidden)

| Command                          | Description                                    |
| -------------------------------- | ---------------------------------------------- |
| `make db-pull`                   | Pull from Servd (Servd hosting only — hidden from picker when not installed) |
| `make db-export [file=path]`     | Export local DB (default: `db.sql.gz`)        |
| `make db-import [file=path]`     | Import a SQL dump (default: `db.sql.gz`)      |

The `db-export` picker asks whether it's a disposable working dump (`.sql.gz`, git-ignored) or a seed DB (`.sql.gzip`, committed) and sets the extension accordingly.

### Destructive (asks for confirmation)

| Command                    | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `make reset`               | Wipe the database + `.env` (keeps vendor/node_modules)     |
| `make nuke`                | Destroy DDEV + vendor + node_modules + dist + config/project + .env |

## After `make create`

Most project configuration is handled automatically. A few things are still manual because they depend on assets you provide:

- [ ] Replace brand colors in `src/css/global.css`
- [ ] Add project fonts to `src/fonts/` and update `global.css`
- [ ] Update font preloads in `templates/_layouts/base-fonts.twig`
- [ ] Add your favicon to `src/img/favicon.svg` and run `make favicons`
- [ ] Optionally set `FAVICON_THEME_COLOR` and `FAVICON_BG_COLOR` in `.env` before running
- [ ] Create `main` / `footer` navigation handles in the CP (Navigation plugin)
- [ ] Update email template branding in `templates/_emails/system.twig`
- [ ] If critical CSS is enabled, configure which pages to generate it for in `vite.config.mjs` (default: home + about)

## Project structure

```
craft-starter/
├── cli/                   Interactive installer (Node ESM)
│   ├── setup.mjs          Orchestrator for `make create`
│   ├── config/            Static data (plugin registry, languages)
│   ├── prompts/           @clack/prompts + @inquirer/search flows
│   ├── actions/           File mutations (composer, env, ddev, critical, plugins, sites)
│   ├── utils/             Shared helpers (run, crypto, cancel, validate, preflight)
│   ├── scripts/           Standalone scripts (PHP via DDEV, Node on host):
│   │                      configure-project.php, generate-favicons.mjs,
│   │                      add-plugin.mjs, check-plugin-versions.mjs,
│   │                      fetch-plugin-configs.mjs, update.mjs, registry.mjs, db.mjs
│   └── templates/         Source files copied/read by the CLI
│       ├── env.example    The .env template
│       ├── plugins/       Per-plugin config.php templates
│       ├── translations/  Translation scaffold (copied per site/locale)
│       ├── rebrand/       CP rebrand assets (login logo + site icon)
│       └── critical/      Canonical critical-CSS variants (enabled/disabled
│                          partials + Apple Silicon config.m1.yaml) — used for
│                          round-trip correctness if a project commits a
│                          declined state and later flips back
├── config/
│   ├── app.php            Only the `cache` component override
│   ├── general.php        Project-wide constants (no env-overridable settings — use CRAFT_* in .env)
│   ├── project/           Craft's project config (auto-generated)
│   └── vite.php           nystudio107/craft-vite config
├── src/                   Frontend: css, js, brand, cp, fonts, icons, img
├── templates/             Twig templates (_boilerplate → base → pages)
├── translations/          Per-locale site translations (scaffolded per site)
├── web/                   Public web root (index.php)
├── Makefile               DX entry point
└── DEPLOYMENT.md          Per-environment config reference
```

## Stack

- **[Craft CMS 5.9+](https://craftcms.com)** — Content management system
- **[DDEV](https://ddev.com)** — Local development environment (nginx-fpm, PHP 8.3, MySQL 8.0)
- **[Vite 8](https://vitejs.dev)** — Rolldown-powered frontend build tool with HMR
- **[Tailwind CSS 4](https://tailwindcss.com)** — Utility-first CSS (CSS-first, no config file)
- **[Alpine.js 3](https://alpinejs.dev)** — Reactive UI
- **[TypeScript](https://www.typescriptlang.org)** — Type-safe JavaScript
- **[@clack/prompts](https://github.com/bombshell-dev/clack)** + **[@inquirer/search](https://github.com/SBoudrias/Inquirer.js)** — CLI UI

## Plugins

### LindemannRock (opt-in during `make create`)

| Plugin | Purpose |
|--------|---------|
| [Code Highlighter](https://github.com/LindemannRock/craft-code-highlighter) | Syntax highlighting (Prism.js) |
| [Component Manager](https://github.com/LindemannRock/craft-component-manager) | Advanced component management |
| [Formie Paragraph](https://github.com/LindemannRock/craft-formie-paragraph-field) | Multi-line paragraph field for Formie |
| [Formie Rating](https://github.com/LindemannRock/craft-formie-rating-field) | Star/emoji/numeric rating for Formie |
| [Formie REST API](https://github.com/LindemannRock/craft-formie-rest-api) | REST + GraphQL API for Formie |
| [Formie SAP Integration](https://github.com/LindemannRock/craft-formie-sap-integration) | Send Formie submissions to SAP Cloud |
| [Formie SMS](https://github.com/LindemannRock/craft-formie-sms) | SMS notifications for Formie (auto-adds SMS Manager) |
| [Icon Manager](https://github.com/LindemannRock/craft-icon-manager) | SVG + icon font management (auto-adds `svgo` devDependency for advanced SVG optimization) |
| [Logging Library](https://github.com/LindemannRock/craft-logging-library) | Centralized logging |
| [Redirect Manager](https://github.com/LindemannRock/craft-redirect-manager) | Auto-redirects + privacy-preserving analytics |
| [Report Manager](https://github.com/LindemannRock/craft-report-manager) | Report generation + analytics |
| [Search Manager](https://github.com/LindemannRock/craft-search-manager) | Search analytics + synonyms |
| [Shortlink Manager](https://github.com/LindemannRock/craft-shortlink-manager) | Short links with QR codes + analytics |
| [Smartlink Manager](https://github.com/LindemannRock/craft-smartlink-manager) | Device-aware smart links |
| [SMS Manager](https://github.com/LindemannRock/craft-sms-manager) | SMS gateway (multi-provider) |
| [Translation Manager](https://github.com/LindemannRock/craft-translation-manager) | Translation management (prompts for category name, default `messages`) |

### Third-party (opt-in during `make create`)

| Plugin | Purpose |
|--------|---------|
| [SEOmatic](https://nystudio107.com/plugins/seomatic) | SEO management |
| [Formie](https://verbb.io/craft-plugins/formie) | Form builder (auto-added when any Formie addon is selected) |
| [Navigation](https://verbb.io/craft-plugins/navigation) | Navigation management |
| [Expanded Singles](https://github.com/verbb/expanded-singles) | Singles as direct sidebar links |
| [Imager X](https://plugins.craftcms.com/imager-x) | Image transforms |
| [Postmark](https://github.com/craftcms/postmark) | Email transport |
| [Sprig](https://putyourlightson.com/plugins/sprig) | Reactive Twig components |
| [Scout](https://plugins.craftcms.com/scout) | Search indexing (Algolia, Elasticsearch, etc.) |
| [Cloudflare](https://putyourlightson.com/plugins/cloudflare) | Purge Cloudflare cache from Craft |
| [CP Clear Cache](https://plugins.craftcms.com/cp-clearcache) | Clear cache from CP toolbar |

> Updating the list: run `make registry` → _Update versions_ to pull latest from Packagist (major bumps prompt for confirmation). Add new plugins with `make registry` → _Add a plugin_.

### Hosting

| Provider | What gets installed |
|----------|---------------------|
| **Servd** | `servd/craft-asset-storage` + credentials prompt + optional custom asset domains + email transport fallback |
| **Craft Cloud** | `craftcms/cloud` + `craft-cloud.yaml` generated (PHP 8.3, Node 22, `npm run build`) |
| **None / self-hosted** | No hosting plugin added |

### Always included (core)

- `craftcms/cms` · `craftcms/ckeditor` · `nystudio107/craft-vite` · `vlucas/phpdotenv`
- Dev: `craftcms/generator` · `yiisoft/yii2-shell`

## Template hierarchy

```
global-variables.twig          → Site-wide variables
  └─ base-web-layout.twig      → HTML document shell
      └─ base-html-layout.twig → Head/body structure with blocks
          └─ base.twig          → Header + content + footer
              └─ entry/*/...    → Page-specific templates
```

Entry routing is handled by `_routerEntries.twig`, which resolves the most specific template first:

1. `entry/{sectionHandle}/{typeHandle}.twig` — specific
2. `entry/{sectionHandle}/default.twig` — fallback

## Environment variables

The CLI generates `.env` from `cli/templates/env.example` on every run. For local changes, edit `.env` directly. For staging/production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).

Craft's built-in settings use `CRAFT_*` env vars (`CRAFT_DEV_MODE`, `CRAFT_TIMEZONE`, `CRAFT_CP_TRIGGER`, `CRAFT_IS_SYSTEM_LIVE`, etc.) which Craft auto-reads into `GeneralConfig`. Project config values use `SYSTEM_*` env vars (`SYSTEM_NAME`, `SYSTEM_EMAIL`, etc.) referenced as `$VAR` in YAML. We don't re-read `CRAFT_*` vars in `general.php` — **one source of truth per setting**.

## What `make create` does differently based on your choices

The installer tailors the project to your selections so you don't end up with dead dependencies or unused config. Noteworthy conditional behaviors:

### Critical CSS

- **Opted in** → `rollup-plugin-critical` kept in `package.json`, ~20 Chromium apt packages added to `.ddev/config.yaml`, `.ddev/config.m1.yaml` present (native Chromium on Apple Silicon), full `critical-css.twig` partial with Nginx SSI + cookie logic, `GENERATE_CRITICAL_CSS=true` in `.env`, `make critical` works
- **Declined** → all of the above stripped. `make prod` is the fast path; `make critical` refuses with a clear re-enable message
- **Flip-flopping** (re-running `make create` and changing your mind) is idempotent in both directions. The canonical "full" + "disabled" variants live under `cli/templates/critical/`, so opt-in works even if a project previously committed a declined state

### Sites (multi-site)

- Prompts for how many sites, then per-site: handle, language, URL prefix, display name, label
- Sites are created via Craft's project-config API (`projectConfig->set()`) — not via YAML patching — with env-var references for `name` and `baseUrl`
- Translation files are scaffolded per locale under `translations/{lang}/` from `cli/templates/translations/`
- Language switcher markup renders as a toggle button for 2 sites, Alpine.js dropdown for 3+
- RTL detection is language-based (`ar`, `he`, `fa`, `ur`) — no hardcoded `isArabic` checks

### Translation Manager (LR plugin)

- Prompts for a **translation category** (default `messages`). Patches `config/translation-manager.php` and rewrites `templates/_layouts/global-variables.twig` so `{% set primaryTranslationCategory = '...' %}` uses your chosen value
- Sets `sourceLanguage` in the plugin config to your primary site's language
- AI API keys (OpenAI, Gemini, Anthropic) read via `App::env()` — kept out of hard-coded config

### Redis

- **Cache enabled** → `ddev/ddev-redis` addon installed before `ddev start`, `yiisoft/yii2-redis` added to composer, Redis env vars kept in `.env`, cache component uses Redis DB 0
- **Sessions enabled** (sub-prompt, only shown when cache is on) → `REDIS_SESSION_DB=1` added to `.env`, session component switches to `yii\redis\Session` with its own Redis DB
- **Disabled** → Craft's default file-based cache + DB-backed sessions, Redis env vars stripped from `.env`
- **Servd note:** Servd auto-configures Redis for cache + sessions at deploy time, overriding your `app.php`. Your local config is for DDEV / self-hosted / Craft Cloud only
- **DB allocation:** DB 0 = cache, DB 1 = sessions. Plugins (e.g. Search Manager) manage their own DB indices

### Hosting

- **Servd** → `servd/craft-asset-storage` installed, credentials + base URL prompted (or scaffolded as `# TODO:` placeholders if you don't have them yet — run `make verify` before deploy), optional custom CDN/image-transform domains, `SERVD_BASE_URL` auto-derived from project slug. Servd sub-prompt also offers Postmark/SMTP as email fallback
- **Craft Cloud** → `craftcms/cloud` installed, `craft-cloud.yaml` generated (PHP 8.3, Node 22, `npm run build`), `CRAFT_RUN_QUEUE_AUTOMATICALLY=false` (Cloud runs its own workers)
- **None / self-hosted** → no hosting plugin, Servd section removed from `.env`

### Email transport

Configured in project config at install time via `cli/scripts/configure-project.php`, picked in this order:

1. **Postmark** if `POSTMARK_TOKEN` set + plugin installed
2. **Generic SMTP** if `SMTP_HOSTNAME` set
3. **Mailpit** (DDEV local) as dev default
4. **Sendmail** as Craft's fallback

No `mailer` component override in `config/app.php` — single source of truth in project config means the CP shows the right value and Servd's sendmail alert never fires.

### Auto-added plugin dependencies

- Any **Formie addon** (e.g. Formie SMS) → Formie itself is auto-added
- **Formie SMS** → SMS Manager is auto-added
- Auto-added plugins are labelled `(req. by X)` in the confirmation summary

## Testing

The CLI ships with unit tests for its pure utility functions — no DDEV or Craft install needed.

```bash
make test              # single run (41 tests, ~200ms)
cd cli && npx vitest   # watch mode (re-runs on save)
```

Tests cover: `setEnvKey` (including `$`-pattern safety), `shellEscape`, `isValidEmail`, `quoted`, `removeSection`, `redactSecrets`, and all crypto generators. Located in `cli/tests/`.

When contributing changes to `cli/utils/` or `cli/actions/`, run `make test` before pushing.

## Device testing (Tailscale)

Test your dev site on real phones and tablets via [Tailscale](https://tailscale.com) — optional, only needed if you use `make share` / `make funnel`.

### Install Tailscale

Two options on macOS. Pick one:

**1. App cask (recommended — GUI + auto-start)**

```bash
brew install --cask tailscale-app
```

Launch Tailscale from Applications, sign in via the menubar icon. Daemon runs automatically on login, reconnects after sleep.

**2. CLI only (headless / servers / if you prefer)**

```bash
brew install tailscale                  # CLI + daemon
sudo brew services start tailscale      # daemon doesn't auto-start with this install
sudo tailscale up                       # sign in (follow the URL it prints)
```

### Two modes

- **`make share`** — serves the site over your private Tailnet. The test device also needs Tailscale installed and signed into the same account. Fastest + most private.
- **`make funnel`** — serves the site publicly via [Tailscale Funnel](https://tailscale.com/kb/1223/funnel). Any device can hit the URL without Tailscale. Requires Funnel enabled for your tailnet (see Tailscale admin console).

### First-run gotchas

- **"Serve is not enabled on your tailnet"** — Tailscale prints a URL the first time you run `make share`. Visit it to enable Serve for your tailnet, then re-run the command. One-time setup.
- **Funnel needs explicit enabling** too, per-machine, in the [Tailscale admin console](https://login.tailscale.com/admin/acls) under ACLs.

Both commands register a temporary `.ddev/config.tailscale.yaml` (gitignored), expose the Vite dev server on port 8443 so HMR works on the test device, and clean up when you hit Ctrl+C.

Run the command in one terminal and `make dev` in another.

## Versioning & releases (release-please)

The starter ships with a [release-please](https://github.com/googleapis/release-please) GitHub Action at `.github/workflows/release-please.yml`. On every push to `main` it:

1. Reads your [conventional commits](https://www.conventionalcommits.org) since the last tag (`feat:` → minor bump, `fix:` → patch, `feat!:` or `BREAKING CHANGE:` → major)
2. Opens or updates a PR titled `chore(main): release X.Y.Z` with the computed version + changelog
3. Merging that PR tags the commit (`vX.Y.Z`), publishes a GitHub Release, and writes/updates `CHANGELOG.md`

### Setup after forking

1. **Enable Actions on the fork.** When you fork a repo with workflow files, GitHub disables them by default. Go to the Actions tab → click _"I understand my workflows, go ahead and enable them"_.

2. **Check workflow permissions.** Settings → Actions → General → Workflow permissions:
   - Select **"Read and write permissions"**
   - Check **"Allow GitHub Actions to create and approve pull requests"**

   These two settings let release-please open PRs and write tags/releases using the built-in `GITHUB_TOKEN` — **no personal access token needed**.

3. **Bootstrap your initial version** by committing with the `Release-As:` trailer:
   ```bash
   git commit --allow-empty -m "chore: bootstrap release-please" -m "Release-As: 1.0.0"
   git push
   ```
   This forces the next release PR to the version you specify, regardless of what the commit types would have produced. Use whenever you want to jump versions (e.g. `5.0.0` for a Craft-5-aligned starter).

### Writing commits that produce good changelogs

| Commit prefix | Bump | Example |
|---------------|------|---------|
| `feat:` | minor | `feat(cli): add critical CSS opt-in prompt` |
| `fix:` | patch | `fix(Makefile): tailscale targets don't propagate exit codes` |
| `feat!:` / `BREAKING CHANGE:` in body | major | `feat!: drop PHP 8.2 support` |
| `chore:` / `docs:` / `refactor:` / `test:` | none | (no release, shows in changelog under "Other" if scoped) |

Scopes (`feat(cli):`, `fix(Makefile):`) group related changes in the generated CHANGELOG and make release notes easier to scan. The starter's own history is a live example — see [commit log](https://github.com/LindemannRock/craft-starter/commits/main).

### Advanced: chaining workflows off releases

GitHub intentionally blocks workflows triggered by `GITHUB_TOKEN` from firing other workflows (prevents infinite loops). If you have a `deploy.yml` that runs on `on: release: published` and you want it to fire when release-please publishes a release, use a personal access token:

1. Create a fine-grained PAT with `contents: write` + `pull-requests: write` on your repo
2. Save it as a repo secret named `RELEASE_TOKEN`
3. Add `token: ${{ secrets.RELEASE_TOKEN }}` back to the release-please step

Without a PAT, releases are still tagged and published — they just won't trigger other workflows.

## Support

- **Issues**: [GitHub Issues](https://github.com/LindemannRock/craft-starter/issues)
- **Email**: [support@lindemannrock.com](mailto:support@lindemannrock.com)

## License

MIT © [LindemannRock](https://lindemannrock.com). See [LICENSE.md](LICENSE.md) for the full text — use it, fork it, ship it.

---

Developed by [LindemannRock](https://lindemannrock.com)
