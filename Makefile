.PHONY: help create install start dev prod favicons reset nuke \
	clean clean-logs update update-composer update-npm up npm-install kill-vite \
	pull-db export-db import-db reindex-search \
	launch tableplus mailpit keys format share funnel \
	l tp mp fmt kv

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
# Always exits 0 so Make never prints "*** Error".
# Usage: @$(call require_project, ddev exec php craft up)
define require_project
if [ ! -f .env ]; then \
  echo "No .env file found. Run 'make create' first."; \
elif ! ddev describe >/dev/null 2>&1; then \
  echo "DDEV is not running. Run 'make start' or 'ddev start' first."; \
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
	@cd cli && npm install --silent 2>/dev/null && cd ..
	@node cli/setup.mjs

install: ## Install or re-sync the project (idempotent — safe to run anytime)
	@if [ ! -f .env ]; then \
		echo "No .env file found. Run 'make create' for interactive setup."; \
	else \
		$(MAKE) --no-print-directory _install; \
	fi

_install:
	ddev start
	ddev composer install
	ddev exec -- npm install $(NPM_INSTALL_FLAGS)
	@# Only run `craft install` if Craft isn't installed yet.
	@# Prompts for admin email + password only. Site name/URL/language get
	@# overwritten by configure-project.php immediately after.
	@if ddev exec php craft project-config/get system.schemaVersion 2>/dev/null | grep -qE '^[0-9]+\.'; then \
		echo "Craft already installed — skipping first-run install"; \
	else \
		echo "Installing Craft CMS (enter admin credentials)..."; \
		ddev exec php craft install; \
	fi
	@# Activate any plugins listed in composer.json (idempotent — already-active plugins are skipped)
	@for handle in $$(ddev exec php craft plugin/list --installed 2>/dev/null | awk '$$2 == "No" {print $$1}'); do \
		echo "Activating plugin: $$handle"; \
		ddev exec php craft plugin/install "$$handle" 2>/dev/null || true; \
	done
	ddev exec php craft up --interactive=0
	@# Run project config script if sites.json exists (left by make create)
	@if [ -f cli/tmp/sites.json ]; then \
		echo "Configuring project (email, sites, system settings)..."; \
		ddev exec php cli/scripts/configure-project.php; \
	fi
	@# Copy CP rebrand assets if not already present
	@if [ -d cli/templates/rebrand ] && [ ! -d storage/rebrand ]; then \
		cp -r cli/templates/rebrand storage/rebrand; \
	fi
	@echo "Install/sync complete"

start: ## ddev start + Vite dev server
	@if [ ! -f .env ]; then echo "No .env file found. Run 'make create' first."; \
	else ddev start && ddev exec npm run dev; fi

keys: ## Generate Craft security key + app ID into .env
	@$(call require_project, ddev exec php craft setup/keys)

npm-install: ## Run `npm install` inside DDEV
	@if [ ! -f .env ]; then echo "No .env file found. Run 'make create' first."; \
	else ddev start && ddev exec -- npm install $(NPM_INSTALL_FLAGS); fi

##@ Development

dev: ## Start Vite dev server (HMR)
	@$(call require_project, ddev exec npm run dev)

prod: ## Production build
	@$(call require_project, ddev exec npm run build)

favicons: ## Generate site favicons from src/img/favicon.svg
	@$(call require_project, ddev exec bash -c 'cd cli && node scripts/generate-favicons.mjs')

format: ## @fmt Format everything with Prettier
	@$(call require_project, ddev exec npx prettier -w .)
	$(call alias_hint)

kill-vite: ## @kv Kill stuck Vite processes
	@ddev exec bash -c "pkill -9 -f 'node.*vite'" 2>/dev/null || true
	@echo "Vite processes killed"
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
kv: kill-vite

##@ Device testing (Tailscale)

share: ## Share over your Tailnet (test device needs Tailscale)
	@$(call require_project, ddev tailscale-share)

funnel: ## Share publicly via Tailscale Funnel (no Tailscale on test device)
	@$(call require_project, ddev tailscale-funnel)

##@ Maintenance

up: ## Apply project config + run pending migrations
	@$(call require_project, ddev exec php craft up --interactive=0)

update: ## Run `craft update all` (updates Craft + plugins via Craft's updater)
	@$(call require_project, ddev exec php craft update all)

update-composer: ## Update Composer packages to latest matching versions
	@$(call require_project, ddev composer update)

update-npm: ## Update NPM packages (interactive — shows what's available)
	@$(call require_project, ddev exec npm-check --update)

update-cli: ## Update CLI packages in cli/ (interactive)
	@cd cli && npm run update

check-plugins: ## Check plugin registry versions against Packagist
	@node cli/scripts/check-plugin-versions.mjs

update-plugins: ## Update plugin registry versions (confirms major bumps)
	@node cli/scripts/check-plugin-versions.mjs --update

add-plugin: ## Add a new plugin to the registry (searches Packagist)
	@node cli/scripts/add-plugin.mjs

fetch-configs: ## Fetch default config.php for registered plugins from GitHub
	@node cli/scripts/fetch-plugin-configs.mjs

clean: ## Remove vendor & node_modules then reinstall
	@if [ ! -f .env ]; then \
		echo "No .env file found. Run 'make create' for interactive setup."; \
	else \
		rm -rf vendor/ node_modules/; \
		ddev composer clear-cache; \
		ddev exec npm cache clean --force; \
		ddev composer install; \
		ddev exec -- npm install $(NPM_INSTALL_FLAGS); \
	fi

clean-logs: ## Remove storage/logs/*.log
	rm -rf storage/logs/*.log

pull-db: ## Pull database from Servd (Servd hosting only)
	@$(call require_project, ddev exec php craft servd-asset-storage/local/pull-database --emptyDatabase)

export-db: ## Export the local database (default: db.sql.gz, or file=path)
	@if [ ! -f .env ]; then echo "No .env file found. Run 'make create' first."; \
	elif ! ddev describe >/dev/null 2>&1; then echo "DDEV is not running. Run 'make start' or 'ddev start' first."; \
	else \
		target="$${file:-db.sql.gz}"; \
		echo "Exporting database to $$target..."; \
		ddev export-db --file="$$target"; \
		echo "Done."; \
	fi

import-db: ## Import a SQL dump (default: db.sql.gz, or file=path)
	@if [ ! -f .env ]; then echo "No .env file found. Run 'make create' first."; \
	elif ! ddev describe >/dev/null 2>&1; then echo "DDEV is not running. Run 'make start' or 'ddev start' first."; \
	else \
		target="$${file:-db.sql.gz}"; \
		if [ ! -f "$$target" ]; then \
			echo "File not found: $$target"; \
			echo "Usage: make import-db                    (imports ./db.sql.gz)"; \
			echo "       make import-db file=path/to/dump.sql.gz"; \
		else \
			echo "Importing database from $$target..."; \
			ddev import-db --file="$$target"; \
			echo "Done."; \
		fi; \
	fi

reindex-search: ## Rebuild the search index
	@$(call require_project, ddev exec php craft resave/entries --update-search-index)

##@ Destructive (asks for confirmation)

reset: ## Wipe the database + .env (keeps vendor/node_modules)
	@printf "This will wipe the database and .env. Continue? [y/N] " && read ans && [ "$$ans" = "y" ] || [ "$$ans" = "Y" ] || (echo "Cancelled." && exit 1)
	@echo "Resetting database..."
	ddev delete -Oy 2>/dev/null || true
	@rm -f .env
	@rm -rf config/project
	@echo "Reset complete — run 'make create' to reinstall"

nuke: ## Destroy DDEV + vendor + node_modules + dist + config/project + .env
	@printf "This will destroy EVERYTHING (DDEV, vendor, node_modules, .env, dist). Continue? [y/N] " && read ans && [ "$$ans" = "y" ] || [ "$$ans" = "Y" ] || (echo "Cancelled." && exit 1)
	@echo "Nuking everything and starting from scratch..."
	@# Kill any running dev processes that might be holding files open
	@pkill -9 -f 'node.*vite' 2>/dev/null || true
	ddev delete -Oy 2>/dev/null || true
	@# Purge .DS_Store files first so macOS Finder can't block directory removal mid-rm
	@find vendor node_modules web/dist config/project -name '.DS_Store' -delete 2>/dev/null || true
	@# First-pass removal
	@rm -rf vendor node_modules web/dist config/project storage/config-deltas storage/logs storage/rebrand storage/runtime 2>/dev/null || true
	@rm -f .env composer.lock package-lock.json craft-cloud.yaml 2>/dev/null || true
	@# Reset files modified by make create back to starter defaults
	@git checkout composer.json package.json 2>/dev/null || true
	@# Remove plugin configs generated by make create (source templates live in cli/templates/plugins/)
	@for f in cli/templates/plugins/*.php; do rm -f "config/$$(basename $$f)" 2>/dev/null; done
	@# Remove DDEV generated artifacts
	@rm -rf .ddev/addon-metadata/redis .ddev/docker-compose.redis.yaml .ddev/redis 2>/dev/null || true
	@rm -rf .ddev/traefik/certs .ddev/traefik/config 2>/dev/null || true
	@# Reset DDEV config to starter defaults
	@sed -i '' 's/^name: .*/name: craft-starter/' .ddev/config.yaml 2>/dev/null || true
	@sed -i '' 's/^timezone: .*/timezone: Asia\/Dubai/' .ddev/config.yaml 2>/dev/null || true
	@# Remove scaffolded translations (template lives in cli/templates/translations/)
	@find translations -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} + 2>/dev/null || true
	@# Remove CLI temp files
	@rm -rf cli/tmp 2>/dev/null || true
	@# Second-pass retry — catches race conditions with Finder/Spotlight/Mutagen
	@if [ -e vendor ] || [ -e node_modules ] || [ -e web/dist ] || [ -e config/project ]; then \
		sleep 1; \
		find vendor node_modules web/dist config/project -name '.DS_Store' -delete 2>/dev/null || true; \
		rm -rf vendor node_modules web/dist config/project storage/config-deltas storage/logs storage/rebrand storage/runtime 2>/dev/null || true; \
	fi
	@# Final safety check — fail loudly if anything survived
	@if [ -e vendor ] || [ -e node_modules ] || [ -e web/dist ] || [ -e config/project ] || [ -e .env ]; then \
		echo ""; \
		echo "Some files could not be removed. They may be locked by a running process."; \
		echo "Try:  pkill -9 node && make nuke"; \
		echo "Or manually:  rm -rf vendor node_modules web/dist config/project storage/config-deltas storage/logs storage/rebrand storage/runtime .env"; \
		exit 1; \
	fi
	@echo "Nuke complete — run 'make create' or 'make install' to rebuild"
