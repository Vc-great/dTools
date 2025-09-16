import path from "node:path";
import type { DefaultSettings } from "@shared/types";
import { app } from "electron";
import Store from "electron-store";

function initSettingStore() {
	const defaultDataFolderPath = path.join(app.getPath("userData"), "userData");

	const defaultSettings: DefaultSettings = {
		dataFolderPath: defaultDataFolderPath,
		version: app.getVersion(),
		lastModified: Date.now(),
	};

	return new Store<DefaultSettings>({
		name: "settings", // 存储文件名，会自动添加 .json 后缀
		defaults: defaultSettings, // 设置默认值
		cwd: app.getPath("userData"), // 存储路径
	});
}

export const settingStore = initSettingStore();
