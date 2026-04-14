# Craft CMS Starter by LindemannRock

[![Craft CMS](https://img.shields.io/badge/Craft%20CMS-5.9%2B-orange.svg)](https://craftcms.com/)
[![PHP](https://img.shields.io/badge/PHP-8.3%2B-blue.svg)](https://php.net/)
[![Node](https://img.shields.io/badge/Node-22%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

An opinionated, interactive Craft CMS 5 starter. Run `make create`, answer a few questions, and end up with a configured DDEV project — Tailwind CSS 4, TypeScript, Alpine.js, the plugins you need, and hosting wired up — all installed and ready to develop.

## Features

- **Interactive installer** — `make create` walks you through project name, timezone, language, admin credentials, plugin selection, and hosting with a modern TUI (review loop + per-section editing if you change your mind)
- **Auto-generated credentials** — Craft security key, app ID, and LR plugin IP salts generated locally, never committed
- **Multi-hosting ready** — Servd, Craft Cloud, or self-hosted with plugin-level conditionals
- **Email transport configured automatically** — Postmark, SMTP (Servd SMTP, Mailgun, etc.), or Mailpit as a safe dev default; written to project config so the CP shows the right value and Servd's sendmail alert never fires
- **Redis opt-in** — adds `ddev/ddev-redis` addon + `yii2-redis` package + `cache` component override in one choice
- **Multi-site support** — 1 to N sites with per-site language, URL prefix, and RTL detection. Favicon generation with per-site web manifests
- **Vite 7 build pipeline** — single `web/dist/` output, Subresource Integrity (SRI), gzip compression, critical CSS with Nginx SSI, and page-specific asset splitting. For per-environment runtime config (Algolia keys, Mapbox tokens, etc.) inject from Twig into `window.__APP_CONFIG__` — do **not** rely on `import.meta.env.VITE_*` baking values into the bundle.
- **TypeScript-first frontend** — Alpine.js session/UTM store, lazy-loaded Swiper + mmenu + Alpine plugins
- **Tailwind CSS 4 (CSS-first)** — no `tailwind.config.*` file, theme in `src/css/global.css` via `@theme`
- **Template hierarchy** — `_boilerplate → base-web → base-html → base → header/footer` with an entry router pattern (`_routerEntries.twig`)
- **release-please** automated versioning via conventional commits
- **Prettier + Twig formatting** with the same config used across LR client projects

## Requirements

- [Docker](https://www.docker.com)
- [DDEV](https://ddev.com) 1.25+
- Node 22+ and npm 10+ (for running the CLI outside DDEV — DDEV provides Node internally for the project itself)

### Optional

- [Tailscale](https://tailscale.com) — only if you want `make share` / `make funnel` for device testing. Free for personal use. Install with `brew install tailscale` on macOS or see [their docs](https://tailscale.com/download) for other platforms.

> The `make create` installer checks that Docker, DDEV, and Node are present before running. If any are missing you'll get a clean error with install links.

## Quick Start

```bash
git clone git@github.com:LindemannRock/craft-starter.git my-project
cd my-project
make create
```

`make create` will:

1. Prompt you for project details, plugins, hosting, and email transport
2. Let you review the full configuration and jump back to edit any section
3. Write `composer.json`, `package.json`, `.ddev/config.yaml`, and `.env`
4. Start DDEV (plus the Redis add-on if enabled)
5. Run Composer + NPM installs
6. Install Craft CMS with your credentials (non-interactive)
7. Activate all selected plugins
8. Apply project config and persist your email transport choice

When it finishes you'll see the site URL, CP URL, and login. Run `make dev` to start the Vite dev server.

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
| `make prod`                |        | Production build                                  |
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

| Command                 | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `make up`               | Apply project config + run pending migrations              |
| `make update`           | Run `craft update all` (Craft + plugins via Craft updater) |
| `make update-composer`  | Update Composer packages to latest matching versions       |
| `make update-npm`       | Update NPM packages (interactive via `npm-check`)          |
| `make update-cli`       | Update CLI packages in `cli/` (interactive)                |
| `make check-plugins`    | Check plugin registry versions against Packagist           |
| `make update-plugins`   | Interactively update plugin registry versions              |
| `make add-plugin`       | Add a new plugin to the registry (searches Packagist)      |
| `make fetch-configs`    | Fetch default `config.php` for registered plugins          |
| `make clean`            | Remove vendor & node_modules then reinstall                |
| `make clean-logs`       | Remove `storage/logs/*.log`                                |
| `make export-db`        | Export local DB to `db.sql.gz` (or `file=path/to/out.sql.gz`) |
| `make import-db`        | Import `db.sql.gz` (or `file=path/to/dump.sql.gz`)         |
| `make pull-db`          | Pull database from Servd (Servd hosting only)              |
| `make reindex-search`   | Rebuild the search index                                   |

### Destructive (asks for confirmation)

| Command                    | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `make reset`               | Wipe the database + `.env` (keeps vendor/node_modules)     |
| `make nuke`                | Destroy DDEV + vendor + node_modules + dist + config/project + .env |

## Project structure

```
craft-starter/
├── cli/                   Interactive installer (Node ESM)
│   ├── setup.mjs          Orchestrator
│   ├── config/            Static data (plugin registry, languages)
│   ├── prompts/           @clack/prompts + @inquirer/search flows
│   ├── actions/           File mutations (composer, env, ddev, etc.)
│   ├── utils/             Shared helpers (run, crypto, cancel, validate)
│   ├── scripts/           Standalone PHP scripts run inside DDEV
│   └── templates/         Source files copied/read by the CLI
│       ├── env.example    The .env template
│       └── plugins/       Per-plugin config.php templates
├── config/
│   ├── app.php            Only the `cache` component override
│   ├── general.php        Project-wide constants (no env-overridable settings — use CRAFT_* in .env)
│   ├── project/           Craft's project config (auto-generated)
│   └── vite.php           nystudio107/craft-vite config
├── src/                   Frontend: css, js, brand, cp, fonts, icons, img
├── templates/             Twig templates (_boilerplate → base → pages)
├── translations/          Per-locale site translations (en, ar)
├── web/                   Public web root (index.php)
├── Makefile               DX entry point
└── DEPLOYMENT.md          Per-environment config reference
```

## Stack

- **[Craft CMS 5.9+](https://craftcms.com)** — Content management system
- **[DDEV](https://ddev.com)** — Local development environment (nginx-fpm, PHP 8.3, MySQL 8.0)
- **[Vite 7](https://vitejs.dev)** — Frontend build tool with HMR
- **[Tailwind CSS 4](https://tailwindcss.com)** — Utility-first CSS (CSS-first, no config file)
- **[Alpine.js 3](https://alpinejs.dev)** — Reactive UI
- **[TypeScript](https://www.typescriptlang.org)** — Type-safe JavaScript
- **[@clack/prompts](https://github.com/bombshell-dev/clack)** + **[@inquirer/search](https://github.com/SBoudrias/Inquirer.js)** — CLI UI

## Plugins

### LindemannRock (opt-in during `make create`)

| Plugin | Purpose |
|--------|---------|
| [Redirect Manager](https://github.com/LindemannRock/craft-redirect-manager) | Auto-redirects + privacy-preserving analytics |
| [Shortlink Manager](https://github.com/LindemannRock/craft-shortlink-manager) | Short links with QR codes + analytics |
| [Smartlink Manager](https://github.com/LindemannRock/craft-smartlink-manager) | Device-aware smart links |
| [Search Manager](https://github.com/LindemannRock/craft-search-manager) | Multi-backend search with BM25 ranking |
| [Translation Manager](https://github.com/LindemannRock/craft-translation-manager) | Translation management |
| [Logging Library](https://github.com/LindemannRock/craft-logging-library) | Centralized logging |

### Third-party (opt-in during `make create`)

| Plugin | Purpose |
|--------|---------|
| [SEOmatic](https://nystudio107.com/plugins/seomatic) | SEO management |
| [Formie](https://verbb.io/craft-plugins/formie) | Form builder |
| [Navigation](https://verbb.io/craft-plugins/navigation) | Navigation management |
| [Expanded Singles](https://github.com/verbb/expanded-singles) | Singles as direct sidebar links |
| [Imager X](https://plugins.craftcms.com/imager-x) | Image transforms |
| [Postmark](https://github.com/craftcms/postmark) | Email transport |
| [Sprig](https://putyourlightson.com/plugins/sprig) | Reactive Twig components |
| [CP CSS](https://plugins.craftcms.com/cpcss) · [CP JS](https://plugins.craftcms.com/cpjs) · [CP Clear Cache](https://plugins.craftcms.com/cp-clearcache) | Control panel niceties |

### Hosting

| Provider | What gets installed |
|----------|---------------------|
| **Servd** | `servd/craft-asset-storage` + credentials prompt + optional custom asset domains + email transport fallback |
| **Craft Cloud** | `craftcms/cloud` + `craft-cloud.yaml` generated (PHP 8.3, Node 22, `npm run build`) |
| **None / self-hosted** | No hosting plugin added |

### Always included (core)

- `craftcms/cms` · `craftcms/ckeditor` · `nystudio107/craft-vite` · `vlucas/phpdotenv`
- Dev: `craftcms/generator` · `yiisoft/yii2-shell`

## Device testing

Test your dev site on real phones and tablets via [Tailscale](https://tailscale.com) — optional, only needed if you use `make share` / `make funnel`.

**Prerequisites:** install Tailscale and sign in on your dev machine first.

```bash
brew install tailscale         # macOS
sudo tailscale up              # sign in (follow the URL it prints)
```

Then you have two modes:

- **`make share`** — serves the site over your private Tailnet. The test device also needs Tailscale installed and signed into the same account. Fastest + most private.
- **`make funnel`** — serves the site publicly via [Tailscale Funnel](https://tailscale.com/kb/1223/funnel). Any device can hit the URL without Tailscale. Requires Funnel enabled for your tailnet (see Tailscale admin console).

Both commands register a temporary `.ddev/config.tailscale.yaml` (gitignored), expose the Vite dev server on port 8443 so HMR works on the test device, and clean up when you hit Ctrl+C.

Run the command in one terminal and `make dev` in another.

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

## After `make create`

Most project configuration is handled automatically. A few things are still manual because they depend on assets you provide:

- [ ] Replace brand colors in `src/css/global.css`
- [ ] Add project fonts to `src/fonts/` and update `global.css`
- [ ] Update font preloads in `templates/_layouts/base-fonts.twig`
- [ ] Add your favicon to `src/img/favicon.svg` and run `make favicons`
- [ ] Optionally set `FAVICON_THEME_COLOR` and `FAVICON_BG_COLOR` in `.env` before running
- [ ] Create `main` / `footer` navigation handles in the CP (Navigation plugin)
- [ ] Update email template branding in `templates/_emails/system.twig`
- [ ] Configure critical CSS pages in `vite.config.mjs`

## Support

- **Issues**: [GitHub Issues](https://github.com/LindemannRock/craft-starter/issues)
- **Email**: [support@lindemannrock.com](mailto:support@lindemannrock.com)

## License

MIT © [LindemannRock](https://lindemannrock.com). See [LICENSE.md](LICENSE.md) for the full text — use it, fork it, ship it.

---

Developed by [LindemannRock](https://lindemannrock.com)
