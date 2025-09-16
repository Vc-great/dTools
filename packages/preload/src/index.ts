import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";
import { sha256sum } from "./utils/nodeCrypto";

//import { exposeElectronTRPC } from 'trpc-electron/main';
const exposeElectronTRPC = require("trpc-electron/main").exposeElectronTRPC;

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld("electronAPI", electronAPI);
		contextBridge.exposeInMainWorld("sha256sum", sha256sum);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-expect-error (define in dts)
	window.electronAPI = electronAPI;
}

process.once("loaded", async () => {
	exposeElectronTRPC();
});
