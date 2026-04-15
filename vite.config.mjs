import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import manifestSRI from 'vite-plugin-manifest-sri';
import ViteRestart from 'vite-plugin-restart';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import copy from 'rollup-plugin-copy';
import * as path from 'path';
import * as fs from 'fs';

export default defineConfig(async ({ command, mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	// Critical CSS is opt-in (slow — spawns Chromium per page).
	// Enabled via `make critical`; `make prod` leaves it off for fast builds.
	let criticalPlugin = null;
	if (env.GENERATE_CRITICAL_CSS === 'true') {
		try {
			const { default: critical } = await import('rollup-plugin-critical');
			criticalPlugin = critical({
				criticalUrl: env.PRIMARY_SITE_URL || 'https://starter.ddev.site/',
				criticalBase: path.resolve(process.cwd(), 'web/dist/criticalcss') + '/',
				criticalPages: [
					{ uri: '/', template: 'entry/home/default' },
					{ uri: '/about', template: 'entry/pages/default' },
				],
				criticalConfig: {},
			});
		} catch {
			console.warn('[vite] rollup-plugin-critical not installed — skipping critical CSS generation');
		}
	}

	const outputDir = path.resolve(process.cwd(), 'web/dist');
	const sharedAssetsDir = path.resolve(process.cwd(), 'web/dist/assets');

	return {
		base: command === 'serve' ? '' : '/dist/',
		logLevel: 'info',
		build: {
			minify: 'terser',
			commonjsOptions: {
				transformMixedEsModules: true,
			},
			emptyOutDir: true,
			manifest: 'manifest.json',
			outDir: outputDir,
			cssCodeSplit: true,
			sourcemap: true,
			terserOptions: {
				compress: {
					drop_console: true,
					drop_debugger: true,
				},
			},
			chunkSizeWarningLimit: 1000,
			rollupOptions: {
				input: {
					main: path.resolve(process.cwd(), './src/js/main.ts'),
				},
				output: {
					entryFileNames: (chunkInfo) => {
						if (chunkInfo.name === 'init') {
							return 'assets/js/0-[name]-[hash].js';
						}
						return 'assets/js/[name]-[hash].js';
					},
					assetFileNames: (assetInfo) => {
						const name = assetInfo.names?.[0] ?? '';
						if (name.endsWith('.css')) {
							const entryPoint = name.split('/').pop()?.replace('.css', '') || 'style';
							return `assets/css/${entryPoint}-[hash][extname]`;
						}
						return 'assets/[name]-[hash][extname]';
					},
					manualChunks(id) {
						if (id.includes('node_modules/alpinejs') || id.includes('node_modules/@alpinejs/collapse')) {
							return 'vendor';
						}
						if (id.includes('node_modules/swiper')) {
							return 'swiper';
						}
						if (id.includes('node_modules/mmenu-js')) {
							return 'mmenu';
						}
					},
				},
			},
		},
		plugins: [
			tailwindcss(),
			manifestSRI(),
			// Clean shared asset directories on build so stale files don't linger
			command === 'build'
				? {
						name: 'clean-assets',
						buildStart() {
							const dirsToClean = ['brand', 'cp', 'fonts', 'icons', 'img'];
							for (const dir of dirsToClean) {
								const targetDir = path.join(sharedAssetsDir, dir);
								if (fs.existsSync(targetDir)) {
									fs.rmSync(targetDir, { recursive: true, force: true });
								}
							}
						},
					}
				: null,
			// Copy assets on serve (so you don't need to run build first)
			command === 'serve'
				? {
						name: 'copy-assets-serve',
						buildStart() {
							const assetDirs = ['brand', 'cp', 'fonts', 'icons', 'img'];
							console.log('Copying assets for dev server...');
							for (const dir of assetDirs) {
								const srcDir = path.join(process.cwd(), 'src', dir);
								const destDir = path.join(sharedAssetsDir, dir);
								if (fs.existsSync(srcDir)) {
									fs.cpSync(srcDir, destDir, { recursive: true });
									console.log(`   Copied: ${dir}`);
								}
							}
						},
					}
				: null,
			copy({
				targets: [
					{ src: 'src/brand/**/*', dest: sharedAssetsDir },
					{ src: 'src/cp/**/*', dest: sharedAssetsDir },
					{ src: 'src/fonts/**/*', dest: sharedAssetsDir },
					{ src: 'src/icons/**/*', dest: sharedAssetsDir },
					{ src: 'src/img/**/*', dest: sharedAssetsDir },
				],
				hook: 'writeBundle',
				copyOnce: true,
				flatten: false,
			}),
			criticalPlugin,
			ViteRestart({
				restart: ['./templates/**/*', './src/**/*', './translations/**/*', './config/*'],
			}),
			viteCompression({
				filter: /\.(js|mjs|json|css|map)$/i,
			}),
			visualizer({
				filename: `${outputDir}/stats.html`,
				template: 'treemap',
				sourcemap: true,
			}),
		],
		publicDir: path.resolve(process.cwd(), './src/public'),
		resolve: {
			alias: {
				'@': path.resolve(process.cwd(), './src'),
				'@css': path.resolve(process.cwd(), './src/css'),
				'@js': path.resolve(process.cwd(), './src/js'),
				'@templates': path.resolve(process.cwd(), './templates'),
			},
		},
		server: {
			allowedHosts: ['localhost', '.local', '.test', '.site'],
			cors: {
				origin: /https?:\/\/([A-Za-z0-9\-\.]+)?(localhost|\.local|\.test|\.site)(?::\d+)?$/,
			},
			fs: {
				strict: false,
			},
			headers: {
				'Access-Control-Allow-Private-Network': 'true',
			},
			host: '0.0.0.0',
			origin: 'http://localhost:3000',
			port: 3000,
			strictPort: true,
		},
	};
});
