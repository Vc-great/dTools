export type GetSettingResponseDto = {
	// 用户数据存储路径,默认为 Electron 应用的用户数据目录下/data文件夹
	dataFolderPath: string;
	// 应用版本号
	version: string;
	// 最后修改时间
	lastModified: number;
};
