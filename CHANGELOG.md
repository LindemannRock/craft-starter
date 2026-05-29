# Changelog

## [5.0.0](https://github.com/LindemannRock/craft-starter/compare/craft-starter-v5.6.0...craft-starter-v5.0.0) (2026-05-29)


### Added

* add Arabic translations and improve site configuration handling ([11b14e0](https://github.com/LindemannRock/craft-starter/commit/11b14e018a93f823ca45e879e703f04dd4a276c0))
* **cli:** add back navigation and cancel options to db and registry pickers ([842a680](https://github.com/LindemannRock/craft-starter/commit/842a68069c3b2cb9d3ffc3c204aa30b59e3abe40))
* **cli:** add critical CSS generation option and related prompts ([fd57449](https://github.com/LindemannRock/craft-starter/commit/fd57449b82e379972993cc66b356b08bfb7a0f04))
* **cli:** add getUtcOffset function for human-readable timezone offsets ([7d9c3ed](https://github.com/LindemannRock/craft-starter/commit/7d9c3ed573cbf4206bee673b06dbcfb087f8d423))
* **cli:** add interactive database picker script ([86e391d](https://github.com/LindemannRock/craft-starter/commit/86e391d2eb48cf790c23c2842ccaf8b7413e656b))
* **cli:** add IP salt option for privacy-preserving analytics plugins ([0ce735f](https://github.com/LindemannRock/craft-starter/commit/0ce735f41465436ee447fb84793612c0b1a205c2))
* **cli:** add php-version command to manage PHP version across configs ([ee0885a](https://github.com/LindemannRock/craft-starter/commit/ee0885acca9dbad928813276ba6eea0cc9475a5d))
* **cli:** add registry management commands for plugins ([6648544](https://github.com/LindemannRock/craft-starter/commit/66485447733d29861c6218128f9dde600c299fbb))
* **cli:** add registry-plugins-remove target to remove plugins from registry ([676938f](https://github.com/LindemannRock/craft-starter/commit/676938f0d45b4734fc3186a7f18f7bba72e83792))
* **cli:** add review link for major updates in plugin version check ([e9fc09a](https://github.com/LindemannRock/craft-starter/commit/e9fc09a110d27457ad0e1000939239cb20e763c8))
* **cli:** add support for committed devDependency version retrieval ([82d5de3](https://github.com/LindemannRock/craft-starter/commit/82d5de376b74a0f2f262a1cf3de5a541a44f7556))
* **cli:** add unit tests for crypto and env utilities, implement redactSecrets function ([c2bc406](https://github.com/LindemannRock/craft-starter/commit/c2bc40662504998edbd03abfd790286d468f5713))
* **cli:** add verification for unfilled .env placeholders ([bb80839](https://github.com/LindemannRock/craft-starter/commit/bb80839d8b5d594e01f26106bb5eb8c9c9189848))
* **cli:** enhance critical CSS handling and restore templates ([d34617e](https://github.com/LindemannRock/craft-starter/commit/d34617e1e2acd12a7921d26325f65c8e7fc838ef))
* **cli:** enhance interactive update process for Craft CMS and plugins ([17eff94](https://github.com/LindemannRock/craft-starter/commit/17eff94bd05c61028cac8e9120ee6c7891fbcdc6))
* **cli:** enhance plugin version check with detailed release URLs ([6e51767](https://github.com/LindemannRock/craft-starter/commit/6e51767516231505fdb088285713790e05c537bc))
* **cli:** export removeSection function for section management in env files ([4f8f7b6](https://github.com/LindemannRock/craft-starter/commit/4f8f7b689de943ad4ef66b371ed1378ef623121d))
* **cli:** implement critical CSS choice handling in setup process ([ecbec02](https://github.com/LindemannRock/craft-starter/commit/ecbec02c5255d3b573eff1a9a2fd388e92823789))
* **cli:** include core-dev and optional Redis package in plugin version check ([d55cdff](https://github.com/LindemannRock/craft-starter/commit/d55cdffe676ef27e81b328b6e1505dc3542f1178))
* **cli:** insert new plugins in alphabetical order in registry ([db73a87](https://github.com/LindemannRock/craft-starter/commit/db73a87bd6fa483a4fbacc4466ca0d816f123bef))
* **cli:** prompt user for update confirmation in check-only mode ([4ad9f6c](https://github.com/LindemannRock/craft-starter/commit/4ad9f6cc4db1283e7f48c858b5a72cc202d1cda6))
* **cli:** sync core package versions in composer.json after updates ([9201217](https://github.com/LindemannRock/craft-starter/commit/9201217cf9bd53b1ec0fa25f1bd179c6f7fe4f3c))
* **cli:** warn about major updates requiring review during plugin check ([ada1b43](https://github.com/LindemannRock/craft-starter/commit/ada1b43fba6c761d2b2800f60a95239b616bb7e9))
* **ddev:** add post-start hook to guide users without .env to make create ([2636bd3](https://github.com/LindemannRock/craft-starter/commit/2636bd3aac5331df2961b03c3c1748b7f97e2f5d))
* enhance installation process and project configuration handling ([dd86a0a](https://github.com/LindemannRock/craft-starter/commit/dd86a0a13484ba7655da1a8e817cb4a9295a525a))
* **env:** add Formie REST API key generation and update env template ([6a21663](https://github.com/LindemannRock/craft-starter/commit/6a2166360505967af0b4565359189a0fa51fa087))
* **favicons:** add favicon generation functionality and assets ([e4483fa](https://github.com/LindemannRock/craft-starter/commit/e4483fa1c8e3f6220f133f8d3e78c637c6ee03e9))
* **headers:** add default security headers for public site responses ([246752f](https://github.com/LindemannRock/craft-starter/commit/246752fdd4913876643d6735d161661044c660ea))
* implement multi-site support with dynamic site configuration and translation scaffolding ([ebf2487](https://github.com/LindemannRock/craft-starter/commit/ebf2487b14e7c0939c0df7be681d2fe081d215bf))
* implement translation manager prompts and scaffold translations functionality ([8824c73](https://github.com/LindemannRock/craft-starter/commit/8824c73b3361ab4f96143b2d913d9e19437e4acc))
* **packageJson:** add hasIconManager option to updatePackageJson ([23396bc](https://github.com/LindemannRock/craft-starter/commit/23396bc38018df6cc850151cb54e084898b73bf8))
* **plugins:** add fetch-configs target and functionality ([40d12d1](https://github.com/LindemannRock/craft-starter/commit/40d12d1e133d5d8d7e832398fa3b5e6f762aed92))
* **plugins:** add functionality to interactively add a new plugin ([93a3796](https://github.com/LindemannRock/craft-starter/commit/93a3796df6a5048555df659b9c21e67e8e498d20))
* **plugins:** add plugin version check and update functionality ([6f5d00d](https://github.com/LindemannRock/craft-starter/commit/6f5d00dc46f91675309474c41fb724c937938d44))
* **plugins:** add Scout plugin to third-party plugins list ([42a5152](https://github.com/LindemannRock/craft-starter/commit/42a5152c7da9d14e8c4ee1f923b6fe2072c4c0ad))
* refactor translation manager prompts and configuration handling ([947d61f](https://github.com/LindemannRock/craft-starter/commit/947d61ffc675c6759f218898d3012596df59d803))
* **setup:** integrate .gitignore updates for downstream projects ([656e8e9](https://github.com/LindemannRock/craft-starter/commit/656e8e9536c2ab652cc7c6abde9efbe57249216e))
* Update environment configuration and add new system settings ([bdb067e](https://github.com/LindemannRock/craft-starter/commit/bdb067eb1291ccff0db570e7bb11a68b535fee87))
* **vite.config:** enforce PRIMARY_SITE_URL for critical CSS generation ([b4b2a56](https://github.com/LindemannRock/craft-starter/commit/b4b2a567a1266d70a23727cb1614cadd2970318e))


### Fixed

* **ci:** drop PAT requirement for release-please — use built-in GITHUB_TOKEN ([161d940](https://github.com/LindemannRock/craft-starter/commit/161d940f5afea21bb2af12fc6455f1a648bdd730))
* **cli:** add Cancel option to update, db, and registry pickers ([892c8d4](https://github.com/LindemannRock/craft-starter/commit/892c8d48732f0811fe799c58f39ac7f66f87777b))
* **cli:** add requireProject guard to update/db pickers for helpful error messages ([db9e4bc](https://github.com/LindemannRock/craft-starter/commit/db9e4bc81c615498cefa006c2c9d49e9850adc58))
* **cli:** apply security + robustness fixes ([54e0f56](https://github.com/LindemannRock/craft-starter/commit/54e0f5650305198d066dafab625a6ff724f2a32a))
* **cli:** correct asset storage package name in database script ([36d9029](https://github.com/LindemannRock/craft-starter/commit/36d90295cfc520bf3f55bf510ccf3752b3d70400))
* **cli:** remove alpha plugins from env files ([e3dd516](https://github.com/LindemannRock/craft-starter/commit/e3dd516affe0ce7ab4bb7e591b3cee92b27e62bf))
* **cli:** remove success log for no available updates ([f733e64](https://github.com/LindemannRock/craft-starter/commit/f733e64a52087ee5010a493f607cc45a0ad449a5))
* **cli:** update craftcms/cms version to ^5.10.4 ([0fec116](https://github.com/LindemannRock/craft-starter/commit/0fec11612e70ebaa46c7ac36b2ccf1ce16d41183))
* **cli:** update hint for Composer packages in update picker ([4a2a5c2](https://github.com/LindemannRock/craft-starter/commit/4a2a5c29437bab48ea12cbfb885018173b285ed2))
* **cli:** update package selection label to include full name ([b1a1880](https://github.com/LindemannRock/craft-starter/commit/b1a1880b54ff753690a188b9d4e9385926f7c62d))
* **cli:** update plugin label for clarity in registry picker ([8e845f1](https://github.com/LindemannRock/craft-starter/commit/8e845f15122efa8a817576ec2574bbe963b99e09))
* **cli:** update plugin versions for Campaign Manager, Formie Rating, and Search Manager ([bc2ab00](https://github.com/LindemannRock/craft-starter/commit/bc2ab00e0662c1bd6558e84a9d2df3c55f390cf8))
* component field to release-please configuration ([90f02d0](https://github.com/LindemannRock/craft-starter/commit/90f02d088fad0e3d924fb125791cd01d9f399453))
* **config:** improve Redis cache configuration handling ([d4ebeaf](https://github.com/LindemannRock/craft-starter/commit/d4ebeaf89a0604bde885362b93ff656c138e5585))
* correct project description in package.json ([b8ca26a](https://github.com/LindemannRock/craft-starter/commit/b8ca26a5565ea3112920378dd8877780cd104bf2))
* **database:** update MySQL version requirement comments for clarity ([dce8e09](https://github.com/LindemannRock/craft-starter/commit/dce8e09bd6fc1d6cd39b09840f4fde18d58392c7))
* ensure newConstraint pins the floor to the latest version for security patches ([3e6e822](https://github.com/LindemannRock/craft-starter/commit/3e6e822c9784087a85d6e36ca4309c3e6a25d79f))
* **env.mjs:** handle user-entered values in site block insertion ([b88b1f6](https://github.com/LindemannRock/craft-starter/commit/b88b1f6e6ec4fe40234a282fe392851fc7380d42))
* **global-variables.twig:** reset primaryTranslationCategory value ([55efa94](https://github.com/LindemannRock/craft-starter/commit/55efa94873fc9cabdb70c283ad02083c595205d3))
* improve version comparison logic in plugin version check ([a29cde5](https://github.com/LindemannRock/craft-starter/commit/a29cde5ee23782c0abb90afd19ec7cc2b78783d0))
* **install:** clear stale DDEV registration before config rename, not after ([e07cce7](https://github.com/LindemannRock/craft-starter/commit/e07cce7763eaa7112e6013d98cc1c285f9da7279))
* **install:** clear stale DDEV registration before start to handle project name changes ([71cf2aa](https://github.com/LindemannRock/craft-starter/commit/71cf2aad04457fa2bc37c739804f0bf21410a77f))
* **Makefile, plugins.mjs, setup.mjs:** improve error handling and config updates ([21a42a4](https://github.com/LindemannRock/craft-starter/commit/21a42a40a1eab655286a9e589f4d3d1642a2b042))
* **Makefile:** ensure Tailscale share commands do not fail on missing project ([0591a1c](https://github.com/LindemannRock/craft-starter/commit/0591a1c139c989bad95336e73afa8648b9f20465))
* **Makefile:** fix nuke target to remove Tailscale config file ([d4ea99e](https://github.com/LindemannRock/craft-starter/commit/d4ea99eb58b9249e2c512032cd39718680d61794))
* **Makefile:** nuke target to include global-variables.twig ([b278adc](https://github.com/LindemannRock/craft-starter/commit/b278adc1e7067df5e45eeca01daa53525d8eceaa))
* **Makefile:** swallow exit code for friendly output in verify target ([2989940](https://github.com/LindemannRock/craft-starter/commit/2989940a1fb4a58c0b3d46b1da90b64b3953145c))
* **nuke:** remove storage/config-deltas from cleanup process ([b237069](https://github.com/LindemannRock/craft-starter/commit/b2370698c476afbc3dc7bf8f6a99414e4edb41b6))
* **prompts:** improve email validation and set default values ([f4cad52](https://github.com/LindemannRock/craft-starter/commit/f4cad523d71d07f5916c2aa5d83e2f808f8244f2))
* **setup:** enhance project reset confirmation and process handling ([f1f9d8a](https://github.com/LindemannRock/craft-starter/commit/f1f9d8af29937fe96b6ae2a9da6fff10c69b0f92))
* **setup:** improve project detection and user guidance ([f715f62](https://github.com/LindemannRock/craft-starter/commit/f715f62152e005388f84952c86802d39ef6e03db))
* **translation-manager:** translation category examples ([4f8b729](https://github.com/LindemannRock/craft-starter/commit/4f8b7291c54ab23fde89df1393c6990743a1ebbc))
* update core package versions for security and compatibility ([8879347](https://github.com/LindemannRock/craft-starter/commit/8879347949567d86626c6063ba85854ccecf0857))
* update installation date in redis manifest and adjust timezone in config ([b4eb14d](https://github.com/LindemannRock/craft-starter/commit/b4eb14da52edf73ab4e0494062476c66aa65c3ad))

## [5.6.0](https://github.com/LindemannRock/craft-starter/compare/v5.5.0...v5.6.0) (2026-05-06)


### Features

* **cli:** enhance interactive update process for Craft CMS and plugins ([17eff94](https://github.com/LindemannRock/craft-starter/commit/17eff94bd05c61028cac8e9120ee6c7891fbcdc6))

## [5.5.0](https://github.com/LindemannRock/craft-starter/compare/v5.4.1...v5.5.0) (2026-04-30)


### Features

* **cli:** add IP salt option for privacy-preserving analytics plugins ([0ce735f](https://github.com/LindemannRock/craft-starter/commit/0ce735f41465436ee447fb84793612c0b1a205c2))
* **cli:** add php-version command to manage PHP version across configs ([ee0885a](https://github.com/LindemannRock/craft-starter/commit/ee0885acca9dbad928813276ba6eea0cc9475a5d))
* **cli:** add registry-plugins-remove target to remove plugins from registry ([676938f](https://github.com/LindemannRock/craft-starter/commit/676938f0d45b4734fc3186a7f18f7bba72e83792))
* **cli:** include core-dev and optional Redis package in plugin version check ([d55cdff](https://github.com/LindemannRock/craft-starter/commit/d55cdffe676ef27e81b328b6e1505dc3542f1178))
* **cli:** insert new plugins in alphabetical order in registry ([db73a87](https://github.com/LindemannRock/craft-starter/commit/db73a87bd6fa483a4fbacc4466ca0d816f123bef))
* **cli:** prompt user for update confirmation in check-only mode ([4ad9f6c](https://github.com/LindemannRock/craft-starter/commit/4ad9f6cc4db1283e7f48c858b5a72cc202d1cda6))
* **cli:** sync core package versions in composer.json after updates ([9201217](https://github.com/LindemannRock/craft-starter/commit/9201217cf9bd53b1ec0fa25f1bd179c6f7fe4f3c))
* **headers:** add default security headers for public site responses ([246752f](https://github.com/LindemannRock/craft-starter/commit/246752fdd4913876643d6735d161661044c660ea))


### Bug Fixes

* **database:** update MySQL version requirement comments for clarity ([dce8e09](https://github.com/LindemannRock/craft-starter/commit/dce8e09bd6fc1d6cd39b09840f4fde18d58392c7))
* ensure newConstraint pins the floor to the latest version for security patches ([3e6e822](https://github.com/LindemannRock/craft-starter/commit/3e6e822c9784087a85d6e36ca4309c3e6a25d79f))
* improve version comparison logic in plugin version check ([a29cde5](https://github.com/LindemannRock/craft-starter/commit/a29cde5ee23782c0abb90afd19ec7cc2b78783d0))
* update core package versions for security and compatibility ([8879347](https://github.com/LindemannRock/craft-starter/commit/8879347949567d86626c6063ba85854ccecf0857))

## [5.4.1](https://github.com/LindemannRock/craft-starter/compare/v5.4.0...v5.4.1) (2026-04-26)


### Bug Fixes

* **cli:** remove alpha plugins from env files ([e3dd516](https://github.com/LindemannRock/craft-starter/commit/e3dd516affe0ce7ab4bb7e591b3cee92b27e62bf))

## [5.4.0](https://github.com/LindemannRock/craft-starter/compare/v5.3.0...v5.4.0) (2026-04-25)


### Features

* **cli:** add getUtcOffset function for human-readable timezone offsets ([7d9c3ed](https://github.com/LindemannRock/craft-starter/commit/7d9c3ed573cbf4206bee673b06dbcfb087f8d423))
* **cli:** add unit tests for crypto and env utilities, implement redactSecrets function ([c2bc406](https://github.com/LindemannRock/craft-starter/commit/c2bc40662504998edbd03abfd790286d468f5713))
* **cli:** export removeSection function for section management in env files ([4f8f7b6](https://github.com/LindemannRock/craft-starter/commit/4f8f7b689de943ad4ef66b371ed1378ef623121d))


### Bug Fixes

* **cli:** update plugin versions for Campaign Manager, Formie Rating, and Search Manager ([bc2ab00](https://github.com/LindemannRock/craft-starter/commit/bc2ab00e0662c1bd6558e84a9d2df3c55f390cf8))
* **nuke:** remove storage/config-deltas from cleanup process ([b237069](https://github.com/LindemannRock/craft-starter/commit/b2370698c476afbc3dc7bf8f6a99414e4edb41b6))

## [5.3.0](https://github.com/LindemannRock/craft-starter/compare/v5.2.0...v5.3.0) (2026-04-23)


### Features

* **cli:** add back navigation and cancel options to db and registry pickers ([842a680](https://github.com/LindemannRock/craft-starter/commit/842a68069c3b2cb9d3ffc3c204aa30b59e3abe40))
* **ddev:** add post-start hook to guide users without .env to make create ([2636bd3](https://github.com/LindemannRock/craft-starter/commit/2636bd3aac5331df2961b03c3c1748b7f97e2f5d))


### Bug Fixes

* **cli:** add Cancel option to update, db, and registry pickers ([892c8d4](https://github.com/LindemannRock/craft-starter/commit/892c8d48732f0811fe799c58f39ac7f66f87777b))
* **install:** clear stale DDEV registration before config rename, not after ([e07cce7](https://github.com/LindemannRock/craft-starter/commit/e07cce7763eaa7112e6013d98cc1c285f9da7279))
* **install:** clear stale DDEV registration before start to handle project name changes ([71cf2aa](https://github.com/LindemannRock/craft-starter/commit/71cf2aad04457fa2bc37c739804f0bf21410a77f))
* **Makefile:** fix nuke target to remove Tailscale config file ([d4ea99e](https://github.com/LindemannRock/craft-starter/commit/d4ea99eb58b9249e2c512032cd39718680d61794))

## [5.2.0](https://github.com/LindemannRock/craft-starter/compare/v5.1.4...v5.2.0) (2026-04-20)


### Features

* **packageJson:** add hasIconManager option to updatePackageJson ([23396bc](https://github.com/LindemannRock/craft-starter/commit/23396bc38018df6cc850151cb54e084898b73bf8))


### Bug Fixes

* **cli:** add requireProject guard to update/db pickers for helpful error messages ([db9e4bc](https://github.com/LindemannRock/craft-starter/commit/db9e4bc81c615498cefa006c2c9d49e9850adc58))

## [5.1.4](https://github.com/LindemannRock/craft-starter/compare/v5.1.3...v5.1.4) (2026-04-17)


### Bug Fixes

* **translation-manager:** translation category examples ([4f8b729](https://github.com/LindemannRock/craft-starter/commit/4f8b7291c54ab23fde89df1393c6990743a1ebbc))

## [5.1.3](https://github.com/LindemannRock/craft-starter/compare/v5.1.2...v5.1.3) (2026-04-16)


### Bug Fixes

* **config:** improve Redis cache configuration handling ([d4ebeaf](https://github.com/LindemannRock/craft-starter/commit/d4ebeaf89a0604bde885362b93ff656c138e5585))

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
