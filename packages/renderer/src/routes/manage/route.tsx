// src/routes/route.tsx
import { createFileRoute } from "@tanstack/react-router";
import LayoutComponent from "@renderer/layout/index.tsx";

export const Route = createFileRoute("/manage")({
	component: LayoutComponent,
});
