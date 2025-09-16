export async function openDirectory(): Promise<Electron.OpenDialogReturnValue> {
	return await window.electronAPI.ipcRenderer.invoke("dialog:openDirectory");
}
