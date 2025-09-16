import { deployConfigRouter } from "@main/routes/deploy-config/deploy-config.router.ts";
import { projectRouter } from "@main/routes/project/project.router.ts";
import { settingRouter } from "@main/routes/setting/setting.router.ts";
import { virtualMachineRouter } from "@main/routes/virtual-machine/virtual-machine.router.ts";
import { trpc } from "@main/utils/trpc-base.ts";
import { gitRouter } from "./git/git.router.ts";

// 如果后续需要合并多个路由，使用以下方式：
export const appRouter = trpc.mergeRouters(
	projectRouter,
	settingRouter,
	gitRouter,
	virtualMachineRouter,
	deployConfigRouter,
);
