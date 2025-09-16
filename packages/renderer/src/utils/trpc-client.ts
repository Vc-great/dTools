import type { AppRouter } from "@main/types";
import { createTRPCClient } from "@trpc/client";
import { ipcLink } from "trpc-electron/renderer";
import { errorInterceptorLink } from "./error-interceptor-link";

export const trpcClient = createTRPCClient<AppRouter>({
	links: [errorInterceptorLink(), ipcLink()],
});
