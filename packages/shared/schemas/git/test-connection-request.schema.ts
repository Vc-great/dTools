import { AccountTypeDto } from "@shared/types";
import { z } from "zod";

export const testConnectionRequestSchema = z.object({
  repoUrl: z.url(),
  username: z.string().optional(),
  password: z.string().optional(),
  token: z.string().optional(),
  //认证类型 账号密码/sshKey
  type: z.enum(AccountTypeDto),
});
