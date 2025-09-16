import path from "node:path";
import type { AppInitConfig } from "./AppInitConfig.js";
import { registerIpcHandlers } from "./ipc-handler/index.js";
import { createModuleRunner } from "./ModuleRunner.js";
import { terminateAppOnLastWindowClose } from "./modules/ApplicationTerminatorOnLastWindowClose.js";
import { autoUpdater } from "./modules/AutoUpdater.js";
import { allowInternalOrigins } from "./modules/BlockNotAllowdOrigins.js";
import { allowExternalUrls } from "./modules/ExternalUrls.js";
import { hardwareAccelerationMode } from "./modules/HardwareAccelerationModule.js";
import { disallowMultipleAppInstance } from "./modules/SingleInstanceApp.js";
import { createWindowManagerModule } from "./modules/WindowManager.js";
import "@shared/utils/dayjs-setup.js";
export async function initApp(initConfig: AppInitConfig) {
	const moduleRunner = createModuleRunner()
		.init(
			createWindowManagerModule({
				initConfig,
				openDevTools: import.meta.env.DEV,
			}),
		)
		.init(disallowMultipleAppInstance())
		.init(terminateAppOnLastWindowClose())
		.init(hardwareAccelerationMode({ enable: false }))
		.init(autoUpdater())

		// Install DevTools extension if needed
		// .init(chromeDevToolsExtension({extension: 'VUEJS3_DEVTOOLS'}))

		// Security
		.init(
			allowInternalOrigins(
				new Set(
					initConfig.renderer instanceof URL
						? [initConfig.renderer.origin]
						: [],
				),
			),
		)
		.init(
			allowExternalUrls(
				new Set(
					initConfig.renderer instanceof URL
						? [
								"https://vite.dev",
								"https://developer.mozilla.org",
								"https://solidjs.com",
								"https://qwik.dev",
								"https://lit.dev",
								"https://react.dev",
								"https://preactjs.com",
								"https://www.typescriptlang.org",
								"https://vuejs.org",
							]
						: [],
				),
			),
		);

	registerIpcHandlers();

	await moduleRunner;
}

initApp({
	renderer:
		process.env.NODE_ENV === "development" &&
		!!process.env.ELECTRON_RENDERER_URL
			? new URL(process.env.ELECTRON_RENDERER_URL)
			: {
					path: path.join(__dirname, "../renderer/index.html"),
				},
	preload: {
		path: path.join(__dirname, "../preload/index.mjs"),
	},
});
