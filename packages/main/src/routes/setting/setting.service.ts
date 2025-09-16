import type {
  GetSettingResponseDto,
  UpdateDataPathResponseDto,
  DefaultSettings,
} from "@shared/types";
import { app }  from "electron";
import * as path from "path";
import { fileAccess } from "@main/utils/fs";
import fse from "fs-extra";
import Store from 'electron-store';
import { settingStore } from "@main/store/setting-store.ts";


// Project Service - 处理系统配置相关的业务逻辑
export class SettingService {
  private readonly appVersion = app.getVersion();
  private readonly store: Store<DefaultSettings>;

  constructor() {
    // 初始化 electron-store
    this.store = settingStore
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
  async updateDataFolderPath(dataFolderPath: string): Promise<UpdateDataPathResponseDto> {
    try {
      // 检查新路径的读写权限
      await fileAccess(dataFolderPath);

      // 获取当前设置
      const oldDataPath = this.store.get('dataFolderPath');

      // 更新设置
      const resolvedPath = path.resolve(dataFolderPath);
      this.store.set({
        dataFolderPath: resolvedPath,
        version: this.appVersion,
        lastModified: Date.now(),
      });

      // 移动数据目录
      if (oldDataPath !== resolvedPath) {
        fse.moveSync(oldDataPath, resolvedPath);
      }

      return {
        message: "数据路径更新成功",
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
