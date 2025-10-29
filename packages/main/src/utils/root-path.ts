import { app } from "electron";

export const rootPath = app.isPackaged ? process.resourcesPath : process.cwd();
