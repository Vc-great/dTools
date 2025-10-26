import * as path from "node:path";
import { settingStore } from "@main/store/setting-store.ts";
import { fileAccess } from "@main/utils/fs";
import type {
	DefaultSettings,
	GetSettingResponseDto,
	UpdateDataPathResponseDto,
} from "@shared/types";
import { app } from "electron";
import type Store from "electron-store";
import fse from "fs-extra";

// Project Service - 处理系统配置相关的业务逻辑
export class SettingService {
	private readonly appVersion = app.getVersion();
	private readonly store: Store<DefaultSettings>;

	constructor() {
		// 初始化 electron-store
		this.store = settingStore;
	}

	/**
	 * 获取所有的配置信息
	 */
	async getSettings(): Promise<GetSettingResponseDto> {
		// electron-store 会自动处理默认值和文件创建
		const settings = this.store.store;

		return {
			dataFolderPath: settings.dataFolderPath,
			version: settings.version,
			lastModified: settings.lastModified,
		};
	}

	//修改用户业务数据存储位置
	async updateDataFolderPath(
		dataFolderPath: string,
	): Promise<UpdateDataPathResponseDto> {
		try {
			// 检查新路径的读写权限
			await fileAccess(dataFolderPath);

			// 获取当前设置
			const oldDataPath = this.store.get("dataFolderPath");

			// 更新设置
			const resolvedPath = path.resolve(dataFolderPath);
			// 移动数据目录
			if (oldDataPath !== resolvedPath) {
				fse.copySync(oldDataPath, resolvedPath, { overwrite: true });
			}

			this.store.set({
				dataFolderPath: resolvedPath,
				version: this.appVersion,
				lastModified: Date.now(),
			});

			return {
				message: "Data path updated successfully and data migrated",
				dataFolderPath: resolvedPath,
			};
		} catch (error) {
			console.error("Failed to update data path:", error);
			return Promise.reject({
				message: error instanceof Error ? error.message : "更新数据路径失败",
			});
		}
	}
}

// 导出单例实例
export const settingService = new SettingService();
