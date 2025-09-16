import { trpc } from "@main/utils/trpc-base";
import {
	createDeployConfigRequestSchema,
	deleteDeployConfigRequestSchema,
	executeDeployScriptRequestSchema,
	getDeployConfigByIdRequestSchema,
	getDeployScriptLogRequestSchema,
	updateDeployConfigRequestSchema,
} from "@shared/schemas";
import { z } from "zod";
import { deployConfigService } from "./deploy-config.service.ts";

// 项目相关的tRPC路由
export const deployConfigRouter = trpc.router({
	// 获取所有项目
	getDeployConfigById: trpc.procedure
		.input(getDeployConfigByIdRequestSchema)
		.query(async ({ input }) => {
			return await deployConfigService.getDeployConfigById(input);
		}),

	// 创建项目
	createDeployConfig: trpc.procedure
		.input(createDeployConfigRequestSchema)
		.mutation(async ({ input }) => {
			return await deployConfigService.createDeployConfig(input);
		}),

	// 更新项目
	updateDeployConfig: trpc.procedure
		.input(updateDeployConfigRequestSchema)
		.mutation(async ({ input }) => {
			return await deployConfigService.updateDeployConfig(input);
		}),

	// 删除项目
	deleteDeployConfig: trpc.procedure
		.input(deleteDeployConfigRequestSchema)
		.mutation(async ({ input }) => {
			return await deployConfigService.deleteDeployConfig(input);
		}),

	executeDeployScript: trpc.procedure
		.input(executeDeployScriptRequestSchema)
		.mutation(async ({ input }) => {
			return await deployConfigService.executeDeployScript(input);
		}),

	getDeployScriptLog: trpc.procedure
		.input(getDeployScriptLogRequestSchema)
		.query(async ({ input }) => {
			return await deployConfigService.getDeployScriptLog(input);
		}),

  stopDeploy: trpc.procedure
    .input(z.uuid())
    .mutation(async ({ input }) => {
      return await deployConfigService.stopDeploy(input);
    }),
});
