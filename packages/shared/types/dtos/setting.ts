// 设置相关的DTO类型定义

export interface GetSettingResponseDto {
  // 用户数据存储路径
  dataFolderPath: string;
  // 应用版本
  version: string;
  // 最后修改时间
  lastModified: number;
}

export interface UpdateDataPathRequestDto {
  dataFolderPath: string;
}

export interface UpdateDataPathResponseDto {
  message: string;
  dataFolderPath: string;
}

// 默认设置配置
export interface DefaultSettings {
  dataFolderPath: string;
  version: string;
  lastModified: number;
}
