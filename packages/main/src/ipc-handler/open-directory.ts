import { dialog, ipcMain } from "electron";

export function openDirectory() {
	ipcMain.handle(
		"dialog:openDirectory",
		async (event /* optional options */) => {
			return await dialog.showOpenDialog({
				title: "选择一个文件夹",
				properties: ["openDirectory"], // 只选文件夹
				// 如果需要多选: properties: ['openDirectory', 'multiSelections']
			});
		},
	);
}
