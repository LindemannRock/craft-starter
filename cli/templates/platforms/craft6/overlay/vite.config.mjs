import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import manifestSRI from 'vite-plugin-manifest-sri';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import copy from 'rollup-plugin-copy';
import * as path from 'path';
import * as fs from 'fs';

export default defineConfig(({ command, mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const outputDir = path.resolve(process.cwd(), 'public/build');
	const sharedAssetsDir = path.resolve(outputDir, 'assets');
	const appUrl = new URL(env.APP_URL || 'http://localhost');
	const devOrigin = `${appUrl.protocol}//${appUrl.hostname}:3000`;

	return {
		logLevel: 'info',
		build: {
			minify: 'terser',
			commonjsOptions: { transformMixedEsModules: true },
			emptyOutDir: true,
			cssCodeSplit: true,
			sourcemap: true,
			terserOptions: {
				compress: { drop_console: true, drop_debugger: true },
			},
			chunkSizeWarningLimit: 1000,
			rollupOptions: {
				input: { main: path.resolve(process.cwd(), 'src/js/main.ts') },
				output: {
					entryFileNames: 'assets/js/[name]-[hash].js',
					assetFileNames: (assetInfo) => {
						const name = assetInfo.names?.[0] ?? '';
						return name.endsWith('.css') ? 'assets/css/[name]-[hash][extname]' : 'assets/[name]-[hash][extname]';
					},
					manualChunks(id) {
						if (id.includes('node_modules/alpinejs') || id.includes('node_modules/@alpinejs/collapse')) return 'vendor';
						if (id.includes('node_modules/swiper')) return 'swiper';
						if (id.includes('node_modules/mmenu-js')) return 'mmenu';
					},
				},
			},
		},
		plugins: [
			laravel({
				input: ['src/js/main.ts'],
				refresh: ['resources/views/**/*.twig', 'config/craft/**/*.php'],
			}),
			tailwindcss(),
			manifestSRI(),
			command === 'build'
				? {
						name: 'clean-assets',
						buildStart() {
							for (const directory of ['brand', 'cp', 'fonts', 'icons', 'img']) {
								fs.rmSync(path.join(sharedAssetsDir, directory), { recursive: true, force: true });
							}
						},
					}
				: null,
			copy({
				targets: ['brand', 'cp', 'fonts', 'icons', 'img'].map((directory) => ({
					src: `src/${directory}/**/*`,
					dest: sharedAssetsDir,
				})),
				hook: 'writeBundle',
				copyOnce: true,
				flatten: false,
			}),
			viteCompression({ filter: /\.(js|mjs|json|css|map)$/i }),
			visualizer({ filename: `${outputDir}/stats.html`, template: 'treemap', sourcemap: true }),
		],
		publicDir: path.resolve(process.cwd(), 'src/public'),
		resolve: {
			alias: {
				'@': path.resolve(process.cwd(), 'src'),
				'@css': path.resolve(process.cwd(), 'src/css'),
				'@js': path.resolve(process.cwd(), 'src/js'),
				'@templates': path.resolve(process.cwd(), 'resources/views'),
			},
		},
		server: {
			allowedHosts: ['localhost', '.local', '.test', '.site'],
			cors: { origin: /https?:\/\/([A-Za-z0-9\-.]+)?(localhost|\.local|\.test|\.site)(?::\d+)?$/ },
			fs: { strict: false },
			headers: { 'Access-Control-Allow-Private-Network': 'true' },
			host: '0.0.0.0',
			origin: devOrigin,
			hmr: {
				host: appUrl.hostname,
				protocol: appUrl.protocol === 'https:' ? 'wss' : 'ws',
				clientPort: 3000,
			},
			port: 3000,
			strictPort: true,
		},
	};
});
