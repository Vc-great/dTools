import { notification } from "./notify.ts";
import { openDirectory } from "./open-directory";
export function registerIpcHandlers() {
	openDirectory();
	notification();
}
