import { trpc } from "@main/utils/trpc-base";
import { createProjectRequestSchema } from "@shared/schemas/project/create-project-request.schema.ts";
import { deleteProjectRequestSchema } from "@shared/schemas/project/delete-project-request.schema.ts";
import { findProjectByIdRequestSchema } from "@shared/schemas/project/find-project-by-id-request.schema.ts";
import { updateProjectRequestSchema } from "@shared/schemas/project/update-project-request.schema.ts";
import { projectService } from "./project.service";

// 项目相关的tRPC路由
export const projectRouter = trpc.router({
	// 获取所有项目
	findAllProjects: trpc.procedure.query(async () => {
		return await projectService.findAllProjects();
	}),
	findProjectById: trpc.procedure
		.input(findProjectByIdRequestSchema)
		.query(async ({ input }) => {
			return await projectService.findProjectById(input);
		}),

	// 创建项目
	createProject: trpc.procedure
		.input(createProjectRequestSchema)
		.mutation(async ({ input }) => {
			return await projectService.createProject(input);
		}),

	// 更新项目
	updateProject: trpc.procedure
		.input(updateProjectRequestSchema)
		.mutation(async ({ input }) => {
			return await projectService.updateProject(input);
		}),

	// 删除项目
	deleteProject: trpc.procedure
		.input(deleteProjectRequestSchema)
		.mutation(async ({ input }) => {
			return await projectService.deleteProject(input);
		}),
});
