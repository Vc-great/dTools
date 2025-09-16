import type { AppInitConfig } from "@main/AppInitConfig";
import type { AppModule } from "@main/AppModule";
import type { ModuleContext } from "@main/ModuleContext";
import { BrowserWindow } from "electron";
import { chromeDevToolsExtension } from "./ChromeDevToolsExtension";

// import { createIPCHandler } from 'trpc-electron/main';
const createIPCHandler = require("trpc-electron/main").createIPCHandler;

import { appRouter } from "@main/routes";
import path from "path";

class WindowManager implements AppModule {
	readonly #preload: { path: string };
	readonly #renderer: { path: string } | URL;
	readonly #openDevTools;
	#app: Electron.App | undefined;

	constructor({
		initConfig,
		openDevTools = true,
	}: {
		initConfig: AppInitConfig;
		openDevTools?: boolean;
	}) {
		this.#preload = initConfig.preload;
		this.#renderer = initConfig.renderer;
		this.#openDevTools = openDevTools;
	}

	async enable({ app }: ModuleContext): Promise<void> {
		this.#app = app;

		// 确保在app.whenReady()之前设置命令行参数
		app.commandLine.appendSwitch(
			"disable-features",
			"Autofill,AutofillServerCommunication",
		);

		await app.whenReady();

		const window = await this.restoreOrCreateWindow(true);

		createIPCHandler({ router: appRouter, windows: [window] });

		app.on("second-instance", () => this.restoreOrCreateWindow(true));
		app.on("activate", () => this.restoreOrCreateWindow(true));
	}

	async createWindow(): Promise<BrowserWindow> {
		const browserWindow = new BrowserWindow({
			width: 1280,
			height: 720,
			minWidth: 1280,
			minHeight: 720,
			icon: path.join(__dirname, "../../resources/icon.png"),
			show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
				webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
				preload: this.#preload.path,
			},
		});

		if (this.#renderer instanceof URL) {
			await browserWindow.loadURL(this.#renderer.href);
		} else {
			await browserWindow.loadFile(this.#renderer.path);
		}

		return browserWindow;
	}

	async restoreOrCreateWindow(show = false) {
		let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
		console.log("-> process.env.NODE_ENV", process.env.NODE_ENV);
		if (process.env.NODE_ENV === "development") {
			const chromeDevTools = chromeDevToolsExtension({
				extension: "REACT_DEVELOPER_TOOLS",
			});
			await chromeDevTools.enable({ app: this.#app! });
		}

		if (window === undefined) {
			window = await this.createWindow();
		}

		if (!show) {
			return window;
		}

		if (window.isMinimized()) {
			window.restore();
		}

		window?.show();

		if (this.#openDevTools) {
			window?.webContents.openDevTools(); //{ mode: "detach" }
		}

		window.focus();

		return window;
	}
}

export function createWindowManagerModule(
	...args: ConstructorParameters<typeof WindowManager>
) {
	return new WindowManager(...args);
}
