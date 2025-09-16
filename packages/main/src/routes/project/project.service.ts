import { deployConfigService } from "@main/routes/deploy-config/deploy-config.service.ts";
import { buildTree } from "@main/routes/project/build-tree.ts";
import { projectStore } from "@main/store/project-store.ts";
import type {
	CreateProjectRequestDto,
	FindProjectByIdResponseDto,
	FindProjectResponseDto,
	ProjectDeployConfigDto,
	ProjectResponseDto,
	UpdateProjectRequestDto,
} from "@shared/types";
import type { DeleteProjectResponseVo } from "@shared/types/dtos/project/delete-project-response.vo.ts";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

// Project Service - 处理项目相关的业务逻辑
export class ProjectService {
	/**
	 * 获取所有项目列表
	 */
	async findAllProjects(): Promise<FindProjectResponseDto> {
		try {
			return projectStore.store.projects.reverse();
		} catch (e) {
			throw e;
		}
	}

	async getProjectTree(): Promise<FindProjectResponseDto> {
		try {
			return buildTree(projectStore.store.projects);
		} catch (e) {
			throw e;
		}
	}

	async findProjectById({
		id,
	}: {
		id: string;
	}): Promise<FindProjectByIdResponseDto> {
		try {
			const project = projectStore.store.projects.find(
				(proj) => proj.id === id,
			);
			if (!project) {
				throw new Error(`Project with id ${id} not found`);
			}

			return project;
		} catch (e) {
			throw e;
		}
	}

	/**
	 * 创建新项目
	 */
	async createProject(
		data: CreateProjectRequestDto,
	): Promise<ProjectResponseDto> {
		const newProject: ProjectResponseDto = {
			id: uuidv4(),
			name: data.name,
			type: data.type,
			parentId: data.parentId || "",
			deployConfigs: [],
			createdAt: dayjs().utc().toISOString(),
			updatedAt: dayjs().utc().toISOString(),
		};
		projectStore.appendToArray("projects", newProject);
		return newProject;
	}

	async updateProject(
		data: UpdateProjectRequestDto,
	): Promise<ProjectResponseDto> {
		const existingProject = projectStore.store.projects.find(
			(proj) => proj.id === data.id,
		);
		if (!existingProject) {
			throw new Error(`Project with id ${data.id} not found`);
		}

		const updatedProject: ProjectResponseDto = {
			...data,
			deployConfigs: existingProject.deployConfigs || [],
			createdAt: existingProject.createdAt, // 保持原始创建时间
			updatedAt: dayjs().utc().toISOString(),
		};

		projectStore.set(
			"projects",
			projectStore.store.projects.map((proj) =>
				proj.id === data.id ? updatedProject : proj,
			),
		);

		return updatedProject;
	}

	// 关联部署配置到项目
	async linkDeployConfigToProject(
		projectId: string,
		deployConfig: ProjectDeployConfigDto,
	): Promise<ProjectResponseDto> {
		const existingProject = projectStore.store.projects.find(
			(proj) => proj.id === projectId,
		);
		if (!existingProject) {
			throw new Error(`Project with id ${projectId} not found`);
		}

		const updatedProject: ProjectResponseDto = {
			...existingProject,
			deployConfigs: [...existingProject.deployConfigs, deployConfig],
			updatedAt: dayjs().utc().toISOString(),
		};

		projectStore.set(
			"projects",
			projectStore.store.projects.map((proj) =>
				proj.id === projectId ? updatedProject : proj,
			),
		);

		return updatedProject;
	}

	// 解除部署配置与项目的关联
	async unlinkDeployConfigToProject(
		deployConfigId: string,
	): Promise<ProjectResponseDto> {
		const existingProject = projectStore.store.projects.find((proj) => proj.deployConfigs.some((deploy) => deploy.deployConfigId === deployConfigId);
		);

		if (!existingProject) {
			throw new Error(`deployConfigId link Project with  not found`);
		}

		const updatedProject: ProjectResponseDto = {
			...existingProject,
			deployConfigs: [...existingProject.deployConfigs].filter(
				(item) => item.deployConfigId !== deployConfigId,
			),
			updatedAt: dayjs().utc().toISOString(),
		};

		projectStore.set(
			"projects",
			projectStore.store.projects.map((proj) =>
				proj.id === existingProject.id ? updatedProject : proj,
			),
		);

		return updatedProject;
	}

	async deleteProject({
		id,
	}: {
		id: string;
	}): Promise<DeleteProjectResponseVo> {
		const existingProject = projectStore.store.projects.find(
			(proj) => proj.id === id,
		);
		if (!existingProject) {
			throw new Error(`Project with id ${id} not found`);
		}

		//删除deployConfig关联
		for (const deployConfig of existingProject.deployConfigs) {
			await deployConfigService.deleteDeployConfig({
				id: deployConfig.deployConfigId,
			});
		}

		projectStore.set(
			"projects",
			projectStore.store.projects
				.filter((proj) => proj.id !== id)
				.filter((proj) => proj.parentId !== id),
		);

		return {
			message: "Project deleted successfully",
		};
	}
}

// 导出单例实例
export const projectService = new ProjectService();
