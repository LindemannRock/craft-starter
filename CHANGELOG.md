# Changelog

## [5.1.2](https://github.com/LindemannRock/craft-starter/compare/v5.1.1...v5.1.2) (2026-04-16)


### Bug Fixes

* **cli:** apply security + robustness fixes ([54e0f56](https://github.com/LindemannRock/craft-starter/commit/54e0f5650305198d066dafab625a6ff724f2a32a))

## [5.1.1](https://github.com/LindemannRock/craft-starter/compare/v5.1.0...v5.1.1) (2026-04-16)


### Bug Fixes

* **setup:** enhance project reset confirmation and process handling ([f1f9d8a](https://github.com/LindemannRock/craft-starter/commit/f1f9d8af29937fe96b6ae2a9da6fff10c69b0f92))

## [5.1.0](https://github.com/LindemannRock/craft-starter/compare/v5.0.1...v5.1.0) (2026-04-16)


### Features

* **cli:** add verification for unfilled .env placeholders ([bb80839](https://github.com/LindemannRock/craft-starter/commit/bb80839d8b5d594e01f26106bb5eb8c9c9189848))
* **setup:** integrate .gitignore updates for downstream projects ([656e8e9](https://github.com/LindemannRock/craft-starter/commit/656e8e9536c2ab652cc7c6abde9efbe57249216e))


### Bug Fixes

* **ci:** drop PAT requirement for release-please — use built-in GITHUB_TOKEN ([161d940](https://github.com/LindemannRock/craft-starter/commit/161d940f5afea21bb2af12fc6455f1a648bdd730))
* **env.mjs:** handle user-entered values in site block insertion ([b88b1f6](https://github.com/LindemannRock/craft-starter/commit/b88b1f6e6ec4fe40234a282fe392851fc7380d42))
* **Makefile, plugins.mjs, setup.mjs:** improve error handling and config updates ([21a42a4](https://github.com/LindemannRock/craft-starter/commit/21a42a40a1eab655286a9e589f4d3d1642a2b042))
* **Makefile:** swallow exit code for friendly output in verify target ([2989940](https://github.com/LindemannRock/craft-starter/commit/2989940a1fb4a58c0b3d46b1da90b64b3953145c))
* **setup:** improve project detection and user guidance ([f715f62](https://github.com/LindemannRock/craft-starter/commit/f715f62152e005388f84952c86802d39ef6e03db))

## [5.0.1](https://github.com/LindemannRock/craft-starter/compare/v5.0.0...v5.0.1) (2026-04-16)


### Bug Fixes

* **global-variables.twig:** reset primaryTranslationCategory value ([55efa94](https://github.com/LindemannRock/craft-starter/commit/55efa94873fc9cabdb70c283ad02083c595205d3))
* **Makefile:** nuke target to include global-variables.twig ([b278adc](https://github.com/LindemannRock/craft-starter/commit/b278adc1e7067df5e45eeca01daa53525d8eceaa))

## 5.0.0 (2026-04-16)


### Features

* add Arabic translations and improve site configuration handling ([11b14e0](https://github.com/LindemannRock/craft-starter/commit/11b14e018a93f823ca45e879e703f04dd4a276c0))
* **cli:** add critical CSS generation option and related prompts ([fd57449](https://github.com/LindemannRock/craft-starter/commit/fd57449b82e379972993cc66b356b08bfb7a0f04))
* **cli:** add interactive database picker script ([86e391d](https://github.com/LindemannRock/craft-starter/commit/86e391d2eb48cf790c23c2842ccaf8b7413e656b))
* **cli:** add registry management commands for plugins ([6648544](https://github.com/LindemannRock/craft-starter/commit/66485447733d29861c6218128f9dde600c299fbb))
* **cli:** add support for committed devDependency version retrieval ([82d5de3](https://github.com/LindemannRock/craft-starter/commit/82d5de376b74a0f2f262a1cf3de5a541a44f7556))
* **cli:** enhance critical CSS handling and restore templates ([d34617e](https://github.com/LindemannRock/craft-starter/commit/d34617e1e2acd12a7921d26325f65c8e7fc838ef))
* **cli:** implement critical CSS choice handling in setup process ([ecbec02](https://github.com/LindemannRock/craft-starter/commit/ecbec02c5255d3b573eff1a9a2fd388e92823789))
* enhance installation process and project configuration handling ([dd86a0a](https://github.com/LindemannRock/craft-starter/commit/dd86a0a13484ba7655da1a8e817cb4a9295a525a))
* **env:** add Formie REST API key generation and update env template ([6a21663](https://github.com/LindemannRock/craft-starter/commit/6a2166360505967af0b4565359189a0fa51fa087))
* **favicons:** add favicon generation functionality and assets ([e4483fa](https://github.com/LindemannRock/craft-starter/commit/e4483fa1c8e3f6220f133f8d3e78c637c6ee03e9))
* implement multi-site support with dynamic site configuration and translation scaffolding ([ebf2487](https://github.com/LindemannRock/craft-starter/commit/ebf2487b14e7c0939c0df7be681d2fe081d215bf))
* implement translation manager prompts and scaffold translations functionality ([8824c73](https://github.com/LindemannRock/craft-starter/commit/8824c73b3361ab4f96143b2d913d9e19437e4acc))
* **plugins:** add fetch-configs target and functionality ([40d12d1](https://github.com/LindemannRock/craft-starter/commit/40d12d1e133d5d8d7e832398fa3b5e6f762aed92))
* **plugins:** add functionality to interactively add a new plugin ([93a3796](https://github.com/LindemannRock/craft-starter/commit/93a3796df6a5048555df659b9c21e67e8e498d20))
* **plugins:** add plugin version check and update functionality ([6f5d00d](https://github.com/LindemannRock/craft-starter/commit/6f5d00dc46f91675309474c41fb724c937938d44))
* **plugins:** add Scout plugin to third-party plugins list ([42a5152](https://github.com/LindemannRock/craft-starter/commit/42a5152c7da9d14e8c4ee1f923b6fe2072c4c0ad))
* refactor translation manager prompts and configuration handling ([947d61f](https://github.com/LindemannRock/craft-starter/commit/947d61ffc675c6759f218898d3012596df59d803))
* Update environment configuration and add new system settings ([bdb067e](https://github.com/LindemannRock/craft-starter/commit/bdb067eb1291ccff0db570e7bb11a68b535fee87))
* **vite.config:** enforce PRIMARY_SITE_URL for critical CSS generation ([b4b2a56](https://github.com/LindemannRock/craft-starter/commit/b4b2a567a1266d70a23727cb1614cadd2970318e))


### Bug Fixes

* correct project description in package.json ([b8ca26a](https://github.com/LindemannRock/craft-starter/commit/b8ca26a5565ea3112920378dd8877780cd104bf2))
* **Makefile:** ensure Tailscale share commands do not fail on missing project ([0591a1c](https://github.com/LindemannRock/craft-starter/commit/0591a1c139c989bad95336e73afa8648b9f20465))
* **prompts:** improve email validation and set default values ([f4cad52](https://github.com/LindemannRock/craft-starter/commit/f4cad523d71d07f5916c2aa5d83e2f808f8244f2))
* update installation date in redis manifest and adjust timezone in config ([b4eb14d](https://github.com/LindemannRock/craft-starter/commit/b4eb14da52edf73ab4e0494062476c66aa65c3ad))
