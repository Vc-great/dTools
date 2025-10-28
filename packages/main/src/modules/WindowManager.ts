import path from "node:path";
import type { AppInitConfig } from "@main/AppInitConfig";
import type { AppModule } from "@main/AppModule";
import type { ModuleContext } from "@main/ModuleContext";
import {
	app,
	BrowserWindow,
	Tray as ElectronTray,
	app as electronApp,
	Menu,
	nativeImage,
} from "electron";
import { chromeDevToolsExtension } from "./ChromeDevToolsExtension";

const createIPCHandler = require("trpc-electron/main").createIPCHandler;

import { appRouter } from "@main/routes";
import { isMac, isWindows } from "@main/utils/is-platform.ts";

/**
 * WindowManager
 * - 管理主窗口的创建/恢复
 * - 管理系统托盘（Tray）
 * - 点击窗口关闭按钮时将窗口隐藏到托盘（非退出）
 *
 * 设计考量：
 * - 将具体行为拆成小方法，便于维护与单测
 * - 在退出流程中保证托盘被销毁，防止图标残留
 */
class WindowManager implements AppModule {
	readonly #preload: { path: string };
	readonly #renderer: { path: string } | URL;
	readonly #openDevTools: boolean;

	#app: Electron.App | undefined;
	#tray: ElectronTray | null = null;
	isQuiting = false;

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

	/**
	 * 启用模块（由外部 ModuleContext 调用）
	 */
	async enable({ app }: ModuleContext): Promise<void> {
		this.#app = app;

		// 确保在 app.whenReady() 之前设置命令行参数（你原来有的配置）
		app.commandLine.appendSwitch(
			"disable-features",
			"Autofill,AutofillServerCommunication",
		);

		await app.whenReady();
		// 创建托盘（单例）
		this.createTray();
		this.setAppIcons();

		// 创建或恢复窗口
		const window = await this.restoreOrCreateWindow(true);

		// 建立 IPC handler（trpc-electron）
		createIPCHandler({ router: appRouter, windows: [window] });

		// 应用层面事件
		app.on("second-instance", () => this.restoreOrCreateWindow(true));
		app.on("activate", () => this.restoreOrCreateWindow(true));

		// 当用户通过菜单/快捷键选择退出时，确保托盘被销毁
		app.on("before-quit", () => {
			this.isQuiting = true;
			this.destroyTray();
		});
	}

	setAppIcons() {
		const iconPath = path.resolve(
			process.cwd(),
			"resources/icons/png",
			"icon.png",
		);
		if (!iconPath) return;

		try {
			const img = nativeImage.createFromPath(iconPath);
			if (img.isEmpty()) return;
			if (isMac() && app.dock && typeof app.dock.setIcon === "function") {
				app.dock.setIcon(img);
			}
		} catch (e) {
			console.warn("无法设置应用图标:", e);
		}
	}

	/**
	 * 创建 BrowserWindow 并附加必要的事件监听器
	 */
	async createWindow(): Promise<BrowserWindow> {
		const browserWindow = new BrowserWindow({
			width: 1280,
			height: 720,
			minWidth: 1280,
			minHeight: 720,
			icon: isWindows()
				? path.resolve(process.cwd(), "resources/icons/win", "icon.ico")
				: "",
			show: false, // 在 ready-to-show 时由 restoreOrCreateWindow 控制显示
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				sandbox: false,
				webviewTag: false,
				preload: this.#preload.path,
			},
		});

		// 加载渲染层（URL 或 本地文件）
		if (this.#renderer instanceof URL) {
			await browserWindow.loadURL(this.#renderer.href);
		} else {
			await browserWindow.loadFile(this.#renderer.path);
		}

		// 附加窗口事件（close -> 隐藏到托盘）
		this.attachWindowListeners(browserWindow);

		// ready-to-show：只有在需要的情况下才 show（restoreOrCreateWindow 会控制）
		browserWindow.once("ready-to-show", () => {
			// 如果窗口原本就应该显示（例如创建时立即调用了 restoreOrCreateWindow(true)），上层会调用 show()
			// 这里仅在窗口可见性错乱时确保不会一直隐藏。
			// 不在此直接 show，以避免与 restoreOrCreateWindow 的显示逻辑重复。
		});

		return browserWindow;
	}

	/**
	 * 恢复或创建窗口
	 * @param show 是否在恢复后显示窗口（默认 false）
	 */
	async restoreOrCreateWindow(show = false): Promise<BrowserWindow> {
		let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

		// 开发环境加载 React DevTools 扩展（保持你原来的逻辑）
		if (process.env.NODE_ENV === "development") {
			const chromeDevTools = chromeDevToolsExtension({
				extension: "REACT_DEVELOPER_TOOLS",
			});
			await chromeDevTools.enable({ app: this.#app! });
		}

		// 若不存在窗口则创建
		if (window === undefined) {
			window = await this.createWindow();
		}

		if (!show) {
			return window;
		}

		// 恢复逻辑：最小化 -> restore，隐藏 -> show
		if (window.isMinimized()) {
			window.restore();
		}

		// 如果窗口被 hide（因为我们拦截了 close），需要 show 出来
		if (!window.isVisible()) {
			if (isMac() && app.dock) {
				app.dock.show();
			}
			window.show();
		} else {
			// 如果已经可见，确保获得焦点
			window.focus();
		}

		// 打开 devtools（可配置）
		if (this.#openDevTools && process.env.NODE_ENV === "development") {
			window.webContents.openDevTools();
		}

		return window;
	}

	/**
	 * 将 close 行为拦截成隐藏到托盘（除非 isQuiting 为 true）
	 */
	private attachWindowListeners(win: BrowserWindow): void {
		// 先移除可能重复的监听器，防止多次 attach（热重载场景）
		win.removeAllListeners("close");

		win.on("close", (e) => {
			// 如果应用正在退出（例如用户通过菜单/托盘选择退出），不要阻止
			if (this.isQuiting) {
				return;
			}

			// 拦截 close，隐藏窗口到托盘
			e.preventDefault();
			// hide 会从任务栏中移除窗口（比 minimize 更干净）
			try {
				win.hide();
				if (isMac() && app.dock) {
					app.dock.hide();
				}
			} catch (err) {
				// 如果 hide 失败，尝试最小化
				try {
					win.minimize();
				} catch {
					// swallow
				}
			}
		});

		// 当窗口被销毁时，确保托盘仍存在（托盘与窗口独立），但如果所有窗口都销毁且用户意图退出，则注销托盘
		win.on("closed", () => {
			// 保持 tray 存在，直到用户选择退出或 app 退出（由 before-quit 清理）
		});
	}

	/**
	 * 创建托盘（如果尚未创建）
	 */
	private createTray(): void {
		if (this.#tray) return; // 单例托盘

		const trayImage = nativeImage
			.createFromPath(
				path.resolve(process.cwd(), "resources/icons/mac", "trayTemplate.png"),
			)
			.resize({
				width: 16,
				height: 16,
			});

		if (isMac()) {
			//trayImage.setTemplateImage(true);
		}

		this.#tray = new ElectronTray(
			isMac()
				? trayImage
				: path.resolve(process.cwd(), "resources/icons/win", "icon.ico"),
		);

		const contextMenu = Menu.buildFromTemplate([
			/*			{
        label: "显示应用",
        click: async () => {
          try {
            await this.restoreOrCreateWindow(true);
          } catch {
            /!* ignore *!/
          }
        },
      },*/
			/*			{
        label: "隐藏应用",
        click: () => {
          const w = BrowserWindow.getAllWindows().find((x) => !x.isDestroyed());
          if (w && w.isVisible()) w.hide();
        },
      },*/
			{ type: "separator" },
			{
				label: "退出",
				click: () => {
					// 标记为用户真正的退出意图，并退出应用
					this.isQuiting = true;
					this.destroyTray();
					// 使用传入的 app（如果可用），否则使用 electron.app
					(this.#app ?? electronApp).quit();
				},
			},
		]);

		this.#tray.setContextMenu(contextMenu);
		this.#tray.setToolTip("dTools");

		// 单击切换显示/隐藏（常见交互）
		this.#tray.on("click", async () => {
			const w = BrowserWindow.getAllWindows().find((x) => !x.isDestroyed());
			if (!w) {
				await this.restoreOrCreateWindow(true);
				return;
			}
			if (w.isVisible()) {
				w.hide();
			} else {
				await this.restoreOrCreateWindow(true);
			}
		});

		// 双击通常也打开窗口
		this.#tray.on("double-click", async () => {
			await this.restoreOrCreateWindow(true);
		});
	}

	/**
	 * 销毁托盘（退出前调用）
	 */
	private destroyTray(): void {
		if (!this.#tray) return;
		try {
			this.#tray.destroy();
		} catch {
			// ignore destroy errors
		} finally {
			this.#tray = null;
		}
	}
}

export function createWindowManagerModule(
	...args: ConstructorParameters<typeof WindowManager>
) {
	return new WindowManager(...args);
}
