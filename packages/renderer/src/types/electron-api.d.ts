declare global {
	interface Window {
		electronAPI: typeof import("@electron-toolkit/preload").electronAPI;
		sha256sum: (data: string) => Promise<string>;
	}
}

export {};
