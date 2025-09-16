import path from "node:path";
import { settingStore } from "@main/store/setting-store.ts";
import type { FindAllVirtualMachinesResponseDto } from "@shared/types/dtos/virtual-machine";
import { app } from "electron";
import Store from "electron-store";

function initVirtualMachineStore() {
	const dataFolderPath =
		settingStore.get("dataFolderPath") ||
		path.join(app.getPath("userData"), "userData");

	return new Store<{ virtualMachines: FindAllVirtualMachinesResponseDto }>({
		name: "virtualMachines", // 存储文件名，会自动添加 .json 后缀
		defaults: {
			virtualMachines: [],
		}, // 设置默认值
		cwd: dataFolderPath, // 存储路径
	});
}

export const virtualMachineStore = initVirtualMachineStore();
