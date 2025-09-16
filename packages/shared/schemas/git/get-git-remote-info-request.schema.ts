import z from "zod";

export const getGitRemoteInfoRequestSchema = z.object({
	repoUrl: z.url(),
	accountId: z.string(),
});
