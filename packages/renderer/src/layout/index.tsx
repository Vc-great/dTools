import { Box, useTheme } from "@mui/material";
import { useLocalStorageState } from "ahooks";

import { Suspense, useEffect } from "react";
import FallbackSuspense from "./fallback-suspense.tsx";
import Sidebar, { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from "./sidebar.tsx";
import "simplebar-react/dist/simplebar.min.css";
import { Outlet } from "@tanstack/react-router";

export default function LayoutComponent() {
	const theme = useTheme();
	const [desktopNavOpened] = useLocalStorageState<boolean>(
		"desktop-nav-opened",
		{ defaultValue: true },
	);

	// 全局键盘快捷键
	useEffect(() => {
		const handleKeyDown = (_event: KeyboardEvent) => {
			// 这里可以添加全局快捷键逻辑
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	const sidebarWidth = desktopNavOpened
		? SIDEBAR_WIDTH
		: SIDEBAR_COLLAPSED_WIDTH;

	return (
		<Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
			{/* 左侧：完整的菜单区域 */}
			<Box
				sx={{
					width: sidebarWidth,
					height: "100%",
					flexShrink: 0,
					transition: theme.transitions.create(["width"], {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.enteringScreen,
					}),
					borderRight: `1px solid ${theme.palette.divider}`,
					bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
				}}
			>
				<Sidebar />
			</Box>

			{/* 右侧：页面内容区域 */}
			<Box
				component="main"
				sx={{
					// 关键修复：使用 calc() 动态计算宽度，确保响应式调整
					width: `calc(100vw - ${sidebarWidth}px)`,
					height: "100%",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					marginTop: 0,
					bgcolor: "background.default",
					transition: theme.transitions.create(["width"], {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.enteringScreen,
					}),
				}}
			>
				{/* 页面内容区域 - 包含Header和主内容 */}
				<Box
					sx={{
						flex: 1,
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Suspense fallback={<FallbackSuspense />}>
						<Outlet />
					</Suspense>
				</Box>
			</Box>
		</Box>
	);
}
