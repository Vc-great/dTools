import { trpc } from "@main/utils/trpc-base";
import {
	createGitAuthenticationRequestSchema,
	deleteGitAuthenticationRequestSchema,
	getGitRemoteInfoRequestSchema,
	testConnectionRequestSchema,
	updateGitAuthenticationRequestSchema,
} from "@shared/schemas";

import { gitService } from "./git.service.ts";

// 项目相关的tRPC路由
export const gitRouter = trpc.router({
	// 获取所有项目
	findAllGitAuthentications: trpc.procedure.query(async () => {
		return await gitService.findAllGitAccounts();
	}),

	// 创建项目
	createGitAuthentication: trpc.procedure
		.input(createGitAuthenticationRequestSchema)
		.mutation(async ({ input }) => {
			console.log("-> input", input);
			return await gitService.createGitAccount(input);
		}),

	// 更新项目
	updateGitAuthentication: trpc.procedure
		.input(updateGitAuthenticationRequestSchema)
		.mutation(async ({ input }) => {
			return await gitService.updateGitAuthentication(input);
		}),

	// 删除项目
	deleteGitAuthentication: trpc.procedure
		.input(deleteGitAuthenticationRequestSchema)
		.mutation(async ({ input }) => {
			return await gitService.deleteGitAccount(input);
		}),

	// 测试连接
	testConnection: trpc.procedure
		.input(testConnectionRequestSchema)
		.mutation(async ({ input }) => {
			return await gitService.testConnection(input);
		}),

	getGitRemoteInfo: trpc.procedure
		.input(getGitRemoteInfoRequestSchema)
		.query(async ({ input }) => {
			return await gitService.getRemoteInfo(input);
		}),
});
