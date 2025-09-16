import path, { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({
	main: {
		build: {
			lib: {
				entry: resolve(__dirname, "./packages/main/src/index.ts"),
			},
			rollupOptions: {
				external: [
					// 按需外部化 ssh2 / cpu-features（也可以用正则）
					"ssh2",
					"cpu-features",
				],
			},
		},
		ssr: {
			noExternal: false, // 或根据需要调整
		},
		plugins: [externalizeDepsPlugin(), tsconfigPaths()],
	},
	preload: {
		build: {
			lib: {
				entry: resolve(__dirname, "./packages/preload/src/index.ts"),
			},
		},
		plugins: [externalizeDepsPlugin(), tsconfigPaths()],
	},
	renderer: {
		root: resolve(__dirname, "./packages/renderer"),
		build: {
			rollupOptions: {
				input: resolve(__dirname, "./packages/renderer/index.html"),
			},
		},
		resolve: {
			alias: {
				"@renderer": resolve(__dirname, "./packages/renderer/src"),
				"@shared": resolve(__dirname, "./packages/shared"),
			},
		},
		css: {
			modules: { localsConvention: "camelCaseOnly", scopeBehaviour: "local" },
			preprocessorOptions: {
				scss: {
					// 自动把 alias 传给 sass
					// includePaths: [path.join(__dirname, "./renderer/src")],
					additionalData: `
        @use "@renderer/styles/_variables.scss" as *;
        `,
				},
			},
		},
		plugins: [
			tsconfigPaths(),
			// Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
			tanstackRouter({
				target: "react",
				autoCodeSplitting: true,
				routesDirectory: path.join(__dirname, "./packages/renderer/src/routes"),
				generatedRouteTree: path.join(
					__dirname,
					"./packages/renderer/src/routeTree.gen.ts",
				),
				routeFileIgnorePattern: "\\.ts$",
			}),
			react(),
		],
	},
	assetsInclude: ["resources/**/*"],
});
