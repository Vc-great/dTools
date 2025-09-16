import { ContentCopy } from "@mui/icons-material";
import {
	Box,
	Card,
	CardContent,
	CircularProgress,
	IconButton,
	Snackbar,
	Tooltip,
	Typography,
} from "@mui/material";
import type { DeployStatusEnum } from "@shared/types";
import React, { useEffect, useMemo, useRef } from "react";
import SimpleBar from "simplebar-react";

type DeployLogViewerProps = {
	deployScriptLog: string;
	deployStatus: DeployStatusEnum;
};

export const DeployLogViewer: React.FC<DeployLogViewerProps> = ({
	deployScriptLog,
	deployStatus,
}) => {
	const logsEndRef = useRef<HTMLDivElement>(null);
	const [showCopySuccess, setShowCopySuccess] = React.useState(false);

	// 解析日志行
	const logLines = useMemo(() => {
		if (!deployScriptLog) return [];
		return deployScriptLog.split("\n").filter((line) => line);
	}, [deployScriptLog]);

	const handleCopyLogs = async () => {
		try {
			await navigator.clipboard.writeText(deployScriptLog);
			setShowCopySuccess(true);
		} catch (error) {
			console.error("Failed to copy logs:", error);
		}
	};

	// 根据日志内容判断类型和样式
	const getLogStyle = (line: string) => {
		const lowerLine = line.toLowerCase();
		if (lowerLine.includes("error") || lowerLine.includes("failed")) {
			return { color: "#f44336", fontWeight: 500 };
		}
		if (lowerLine.includes("warning") || lowerLine.includes("warn")) {
			return { color: "#ff9800", fontWeight: 500 };
		}
		if (lowerLine.includes("success") || lowerLine.includes("complete")) {
			return { color: "#4caf50", fontWeight: 500 };
		}
		return { color: "#e0e0e0" };
	};

	return (
		<Card>
			<CardContent
				sx={{
					height: "100%",
				}}
			>
				<Box
					sx={{
						height: "100%",
						display: "flex",
						flexDirection: "column",
					}}
				>
					{/* Header */}
					<Box
						sx={{
							height: "100%",
							py: 2,
							borderBottom: 1,
							borderColor: "divider",
							display: "flex",
							alignItems: "center",
							bgcolor: "background.paper",
						}}
					>
						<Typography variant="h6" sx={{ flexGrow: 1 }}>
							{"Deploy Logs"}
						</Typography>

						{/* Deploy Status Display */}
						{deployStatus === "running" && (
							<Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
								<CircularProgress size={20} sx={{ mr: 1 }} />
								<Typography variant="body2" sx={{ color: "text.secondary" }}>
									Running...
								</Typography>
							</Box>
						)}
						{deployStatus === "success" && (
							<Typography
								variant="body2"
								sx={{ color: "#4caf50", fontWeight: 500, mr: 2 }}
							>
								✓ Deploy Success
							</Typography>
						)}
						{deployStatus === "error" && (
							<Typography
								variant="body2"
								sx={{ color: "#f44336", fontWeight: 500, mr: 2 }}
							>
								✗ Deploy Failed
							</Typography>
						)}

						<Tooltip title={"Copy Logs"}>
							<IconButton onClick={handleCopyLogs} size="small">
								<ContentCopy />
							</IconButton>
						</Tooltip>
					</Box>

					{/* Logs Container */}
					<Box sx={{ flex: 1, overflow: "hidden", position: "relative" }}>
						<SimpleBar style={{ height: "100%" }}>
							<Box sx={{ p: 2, bgcolor: "#1e1e1e" }}>
								{logLines.length === 0 ? (
									<Typography
										variant="body2"
										sx={{ color: "text.secondary", fontStyle: "italic" }}
									>
										No logs available yet...
									</Typography>
								) : (
									<Box
										component="pre"
										sx={{
											fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
											fontSize: "14px",
											lineHeight: 1.6,
											margin: 0,
											whiteSpace: "pre-wrap",
											wordBreak: "break-word",
										}}
									>
										{logLines.map((line, index) => (
											<Box
												key={`${index}-${line.substring(0, 20)}`}
												sx={{
													...getLogStyle(line),
													"&:hover": {
														bgcolor: "rgba(255, 255, 255, 0.05)",
													},
												}}
											>
												{line}
											</Box>
										))}
										<div ref={logsEndRef} />
									</Box>
								)}
							</Box>
						</SimpleBar>
					</Box>

					{/* Copy Success Snackbar */}
					<Snackbar
						open={showCopySuccess}
						autoHideDuration={2000}
						onClose={() => setShowCopySuccess(false)}
						message={"Logs copied to clipboard"}
						anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
					/>
				</Box>
			</CardContent>
		</Card>
	);
};
