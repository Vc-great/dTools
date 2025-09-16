import { AccountTypeDto } from "@shared/types";
import { z } from "zod";
//
export const createGitAuthenticationRequestSchema = z.object({
  platformName: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  token: z.string().optional(),
  //认证类型 账号密码/sshKey
  type: z.enum(AccountTypeDto),
});
