# Deployment

This starter is configured for **local development with DDEV**. For staging and production, set environment variables through your hosting provider's dashboard (Servd, Craft Cloud, Vercel, etc.) rather than committing a `.env` file.

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

## Caching

If Redis was enabled during setup, set these for staging/production:

```
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DATABASE=0
```

Without Redis, Craft falls back to its default file-based cache — no config needed.

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

The `npm run build` step runs automatically during Cloud deployments (configured in `craft-cloud.yaml`).

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

The `yiisoft/yii2-redis` package is installed but `REDIS_HOST` isn't set (or can't connect). Either add the Redis env vars or remove the package from `composer.json` to use Craft's default file cache.
