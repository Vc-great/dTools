import {
	AccountBox,
	Code,
	Delete,
	Edit,
	PlayArrow,
	Stop,
} from "@mui/icons-material";
import {
	Box,
	Card,
	CardContent,
	Chip,
	Divider,
	Grid,
	IconButton,
	Tooltip,
	Typography,
} from "@mui/material";
import { useDeleteDeployConfigQuery } from "@renderer/api/deploy-config/use-delete-deploy-config.query.ts";
import { useExecuteDeployScriptQuery } from "@renderer/api/deploy-config/use-execute-deploy-script.query.ts";
import { useGetDeployConfigQuery } from "@renderer/api/deploy-config/use-get-deploy-config.query.ts";
import { useStopDeployQuery } from "@renderer/api/deploy-config/use-stop-deploy.query.ts";
import { findProjectByIdQueryKey } from "@renderer/api/project/use-find-project-by-id.query.ts";
import { DeployConfigFormComponent } from "@renderer/routes/manage/deploy/-components/deploy-config-form.component.tsx";
import { FormStatusType } from "@renderer/types/form-status.type.ts";
import { DeployStatusEnum, type ProjectDeployConfigDto } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface DeployConfigProps {
	projectDeployConfig: ProjectDeployConfigDto;
	onSetSelectedDeployConfigIndex: (index: number) => void;
	onQueryDeployScriptLog: (bol: boolean) => void;
	deployStatus: DeployStatusEnum;
}

export const DeployConfigComponent: React.FC<DeployConfigProps> = ({
	projectDeployConfig,
	onSetSelectedDeployConfigIndex,
	onQueryDeployScriptLog,
	deployStatus,
}) => {
	const queryClient = useQueryClient();
	const [isDeployConfigFormDialogOpen, setIsDeployConfigFormDialogOpen] =
		useState(false);

	const { data: deployConfig } = useGetDeployConfigQuery({
		id: projectDeployConfig.deployConfigId,
	});

	const { mutate: deleteDeployConfigMutate } = useDeleteDeployConfigQuery({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: findProjectByIdQueryKey(),
				});
				onSetSelectedDeployConfigIndex(0);
			},
		},
	});

	const { mutate: executeDeployScriptMutate } = useExecuteDeployScriptQuery({
		mutation: {
			onSuccess: (data) => {},
		},
	});

	const { mutate: stopDeployMutate } = useStopDeployQuery({
		mutation: {
			onSuccess: (data) => {
				toast.success(data.message);
			},
		},
	});

	const isDeploying = useMemo(() => {
		return false;
	}, []);

	return (
		<>
			<Card>
				<CardContent>
					{/* Header */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<Typography variant="h6" component="div">
							{deployConfig?.name}
						</Typography>

						<Box sx={{ display: "flex", gap: 1 }}>
							{deployStatus !== DeployStatusEnum.RUNNING && (
								<Tooltip title={"execute Deploy Script"}>
									<IconButton
										size="small"
										onClick={() => {
											executeDeployScriptMutate({
												deployConfigId: deployConfig?.id!,
											});
											onQueryDeployScriptLog(true);
										}}
									>
										<PlayArrow />
									</IconButton>
								</Tooltip>
							)}

							{deployStatus === DeployStatusEnum.RUNNING && (
								<Tooltip title={"Stop Deploy Script"}>
									<IconButton
										size="small"
										onClick={() => stopDeployMutate(deployConfig?.id!)}
									>
										<Stop />
									</IconButton>
								</Tooltip>
							)}

							<Tooltip title={"Edit Deploy Config"}>
								<IconButton
									size="small"
									onClick={() => {
										setIsDeployConfigFormDialogOpen(true);
									}}
									disabled={isDeploying}
								>
									<Edit />
								</IconButton>
							</Tooltip>

							<Tooltip title={"Delete Deploy Config"}>
								<IconButton
									size="small"
									onClick={() => {
										deleteDeployConfigMutate({ id: deployConfig!.id });
									}}
									disabled={isDeploying}
									color="error"
								>
									<Delete />
								</IconButton>
							</Tooltip>
						</Box>
					</Box>

					<Divider sx={{ my: 2 }} />

					{/* Configuration Overview */}
					<Grid container spacing={1}>
						{/* Account Information */}
						<Grid size={12}>
							<Box
								sx={{
									p: 2,
									bgcolor: "action.hover",
									borderRadius: 1,
								}}
							>
								<Typography
									variant="subtitle1"
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										mb: 1,
										fontWeight: 600,
									}}
								>
									<AccountBox fontSize="small" />
									Account Information
								</Typography>
								<Grid container spacing={2}>
									<Grid size={6}>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block", mb: 0.5 }}
										>
											Git Account
										</Typography>
										<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
											<Typography variant="body2" fontWeight={500}>
												{deployConfig?.gitAccount?.username}
											</Typography>
											<Chip
												label={deployConfig?.gitAccount?.platformName}
												size="small"
												variant="outlined"
												sx={{ height: 20 }}
											/>
										</Box>
									</Grid>
									<Grid size={6}>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block", mb: 0.5 }}
										>
											VM Account
										</Typography>
										<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
											<Typography variant="body2" fontWeight={500}>
												{deployConfig?.vmAccount?.name}
											</Typography>
											<Chip
												label={deployConfig?.vmAccount?.host}
												size="small"
												variant="outlined"
												sx={{ height: 20 }}
											/>
										</Box>
									</Grid>
								</Grid>
							</Box>
						</Grid>

						{/* Git Information */}
						<Grid size={12}>
							<Box
								sx={{
									p: 2,
									bgcolor: "action.hover",
									borderRadius: 1,
								}}
							>
								<Typography
									variant="subtitle1"
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										mb: 1,
										fontWeight: 600,
									}}
								>
									<Code fontSize="small" />
									Repository Information
								</Typography>
								<Grid container spacing={2}>
									<Grid size={12}>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block", mb: 0.5 }}
										>
											Repository URL
										</Typography>
										<Typography
											variant="body2"
											sx={{
												wordBreak: "break-all",
												fontFamily: "monospace",
												bgcolor: "background.default",
												p: 1,
												borderRadius: 0.5,
											}}
										>
											{deployConfig?.repoUrl}
										</Typography>
									</Grid>
									<Grid size={6}>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block", mb: 0.5 }}
										>
											Reference Type
										</Typography>
										<Chip
											label={deployConfig?.refType}
											size="small"
											color="primary"
											variant="outlined"
										/>
									</Grid>
									<Grid size={6}>
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block", mb: 0.5 }}
										>
											Reference Name
										</Typography>
										<Typography variant="body2" fontWeight={500}>
											{deployConfig?.refName}
										</Typography>
									</Grid>
								</Grid>
							</Box>
						</Grid>
					</Grid>

					{/*					<Grid container spacing={2}>
						<Typography
							variant="subtitle2"
							sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
						>
							<AccountBox fontSize="small" />
							{"Deploy Script"}
						</Typography>
						<div>{deployConfig?.deployScript}</div>
					</Grid>

					 Deploy Actions
					<Divider sx={{ my: 3 }} />*/}
				</CardContent>
			</Card>
			{isDeployConfigFormDialogOpen && (
				<DeployConfigFormComponent
					projectId={projectDeployConfig.deployConfigId}
					deployConfigDetail={deployConfig}
					formStatus={FormStatusType.Update}
					onClose={() => {
						setIsDeployConfigFormDialogOpen(false);
					}}
				></DeployConfigFormComponent>
			)}
		</>
	);
};
