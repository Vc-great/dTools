import { createMemoryHistory, createRouter } from "@tanstack/react-router";

import { routeTree } from "../routeTree.gen.ts";

const memoryHistory = createMemoryHistory({
	initialEntries: ["/"],
});

export const router = createRouter({
	routeTree: routeTree,
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
	history: memoryHistory,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
