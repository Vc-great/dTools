import { DeploymentPipeline } from "@main/routes/deploy-config/utils/deployment-pipeline.ts";
import { logger } from "@main/routes/deploy-config/utils/script-log.ts";
import { decrypt } from "@main/routes/git/utils/crypto.ts";
import { projectService } from "@main/routes/project/project.service.ts";
import { deployConfigYamlStore } from "@main/store/deploy-config-yaml.store.ts";
import { gitAccountStore } from "@main/store/git-account-store.ts";
import { projectStore } from "@main/store/project-store.ts";
import { virtualMachineStore } from "@main/store/virtual-machine-store.ts";
import type {
	CreateDeployConfigRequestDto,
	DeleteProjectResponseVo,
	DeployConfigEntityDto,
	GetDeployConfigByIdRequestDto,
	GetDeployConfigResponseVo,
	GetDeployScriptLogRequestDto,
	GetDeployScriptLogResponseVo,
	UpdateDeployConfigRequestDto,
} from "@shared/types";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

const deployTaskMap = new Map<string, DeploymentPipeline>();

// Project Service - 处理项目相关的业务逻辑
export class DeployConfigService {
	/**
	 * 获取所有项目列表
	 */
	async getDeployConfigById({
		id,
	}: GetDeployConfigByIdRequestDto): Promise<GetDeployConfigResponseVo> {
		try {
			const data = await deployConfigYamlStore.getDeployConfigYaml(id);

			return {
				...data,
				gitAccount: gitAccountStore.store.gitAccounts.find(
					(git) => git.id === data.gitAccountId,
				),
				vmAccount: virtualMachineStore.store.virtualMachines.find(
					(vm) => vm.id === data.vmAccountId,
				),
			};
		} catch (e) {
			throw e;
		}
	}

	/**
	 * 创建新配置
	 */
	async createDeployConfig(
		data: CreateDeployConfigRequestDto,
	): Promise<DeployConfigEntityDto> {
		const newDeployConfig: DeployConfigEntityDto = {
			id: uuidv4(),
			...data,
			createdAt: dayjs().utc().toISOString(),
			updatedAt: dayjs().utc().toISOString(),
		};

		await deployConfigYamlStore.createDeployConfigYaml(
			newDeployConfig.id,
			newDeployConfig,
		);

		await projectService.linkDeployConfigToProject(newDeployConfig.projectId, {
			deployConfigId: newDeployConfig.id,
			deployConfigName: newDeployConfig.name,
		});
		return newDeployConfig;
	}

	async updateDeployConfig(
		data: UpdateDeployConfigRequestDto,
	): Promise<DeployConfigEntityDto> {
		const existingDeployConfig =
			await deployConfigYamlStore.getDeployConfigYaml(data.id);

		const updatedDeployConfig: DeployConfigEntityDto = {
			...data,
			createdAt: existingDeployConfig.createdAt, // 保持原始创建时间
			updatedAt: dayjs().utc().toISOString(),
		};

		await deployConfigYamlStore.updateDeployConfigYaml(
			updatedDeployConfig.id,
			updatedDeployConfig,
		);

		return updatedDeployConfig;
	}

	async deleteDeployConfig({
		id,
	}: {
		id: string;
	}): Promise<DeleteProjectResponseVo> {
		await deployConfigYamlStore.deleteDeployConfigYaml(id);

		await projectService.unlinkDeployConfigToProject(id);

		return {
			message: "deployConfig deleted successfully",
		};
	}

	async executeDeployScript({
		deployConfigId,
	}: {
		deployConfigId: string;
	}): Promise<{ message: string }> {
		const deployConfig =
			await deployConfigYamlStore.getDeployConfigYaml(deployConfigId);

		const project = projectStore.store.projects.find(
			(p) => p.id === deployConfig.projectId,
		);
		if (!project) {
			throw new Error(`Project with id ${deployConfig.projectId} not found`);
		}

		const gitAccount = gitAccountStore.store.gitAccounts.find(
			(git) => git.id === deployConfig.gitAccountId,
		);
		if (!gitAccount) {
			throw new Error(
				`Git account with id ${deployConfig.gitAccountId} not found`,
			);
		}

		// 解密git账户的密码和token
		const decryptedGitAccount = {
			...gitAccount,
			password: decrypt(gitAccount.password),
			token: decrypt(gitAccount.token),
		};

		const vmAccount = virtualMachineStore.store.virtualMachines.find(
			(vm) => vm.id === deployConfig.vmAccountId,
		);
		if (!vmAccount) {
			throw new Error(
				`VM account with id ${deployConfig.vmAccountId} not found`,
			);
		}

		// 解密虚拟机密码
		const decryptedVmAccount = {
			...vmAccount,
			password: decrypt(vmAccount.password),
		};

		const deployTask = new DeploymentPipeline({
			deployConfig,
			gitAccount: decryptedGitAccount,
			project,
			vmAccount: decryptedVmAccount,
		});

		deployTask.run();

		deployTaskMap.set(deployConfig.id, deployTask);

		return {
			message: "Deploy script started",
		};
	}

	async getDeployScriptLog({
		deployConfigId,
	}: GetDeployScriptLogRequestDto): Promise<GetDeployScriptLogResponseVo> {
		return logger.getLogs(deployConfigId);
	}

	async stopDeploy(deployConfigId: string): Promise<{ message: string }> {
		const deployTask = deployTaskMap.get(deployConfigId);
		if (!deployTask) {
			throw new Error(`Deploy task with id ${deployConfigId} not found`);
		}
		deployTask.stopDeploy();
		deployTaskMap.delete(deployConfigId);
		return { message: "Deploy stopped successfully" };
	}
}

// 导出单例实例
export const deployConfigService = new DeployConfigService();
