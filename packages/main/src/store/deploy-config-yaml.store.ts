import path from "node:path";
import { settingStore } from "@main/store/setting-store.ts";
import type {
	CreateDeployConfigRequestDto,
	GetDeployConfigResponseVo,
	UpdateDeployConfigRequestDto,
} from "@shared/types";
import { app } from "electron";
import { readFile } from "fs/promises";
import fse from "fs-extra";
import * as yaml from "js-yaml";

class DeployConfigYamlStore {
	private dataFolderPath =
		settingStore.get("dataFolderPath") ||
		path.join(app.getPath("userData"), "userData");

	/**
	 * 获取文件路径
	 */
	private getFilePath(id: string): string {
		return path.join(this.dataFolderPath, "deployConfig", `${id}.yaml`);
	}

	/**
	 * 读取部署配置 YAML 文件
	 */
	async getDeployConfigYaml(id: string): Promise<GetDeployConfigResponseVo> {
		try {
			const filePath = this.getFilePath(id);

			const fileContent = await readFile(filePath, "utf8");
			const data = yaml.load(fileContent) as GetDeployConfigResponseVo;

			return data;
		} catch (error) {
			throw new Error(
				`读取部署配置失败: ${error instanceof Error ? error.message : "未知错误"}`,
			);
		}
	}

	/**
	 * 创建部署配置 YAML 文件
	 */
	async createDeployConfigYaml(
		id: string,
		data: CreateDeployConfigRequestDto,
	): Promise<void> {
		try {
			const filePath = this.getFilePath(id);

			// 将数据转换为 YAML 格式
			const yamlContent = yaml.dump(data, {
				indent: 2,
				lineWidth: -1,
				noRefs: true,
				sortKeys: true,
			});

			await fse.outputFile(filePath, yamlContent, "utf8");
		} catch (error) {
			throw new Error(
				`创建部署配置失败: ${error instanceof Error ? error.message : "未知错误"}`,
			);
		}
	}

	/**
	 * 更新部署配置 YAML 文件
	 */
	async updateDeployConfigYaml(
		id: string,
		data: UpdateDeployConfigRequestDto,
	): Promise<void> {
		try {
			const filePath = this.getFilePath(id);

			// 读取原有文件内容（用于备份或日志）
			const existingContent = await readFile(filePath, "utf8");
			if (!existingContent) {
				throw new Error(`部署配置文件 ${id} 不存在`);
			}

			// 将新数据转换为 YAML 格式
			const yamlContent = yaml.dump(data, {
				indent: 2,
				lineWidth: -1,
				noRefs: true,
				sortKeys: true,
			});

			// 覆盖保存文件
			await fse.outputFile(filePath, yamlContent, "utf8");
		} catch (error) {
			throw new Error(
				`更新部署配置失败: ${error instanceof Error ? error.message : "未知错误"}`,
			);
		}
	}

	/**
	 * 删除部署配置 YAML 文件
	 */
	async deleteDeployConfigYaml(id: string): Promise<void> {
		try {
			const filePath = this.getFilePath(id);

			await fse.unlink(filePath);
		} catch (error) {
			throw new Error(
				`删除部署配置失败: ${error instanceof Error ? error.message : "未知错误"}`,
			);
		}
	}
}

export const deployConfigYamlStore = new DeployConfigYamlStore();
