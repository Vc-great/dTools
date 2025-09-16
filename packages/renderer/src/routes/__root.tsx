import AppComponent from "@renderer/app.component.tsx";
import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: () => (
		<AppComponent>
			<Outlet />
		</AppComponent>
	),
	notFoundComponent: () => <div>页面不存在</div>,
	beforeLoad: ({ location }) => {
		// 仅当访问根路径 / 时进行重定向
		if (location.pathname === "/") {
			throw redirect({ to: "/manage/deploy" });
		}
	},
});
