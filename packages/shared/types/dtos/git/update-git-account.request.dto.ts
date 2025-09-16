import type { AccountTypeDto } from "@shared/types/dtos/git/account-type.dto.ts";

export type UpdateGitAccountRequestDto = {
	id: string;
	platformName: string;
	username?: string;
	password?: string;
	token?: string;
	//认证类型 账号密码/sshKey
	type: AccountTypeDto;
};
