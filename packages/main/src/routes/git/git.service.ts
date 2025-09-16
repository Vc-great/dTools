import { gitAccountStore } from "@main/store/git-account-store.ts";

import {
	AccountTypeDto,
	type CreateGitAccountRequestDto,
	type DeleteGitAccountResponseVo,
	type FindGitAccountResponseDto,
	type GetGitRemoteInfoRequestDto,
	type GitAccountEntityDto,
	type TestConnectionRequestDto,
	type UpdateGitAccountRequestDto,
} from "@shared/types";
import type { GetGitRemoteInfoResponseVo } from "@shared/types/dtos/git/get-git-remote-info-response.vo.ts";
import dayjs from "dayjs";
import { v4 as uuidV4 } from "uuid";
import { checkGitAccess } from "./utils/check-git-access.ts";
import { decrypt, encrypt } from "./utils/crypto.ts";
import { getGitRemoteInfo } from "./utils/get-remote-info.ts";

export class GitService {
	/**
	 * 获取所有项目列表
	 */
	async findAllGitAccounts(): Promise<FindGitAccountResponseDto> {
		try {
			// 解密敏感数据后返回
			return gitAccountStore.store.gitAccounts
				.map((account) => ({
					...account,
					password: "",
					token: "",
				}))
				.reverse();
		} catch (e) {
			throw e;
		}
	}

	/**
	 * 创建新项目
	 */
	async createGitAccount(
		data: CreateGitAccountRequestDto,
	): Promise<GitAccountEntityDto> {
		const newGitAccounts: GitAccountEntityDto = {
			id: uuidV4(),
			platformName: data.platformName,
			username: data.username || "",
			password: encrypt(data.password || ""),
			token: encrypt(data.token || ""),
			type: data.type,
			createdAt: dayjs().utc().toISOString(),
			updatedAt: dayjs().utc().toISOString(),
		};
		gitAccountStore.appendToArray("gitAccounts", newGitAccounts);

		// 返回解密后的数据
		return {
			...newGitAccounts,
			password: "",
			token: "",
		};
	}

	async updateGitAuthentication(
		data: UpdateGitAccountRequestDto,
	): Promise<GitAccountEntityDto> {
		const existingGitAccount = gitAccountStore.store.gitAccounts.find(
			(proj) => proj.id === data.id,
		);
		if (!existingGitAccount) {
			throw new Error(`gitAccount with id ${data.id} not found`);
		}

		const updatedGitAccount: GitAccountEntityDto = {
			id: data.id,
			platformName: data.platformName,
			username: data.username || "",
			password: encrypt(data.password || ""),
			token: encrypt(data.token || ""),
			type: data.type,
			createdAt: existingGitAccount.createdAt,
			updatedAt: dayjs().utc().toISOString(),
		};

		gitAccountStore.set(
			"gitAccounts",
			gitAccountStore.store.gitAccounts.map((proj) =>
				proj.id === data.id ? updatedGitAccount : proj,
			),
		);

		// 返回解密后的数据
		return {
			...updatedGitAccount,
			password: "",
			token: "",
		};
	}

	async deleteGitAccount({
		id,
	}: {
		id: string;
	}): Promise<DeleteGitAccountResponseVo> {
		const existingGitAuthentication = gitAccountStore.store.gitAccounts.find(
			(proj) => proj.id === id,
		);
		if (!existingGitAuthentication) {
			throw new Error(`git account with id ${id} not found`);
		}

		gitAccountStore.set(
			"gitAccounts",
			gitAccountStore.store.gitAccounts.filter((proj) => proj.id !== id),
		);

		return {
			message: "git account deleted successfully",
		};
	}

	async testConnection(data: TestConnectionRequestDto): Promise<boolean> {
		// 测试连接时需要使用原始密码/token（已经是解密状态）
		return checkGitAccess(data);
	}

	async getRemoteInfo(
		data: GetGitRemoteInfoRequestDto,
	): Promise<GetGitRemoteInfoResponseVo> {
		const account = gitAccountStore.store.gitAccounts.find(
			(acc) => acc.id === data.accountId,
		);
		if (!account) {
			throw new Error(`Git account with id ${data.accountId} not found`);
		}

		// 解密密码和token后使用
		const decryptedPassword = decrypt(account.password);
		const decryptedToken = decrypt(account.token);

		return getGitRemoteInfo(data.repoUrl, {
			onAuth() {
				return {
					username: account.username,
					password:
						account.type === AccountTypeDto.UsernameAndPassword
							? decryptedPassword
							: decryptedToken,
				};
			},
		});
	}
}

// 导出单例实例
export const gitService = new GitService();
