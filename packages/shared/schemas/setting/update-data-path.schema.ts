import { z } from "zod";

export const updateDataPathSchema = z.object({
  dataFolderPath: z.string(),
});
