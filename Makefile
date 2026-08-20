.PHONY: help create install start redis test build build-critical favicons reset repair \
	repair-dependencies repair-logs repair-vite update update-craft update-composer update-npm update-cli \
	registry registry-plugins-check registry-plugins-update registry-plugins-add registry-plugins-remove registry-plugins-fetch \
	up npm-install \
	db db-pull db-export db-import verify php-version reindex-search \
	launch tableplus mailpit keys format share funnel \
	l tp mp fmt

# `make` with no args shows help
.DEFAULT_GOAL := help

NPM_INSTALL_FLAGS ?= --include=optional --legacy-peer-deps

# -----------------------------------------------------------------------------
# Help — parses `## description` comments on each target line. Targets with a
# short alias use `## @<alias> description`, which the parser renders inline
# as `command (alias)`. Section headers use `##@ Section Name`.
# -----------------------------------------------------------------------------
help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} \
		/^##@ / { printf "\n\033[1m%s\033[0m\n", substr($$0, 5); next } \
		/^[a-zA-Z_-]+:.*?## / { \
			cmd = $$1; desc = $$2; alias = ""; \
			if (substr(desc, 1, 1) == "@") { \
				sp = index(desc, " "); \
				alias = substr(desc, 2, sp - 2); \
				desc = substr(desc, sp + 1); \
			} \
			if (alias != "") { \
				visible = sprintf("%s (%s)", cmd, alias); \
				label = sprintf("\033[36m%s\033[0m \033[2m(%s)\033[0m", cmd, alias); \
			} else { \
				visible = cmd; \
				label = sprintf("\033[36m%s\033[0m", cmd); \
			} \
			pad = 26 - length(visible); \
			if (pad < 0) pad = 0; \
			printf "  %s%*s %s\n", label, pad, "", desc; \
		}' \
		$(MAKEFILE_LIST)
	@echo ""

# -----------------------------------------------------------------------------
# alias_hint — prints "tip: shortcut is 'make <alias>'" after an aliased
# target's recipe, but only when the long-form target was invoked directly.
# The alias is parsed from the target's own `## @<alias>` help comment, so
# adding a new alias requires no changes here — just add `$(call alias_hint)`
# to the recipe.
# -----------------------------------------------------------------------------
# require_project — wraps a command with .env + DDEV checks.
# Usage: @$(call require_project, node cli/scripts/run-profile-command.mjs up)
define require_project
if [ ! -f .env ]; then \
  echo "No .env file found. Run 'make create' first."; \
  exit 1; \
elif ! ddev describe >/dev/null 2>&1; then \
  echo "DDEV is not running. Run 'make start' or 'ddev start' first."; \
  exit 1; \
else \
  $(1); \
fi
endef

define alias_hint
@if echo " $(MAKECMDGOALS) " | grep -q " $@ "; then \
  alias=$$(grep -E "^$@[[:space:]]*:.*## @[a-zA-Z0-9_-]+" $(firstword $(MAKEFILE_LIST)) | sed -nE 's/.*## @([a-zA-Z0-9_-]+).*/\1/p' | head -1); \
  [ -n "$$alias" ] && printf '  \033[2mtip: shortcut is\033[0m \033[36mmake %s\033[0m\n' "$$alias"; \
fi
endef

##@ Setup & install

create: ## Interactive setup (prompts → install Craft + plugins end-to-end)
	@cd cli && npm ci --silent 2>/dev/null && cd ..
	@node cli/setup.mjs

install: ## Install or re-sync the project (idempotent — safe to run anytime)
	@if [ ! -f .env ]; then \
		echo "No .env file found. Run 'make create' for interactive setup."; \
		exit 1; \
	else \
		$(MAKE) --no-print-directory _install; \
	fi

_install:
	ddev start
	ddev composer install
	@if [ -f package-lock.json ]; then \
		ddev exec -- npm ci $(NPM_INSTALL_FLAGS); \
	else \
		ddev exec -- npm install $(NPM_INSTALL_FLAGS); \
	fi
	@# Only run `craft install` if Craft isn't installed yet.
	@# Reuses non-secret choices from .craft-starter.json and prompts only for
	@# the admin password, which is deliberately never persisted.
	@if node cli/scripts/run-profile-command.mjs schema-version 2>/dev/null | grep -qE '^[0-9]+\.'; then \
		echo "Craft already installed — skipping first-run install"; \
	else \
		node cli/scripts/install-craft.mjs; \
	fi
	@node cli/scripts/install-plugins.mjs
	@node cli/scripts/run-profile-command.mjs up
	@# Run project config script if sites.json exists (left by make create)
	@if [ -f cli/tmp/sites.json ]; then \
		echo "Configuring project (email, sites, system settings)..."; \
		node cli/scripts/configure-project.mjs; \
	fi
	@node cli/scripts/sync-static-assets.mjs
	ddev exec env GENERATE_CRITICAL_CSS=false npm run build
	@node cli/scripts/complete-setup.mjs
	@echo "Install/sync complete"

start: ## ddev start + Vite dev server
	@if [ ! -f .env ]; then echo "No .env file found. Run 'make create' first."; \
	else ddev start && ddev exec npm run dev; fi

keys: ## Generate application security keys for the active Craft profile
	@$(call require_project, node cli/scripts/run-profile-command.mjs setup-keys)

npm-install: ## Run `npm install` inside DDEV
	@if [ ! -f .env ]; then echo "No .env file found. Run 'make create' first."; \
	else ddev start && ddev exec -- npm install $(NPM_INSTALL_FLAGS); fi

redis: ## Manage Redis cache and sessions (enable, change, or remove)
	@node cli/scripts/redis.mjs

##@ Development

test: ## Run CLI unit tests (vitest)
	@cd cli && npx vitest run

build: ## Production frontend build (fast — skips critical CSS)
	@$(call require_project, ddev exec env GENERATE_CRITICAL_CSS=false npm run build)
	@# Hint: if the project opted into critical CSS but files aren't built yet, suggest `make build-critical`
	@if grep -q '^GENERATE_CRITICAL_CSS=true' .env 2>/dev/null && ! node cli/scripts/check-critical-output.mjs; then \
	  printf '\n  \033[2mtip: this project uses critical CSS — run\033[0m \033[36mmake build-critical\033[0m \033[2mbefore shipping\033[0m\n'; \
	fi

build-critical: ## Production frontend build with critical CSS (slow)
	@if ! node cli/scripts/check-profile-feature.mjs criticalCss; then \
		:; \
	elif ! grep -q '"rollup-plugin-critical"' package.json 2>/dev/null; then \
	  echo "Critical CSS was not selected during 'make create' — rollup-plugin-critical is not installed."; \
	  echo "To enable:"; \
	  echo "  1. Add to package.json devDependencies:  \"rollup-plugin-critical\": \"^1.0.15\""; \
	  echo "  2. Add to .env:                          GENERATE_CRITICAL_CSS=true"; \
	  echo "  3. Run:                                  make npm-install"; \
	elif ! grep -q '^GENERATE_CRITICAL_CSS=' .env 2>/dev/null; then \
	  echo "GENERATE_CRITICAL_CSS is not set in .env. Add 'GENERATE_CRITICAL_CSS=true' and re-run."; \
	elif grep -qE '^GENERATE_CRITICAL_CSS=(false|0|no)$$' .env 2>/dev/null; then \
	  echo "GENERATE_CRITICAL_CSS is disabled in .env. Set it to 'true' and re-run."; \
	else \
	  $(call require_project, ddev exec env GENERATE_CRITICAL_CSS=true npm run build) \
	fi

favicons: ## Generate site favicons from src/img/favicon.svg
	@if [ ! -f .env ]; then echo "No .env file found. Run 'make create' first."; \
	else node cli/scripts/generate-favicons.mjs; fi

format: ## @fmt Format everything with Prettier
	@$(call require_project, ddev exec npx prettier -w .)
	$(call alias_hint)

launch: ## @l Launch the site in your browser
	@$(call require_project, ddev launch)
	$(call alias_hint)

tableplus: ## @tp Launch TablePlus
	@$(call require_project, ddev tableplus)
	$(call alias_hint)

mailpit: ## @mp Launch Mailpit
	@$(call require_project, ddev mailpit)
	$(call alias_hint)

# Short aliases — parsed into the alias column of `make help` via the
# `## @<alias>` annotation on each canonical target above. Keep them here
# as plain prerequisite-only targets so `make l` runs `launch`, etc.
l: launch
tp: tableplus
mp: mailpit
fmt: format

##@ Device testing (Tailscale)

share: ## Share over your Tailnet (test device needs Tailscale)
	@$(call require_project, ddev tailscale-share || true)

funnel: ## Share publicly via Tailscale Funnel (no Tailscale on test device)
	@$(call require_project, ddev tailscale-funnel || true)

##@ Maintenance

up: ## Apply project config + run pending migrations
	@$(call require_project, node cli/scripts/run-profile-command.mjs up)

verify: ## Scan .env for unfilled placeholders (run before deploy)
	@# Swallow the exit code for friendly interactive output.
	@# For CI gating, call the script directly: `node cli/scripts/verify.mjs`
	@node cli/scripts/verify.mjs || true

php-version: ## Set PHP version (interactive, or pass VERSION=8.5)
	@VERSION="$(VERSION)" node cli/scripts/php-version.mjs

update: ## Interactive update picker (Craft / Composer / NPM / CLI / All)
	@node cli/scripts/update.mjs

# Hidden (no `##` description) — still callable, invoked by the picker above.
update-craft:
	@$(call require_project, node cli/scripts/run-profile-command.mjs update all)

update-composer:
	@$(call require_project, ddev composer update)

update-npm:
	@$(call require_project, ddev exec npx npm-check --update)

update-cli:
	@cd cli && npm run update

registry: ## Maintain the plugin list offered by make create (check / update / add / remove / fetch)
	@node cli/scripts/registry.mjs

# Hidden (no `##` description) — still callable, invoked by the picker above.
# Naming: registry-<resource>-<action>  e.g. registry-plugins-check, registry-themes-add (future)
registry-plugins-check:
	@node cli/scripts/check-plugin-versions.mjs

registry-plugins-update:
	@node cli/scripts/check-plugin-versions.mjs --update

registry-plugins-add:
	@node cli/scripts/add-plugin.mjs

registry-plugins-remove:
	@node cli/scripts/remove-plugin.mjs

registry-plugins-fetch:
	@node cli/scripts/fetch-plugin-configs.mjs

db: ## Interactive database picker (pull / export / import)
	@node cli/scripts/db.mjs

# Hidden (no `##` description) — still callable, invoked by the picker above.
# Override the default file with `make db-export file=path/to/dump.sql.gz`.
db-pull:
	@$(call require_project, ddev exec php craft servd-asset-storage/local/pull-database --emptyDatabase)

db-export:
	@if [ ! -f .env ]; then echo "No .env file found. Run 'make create' first."; \
	elif ! ddev describe >/dev/null 2>&1; then echo "DDEV is not running. Run 'make start' or 'ddev start' first."; \
	else \
		target="$${file:-db.sql.gz}"; \
		echo "Exporting database to $$target..."; \
		ddev export-db --file="$$target"; \
		echo "Done."; \
	fi

db-import:
	@if [ ! -f .env ]; then echo "No .env file found. Run 'make create' first."; \
	elif ! ddev describe >/dev/null 2>&1; then echo "DDEV is not running. Run 'make start' or 'ddev start' first."; \
	else \
		target="$${file:-db.sql.gz}"; \
		if [ ! -f "$$target" ]; then \
			echo "File not found: $$target"; \
		else \
			echo "Importing database from $$target..."; \
			ddev import-db --file="$$target"; \
			echo "Done."; \
		fi; \
	fi

reindex-search: ## Rebuild the search index
	@$(call require_project, node cli/scripts/run-profile-command.mjs resave-entries --update-search-index)

##@ Repair & troubleshooting

repair: ## Repair dependencies, logs, Vite, or the local runtime
	@node cli/scripts/repair.mjs

# Hidden (no `##` description) — invoked by the repair picker above.
repair-dependencies:
	@if [ ! -f .env ]; then \
		echo "No .env file found. Run 'make create' for interactive setup."; \
	else \
		set -e; \
		rm -rf vendor/ node_modules/; \
		ddev start; \
		ddev composer clear-cache; \
		ddev exec npm cache clean --force; \
		ddev composer install; \
		if [ -f package-lock.json ]; then \
			ddev exec -- npm ci $(NPM_INSTALL_FLAGS); \
		else \
			ddev exec -- npm install $(NPM_INSTALL_FLAGS); \
		fi; \
	fi

repair-logs:
	rm -rf storage/logs/*.log

repair-vite:
	@ddev exec bash -c "pkill -9 -f 'node.*vite'" 2>/dev/null || true
	@echo "Vite processes killed"

##@ Starter maintenance

reset: ## Restore the original starter scaffold (starter repository only)
	@node cli/scripts/lifecycle.mjs reset
