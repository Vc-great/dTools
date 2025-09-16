import { Box, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	actions?: ReactNode;
	icon?: ReactNode;
}

export default function PageHeader({
	title,
	subtitle,
	actions,
	icon,
}: PageHeaderProps) {
	const theme = useTheme();

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				py: 1,
				px: 3,
				borderBottom: `1px solid ${theme.palette.divider}`,
				bgcolor: "background.paper",
				minHeight: 72,
			}}
		>
			{/* Left Section - Title and Icon */}
			<Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
				{icon && <Box sx={{ mr: 2, color: "primary.main" }}>{icon}</Box>}
				<Box>
					<Typography
						variant="h5"
						sx={{
							fontWeight: 600,
							color: "text.primary",
							mb: subtitle ? 0.5 : 0,
						}}
					>
						{title}
					</Typography>
					{subtitle && (
						<Typography
							variant="body2"
							sx={{
								color: "text.secondary",
							}}
						>
							{subtitle}
						</Typography>
					)}
				</Box>
			</Box>

			{/* Right Section - Custom Actions */}
			{actions && (
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{actions}
				</Box>
			)}
		</Box>
	);
}
