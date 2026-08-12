# Deployment

This starter is configured for **local development with DDEV**. For staging and production, set environment variables through your hosting provider's dashboard (Servd, Craft Cloud, Vercel, etc.) rather than committing a `.env` file.

## Before first deploy

- [ ] Run `make verify` — scans `.env` for unfilled `# TODO:` placeholders (e.g. Servd credentials you skipped during `make create`)
- [ ] Commit `composer.lock` + `package-lock.json` — the CLI un-gitignores them during `make create` for reproducible installs. Craft Cloud and most CI pipelines require them
- [ ] Run `make prod` (or `make critical` if critical CSS is enabled) — builds frontend assets to `web/dist/`
- [ ] Verify `storage/rebrand/` is committed — contains CP login branding (logo + site icon)

## Required environment variables

These must be set for any non-local environment. Missing values will crash Craft on boot.

| Variable | Description |
|----------|-------------|
| `CRAFT_APP_ID` | Unique Craft app ID — generate with `php craft setup/app-id` |
| `CRAFT_SECURITY_KEY` | Craft security key — generate with `php craft setup/security-key` |
| `CRAFT_ENVIRONMENT` | `staging` or `production` |
| `CRAFT_DB_SERVER` | Database host |
| `CRAFT_DB_DATABASE` | Database name |
| `CRAFT_DB_USER` | Database user |
| `CRAFT_DB_PASSWORD` | Database password |
| `PRIMARY_SITE_URL` | Public site URL (e.g. `https://example.com`) |
| `SYSTEM_EMAIL` | Outgoing email address |
| `SYSTEM_NAME` | Site name shown in emails and CP |

### Multi-site projects

For each site beyond the primary, set per-site env vars matching the handles chosen during `make create`:

```
PRIMARY_SITE_URL_EN=https://example.com/
PRIMARY_SITE_NAME_EN="My Site"
PRIMARY_SITE_LABEL_EN="English"

PRIMARY_SITE_URL_AR=https://example.com/ar/
PRIMARY_SITE_NAME_AR="موقعي"
PRIMARY_SITE_LABEL_AR="العربية"
```

The handle is uppercased (`en` → `_EN`). These are referenced by Craft's project config as `$PRIMARY_SITE_URL_EN` etc.

## Values that change per environment

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| `CRAFT_ENVIRONMENT` | `dev` | `staging` | `production` |
| `CRAFT_DEV_MODE` | `true` | `false` | `false` |
| `CRAFT_ALLOW_ADMIN_CHANGES` | `true` | `false` | `false` |
| `CRAFT_ALLOW_UPDATES` | `true` | `false` | `false` |
| `CRAFT_DISALLOW_ROBOTS` | `true` | `true` | `false` |
| `CRAFT_IS_SYSTEM_LIVE` | `true` | `true` | `true` |
| `CRAFT_RUN_QUEUE_AUTOMATICALLY` | `true` | `false` (Servd/Cloud) | `false` (Servd/Cloud) |
| `CRAFT_TIMEZONE` | `UTC` or other | same | same |
| `PRIMARY_SITE_URL` | `https://{project}.ddev.site` | staging URL | production URL |

## Security headers

The starter ships sensible default security headers in `config/app.web.php` via Craft's `headersFilter`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `Permissions-Policy` (locked-down feature defaults)

Edit `config/app.web.php` to extend or override per-project. CORS and CSP are left as commented examples — opt in if your project needs them.

These are set at the application layer (in source control), not at the CDN. Hosting-specific headers (caching, HSTS) still live with your host.

### Further reading

- [MDN: Security headers reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers) — authoritative syntax + browser support per header
- [Permissions-Policy feature directives](https://github.com/w3c/webappsec-permissions-policy/blob/main/features.md) — full list of `feature=()` keys
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/) — recommended values + threat models
- [securityheaders.com](https://securityheaders.com) — paste your URL, get a graded report
- [Mozilla Observatory](https://observatory.mozilla.org) — broader security report
- [csp-evaluator.withgoogle.com](https://csp-evaluator.withgoogle.com) — when you eventually add CSP

## Email

Email transport is configured in project config during `make create`. The PHP script (`cli/scripts/configure-project.php`) picks a transport based on which env vars are set, in this order:

1. **Postmark** — if `POSTMARK_TOKEN` is set and the `craftcms/postmark` plugin is installed
2. **Generic SMTP** — if `SMTP_HOSTNAME` is set (e.g. Servd SMTP, Mailgun)
3. **Mailpit** — if `MAILPIT_SMTP_HOSTNAME` is set (DDEV local dev only)
4. **Sendmail** — Craft default

### Postmark

```
POSTMARK_TOKEN=your-server-api-token
```

### SMTP (Servd SMTP / Mailgun / other)

```
SMTP_HOSTNAME=smtp.example.com
SMTP_PORT=587
SMTP_USE_AUTH=true
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
```

## Caching & sessions

`config/app.php` configures Redis for cache and sessions, gated by env vars. If the env vars are absent, Craft falls back to file-based cache and DB-backed sessions.

### Redis (when enabled during `make create`)

```
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DATABASE=0
REDIS_SESSION_DB=1          # only if you opted into Redis sessions
```

**DB allocation:** DB 0 = cache, DB 1 = sessions. Plugins (e.g. Search Manager) manage their own indices.

**Servd note:** Servd auto-configures Redis for cache + sessions at deploy time, overriding your `app.php`. You do not need to set `REDIS_*` vars in the Servd dashboard.

## Servd hosting

If deploying to [Servd](https://servd.host), set these in the Servd project dashboard (not in a `.env` file):

```
SERVD_PROJECT_SLUG=your-project-slug
SERVD_SECURITY_KEY=your-security-key
SERVD_BASE_URL=https://your-project-slug.files.svdcdn.com
SERVD_ASSETS_ENVIRONMENT=staging   # or production
CRAFT_RUN_QUEUE_AUTOMATICALLY=false
```

If you configured custom asset domains during `make create`:

```
SERVD_CDN_URL_PATTERN='https://media.example.com/{{environment}}/{{subfolder}}/{{filePath}}'
SERVD_IMAGE_TRANSFORM_URL_PATTERN='https://images.example.com/{{environment}}/{{subfolder}}/{{filePath}}{{params}}'
```

### Servd build step

Servd can run a Node build step during deployment. In your Servd project settings → Build:

- **Command:** `npm run build`
- **Node version:** `22`

If you build locally and commit `web/dist/` instead, leave the command empty.

### Servd and Redis

Servd provides Redis automatically — no setup needed. Cache, sessions, and queue are all handled by Servd's infrastructure, overriding your `app.php` at deploy time.

## Craft Cloud

If deploying to [Craft Cloud](https://craftcms.com/cloud), the CLI generates a `craft-cloud.yaml` in the project root during `make create`. Commit it to your repo.

Cloud auto-configures database, cache, queue, and session — you don't need to set `CRAFT_DB_*`, `REDIS_*`, or `CRAFT_RUN_QUEUE_AUTOMATICALLY` in the Cloud dashboard. Set these instead:

```
CRAFT_ENVIRONMENT=production
CRAFT_DEV_MODE=false
CRAFT_ALLOW_ADMIN_CHANGES=false
CRAFT_ALLOW_UPDATES=false
CRAFT_DISALLOW_ROBOTS=false
CRAFT_IS_SYSTEM_LIVE=true
PRIMARY_SITE_URL=https://example.com
SYSTEM_EMAIL=no-reply@example.com
SYSTEM_SENDER_NAME="Your Site"
```

The `npm run build` step runs automatically during Cloud deployments (configured in `craft-cloud.yaml`). Keep `web/dist/` ignored: Cloud uploads the generated files to its artifact CDN, and the Vite configuration resolves the manifest and asset URLs from that CDN at runtime.

## LindemannRock plugins

Plugins that hash IP addresses for privacy-preserving analytics need a salt per environment. **Use the same salt across all environments** so that anonymised IP data remains consistent when promoted between stages:

```
REDIRECT_MANAGER_IP_SALT="<64-char hex string>"
SHORTLINK_MANAGER_IP_SALT="<64-char hex string>"
SMARTLINK_MANAGER_IP_SALT="<64-char hex string>"
SEARCH_MANAGER_IP_SALT="<64-char hex string>"
```

The CLI auto-generates these for local dev in `.env`. Copy the same values into your hosting provider's environment config for staging/production.

## GitHub Actions / CI

For build pipelines that need `npm run build` to run, set:

```
CRAFT_APP_ID=...
CRAFT_SECURITY_KEY=...
PRIMARY_SITE_URL=https://example.com
```

at minimum. The build only needs Craft to boot enough to resolve asset URLs.

## Troubleshooting

### "cookieValidationKey must be configured with a secret key"

`CRAFT_SECURITY_KEY` is empty. Set it via the hosting dashboard.

### "Sending email over sendmail is disabled on Servd"

Servd doesn't support Sendmail. Set either `POSTMARK_TOKEN` (install the Postmark plugin) or `SMTP_HOSTNAME` with SMTP credentials.

### Redis connection refused

The `yiisoft/yii2-redis` package is installed but `REDIS_HOST` isn't set (or can't connect). Cache and session components in `app.php` are env-var-gated — if `REDIS_HOST` is absent, they fall back to file cache and DB sessions automatically. If you're seeing this error, check that `REDIS_HOST` is set correctly in your hosting dashboard.

**Servd users:** you should NOT see this error — Servd auto-configures Redis. If you do, contact Servd support.

### Unfilled placeholders in .env

Run `make verify` to scan for `# TODO:` markers left by the CLI when you skipped Servd credentials during `make create`. Fill them in before deploying.

### Lock files missing (Craft Cloud)

Craft Cloud requires `composer.lock` and `package-lock.json` to be committed. The CLI automatically un-gitignores them during `make create`. If your deploy fails with "composer.lock not found", verify they're tracked:

```bash
git ls-files composer.lock package-lock.json
```

If empty, the lock files were gitignored. Remove them from `.gitignore` and commit:

```bash
git add composer.lock package-lock.json
git commit -m "chore: commit lock files for deploy"
```
