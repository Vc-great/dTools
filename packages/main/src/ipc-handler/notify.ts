import { Notification as ElNotification, ipcMain } from "electron";

export function notification() {
	ipcMain.handle(
		"notify",
		async (event, { title, body }: Electron.NotificationConstructorOptions) => {
			new ElNotification({ title, body }).show();
		},
	);
}
