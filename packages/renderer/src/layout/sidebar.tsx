import {
	Code,
	RocketLaunch,
	Science,
	Settings,
	ViewModule,
} from "@mui/icons-material";
import {
	alpha,
	Box,
	Divider,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	Tooltip,
	useTheme,
} from "@mui/material";
import { Link, useRouterState } from "@tanstack/react-router";
import type React from "react";

interface NavigationItem {
	path: string;
	label: string;
	icon: React.ReactNode;
	group?: string;
}

const SIDEBAR_WIDTH = 60; // 调整为仅图标宽度
const SIDEBAR_COLLAPSED_WIDTH = 60;
const SIDEBAR_HEADER_HEIGHT = 88;

export default function Sidebar() {
	const theme = useTheme();
	const routerState = useRouterState();

	const navigationItems: NavigationItem[] = [
		{
			path: "/manage/deploy",
			label: "Deploy",
			icon: <RocketLaunch />,
			group: "main",
		},
		/*		{
			path: "/manage/example",
			label: "ExampleView",
			icon: <ViewModule />,
			group: "main",
		},
		{
			path: "/manage/lazy",
			label: "Lazy Load",
			icon: <Code />,
			group: "development",
		},
		{
			path: "/manage/test",
			label: "Test Routing",
			icon: <Science />,
			group: "development",
		},*/
		{
			path: "/manage/settings",
			label: "Settings",
			icon: <Settings />,
			group: "system",
		},
	];

	const groupedItems = navigationItems.reduce(
		(acc, item) => {
			const group = item.group || "default";
			if (!acc[group]) acc[group] = [];
			acc[group].push(item);
			return acc;
		},
		{} as Record<string, NavigationItem[]>,
	);

	const isActive = (path: string) => {
		return routerState.location.pathname === path;
	};

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* 上半部分：固定高度的标题区域 */}
			<Box
				sx={{
					height: SIDEBAR_HEADER_HEIGHT,
					minHeight: SIDEBAR_HEADER_HEIGHT,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					px: 1,
					borderBottom: `1px solid ${theme.palette.divider}`,
					backgroundColor: "#f5f5f5",
				}}
			>
				{/* 应用图标 */}
				<Tooltip title="dTools" placement="right">
					<Box
						sx={{
							color: "#ff9800",
							fontWeight: "bold",
							fontSize: "1.5rem",
							cursor: "default",
						}}
					>
						&lt;/&gt;
					</Box>
				</Tooltip>
			</Box>

			{/* 下半部分：导航菜单区域 - 始终显示图标 */}
			<Box
				sx={{
					flex: 1,
					overflow: "auto",
					py: 1.5,
					display: "flex",
					flexDirection: "column",
				}}
			>
				{Object.entries(groupedItems).map(([group, items]) => (
					<Box key={group} sx={{ mb: 1 }}>
						<List sx={{ px: 0.5 }}>
							{items.map((item) => {
								const active = isActive(item.path);
								return (
									<ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
										<Tooltip title={item.label} placement="right" arrow>
											<ListItemButton
												component={Link}
												to={item.path}
												sx={{
													borderRadius: 2,
													minHeight: 48,
													minWidth: 48,
													display: "flex",
													justifyContent: "center",
													alignItems: "center",
													px: 1,
													py: 1,
													transition: "all 0.2s ease-in-out",
													...(active && {
														bgcolor: alpha(theme.palette.primary.main, 0.12),
														color: theme.palette.primary.main,
														"&:hover": {
															bgcolor: alpha(theme.palette.primary.main, 0.16),
														},
														"&::before": {
															content: '""',
															position: "absolute",
															left: 0,
															top: "50%",
															transform: "translateY(-50%)",
															width: 3,
															height: 20,
															bgcolor: theme.palette.primary.main,
															borderRadius: "0 2px 2px 0",
														},
													}),
													"&:hover": {
														bgcolor: active
															? alpha(theme.palette.primary.main, 0.16)
															: alpha(theme.palette.action.hover, 0.08),
													},
												}}
											>
												<ListItemIcon
													sx={{
														minWidth: "auto",
														justifyContent: "center",
														color: active
															? theme.palette.primary.main
															: "text.secondary",
													}}
												>
													{item.icon}
												</ListItemIcon>
											</ListItemButton>
										</Tooltip>
									</ListItem>
								);
							})}
						</List>

						{group !== "system" && <Divider sx={{ mx: 1, my: 1 }} />}
					</Box>
				))}
			</Box>
		</Box>
	);
}

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH };
