import path from "node:path";
import { settingStore } from "@main/store/setting-store.ts";
import type { FindGitAccountResponseDto } from "@shared/types";
import { app } from "electron";
import Store from "electron-store";

function initGitAccountStore() {
	const dataFolderPath =
		settingStore.get("dataFolderPath") ||
		path.join(app.getPath("userData"), "userData");

	return new Store<{ gitAccounts: FindGitAccountResponseDto }>({
		name: "gitAccounts", // 存储文件名，会自动添加 .json 后缀
		defaults: {
      gitAccounts: [],
		}, // 设置默认值
		cwd: dataFolderPath, // 存储路径
	});
}

export const gitAccountStore = initGitAccountStore();
