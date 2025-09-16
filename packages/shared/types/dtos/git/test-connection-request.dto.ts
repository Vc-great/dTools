import type { AccountTypeDto } from "@shared/types";

export type TestConnectionRequestDto = {
	repoUrl: string;
	username?: string;
	password?: string;
	token?: string;
	//认证类型 账号密码/sshKey
	type: AccountTypeDto;
};
