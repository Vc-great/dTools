import z from "zod";

export const testVmConnectionSchema = z.object({
  host: z.string(),
  port: z.number(),
  username: z.string(),
  password: z.string(),
});
