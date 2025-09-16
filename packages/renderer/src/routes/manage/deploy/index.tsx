import { Add, Computer, RocketLaunch } from "@mui/icons-material";
import {
	Box,
	Button,
	IconButton,
	Paper,
	Tab,
	Tabs,
	Tooltip,
	Typography,
} from "@mui/material";
import { useGetDeployScriptLogQuery } from "@renderer/api/deploy-config/use-get-deploy-script-log-request.query.ts";
import { useFindProjectById } from "@renderer/api/project/use-find-project-by-id.query.ts";
import Icon from "@renderer/components/Icon";
import PageHeader from "@renderer/components/PageHeader";
import ProjectFormCreateComponent from "@renderer/routes/manage/deploy/-components/project-form-create.component.tsx";
import ProjectFormUpdateComponent from "@renderer/routes/manage/deploy/-components/project-form-update.component.tsx";
import { FormStatusType } from "@renderer/types/form-status.type.ts";
import {
	DeployStatusEnum,
	type ProjectResponseDto,
	ProjectType,
} from "@shared/types";
import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { DeployConfigComponent } from "./-components/deploy-config.component.tsx";
import { DeployConfigFormComponent } from "./-components/deploy-config-form.component.tsx";
import { DeployLogViewer } from "./-components/deploy-log-viewer.tsx";
import { GitAccountComponent } from "./-components/git-account.component.tsx";
import { ProjectTreeComponent } from "./-components/project-tree.component.tsx";
import { VirtualMachineComponent } from "./-components/virtual-machine.component.tsx";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
	return (
		<Box
			role="tabpanel"
			hidden={value !== index}
			id={`environment-tabpanel-${index}`}
			aria-labelledby={`environment-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 2, height: "100%", overflow: "auto" }}>{children}</Box>
			)}
		</Box>
	);
}
const componentsMap = {
	GitAuthenticationComponent: GitAccountComponent,
	VirtualMachineManager: VirtualMachineComponent,
	DeployConfigFormComponent,
};
const Deploy: React.FC = () => {
	const [activeComponentName, setActiveComponentName] = useState<
		keyof typeof componentsMap | null
	>(null);

	const [selectedDeployConfigIndex, setSelectedDeployConfigIndex] = useState(0);
	const [isDeployConfigFormDialogOpen, setIsDeployConfigFormDialogOpen] =
		useState(false);

	const [startQueryDeployScriptLog, setStartQueryDeployScriptLog] =
		useState(true);

	const [selectedProject, setSelectedProject] =
		useState<ProjectResponseDto | null>(null);

	const { data: projectDetail } = useFindProjectById(
		{
			id: selectedProject?.id || "",
		},
		{
			query: {
				enabled: !!selectedProject?.id,
			},
		},
	);

	const currentDeployConfigId = useMemo(() => {
		return (
			projectDetail?.deployConfigs?.[selectedDeployConfigIndex]
				?.deployConfigId || ""
		);
	}, [projectDetail, selectedDeployConfigIndex]);

	const { data: deployScriptLog } = useGetDeployScriptLogQuery(
		{
			deployConfigId: currentDeployConfigId,
		},
		{
			query: {
				enabled: !!currentDeployConfigId && startQueryDeployScriptLog,
				refetchInterval: 1000,
				staleTime: 0,
			},
		},
	);

	useEffect(() => {
		if (!deployScriptLog) {
			return;
		}
		setStartQueryDeployScriptLog(
			deployScriptLog?.status === DeployStatusEnum.RUNNING,
		);
	}, [deployScriptLog]);

	const deployScriptLogMemo = useMemo(() => {
		return deployScriptLog?.log || "";
	}, [deployScriptLog]);

	const deployStatus = useMemo(() => {
		return deployScriptLog?.status || DeployStatusEnum.IDLE;
	}, [deployScriptLog]);

	function queryDeployScriptLog(bol: boolean) {
		setStartQueryDeployScriptLog(bol);
	}

	const ActiveComponent = activeComponentName
		? componentsMap[activeComponentName]
		: null;

	return (
		<Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			<PageHeader
				title={"Deploy"}
				subtitle={"Manage deployment configs and execute deployments"}
				actions={
					<>
						<Tooltip title={"git account"}>
							<IconButton
								onClick={() =>
									setActiveComponentName("GitAuthenticationComponent")
								}
							>
								<Icon name="icon-git"></Icon>
							</IconButton>
						</Tooltip>
						<Tooltip title={"Virtual Machine"}>
							<IconButton
								onClick={() => setActiveComponentName("VirtualMachineManager")}
							>
								<Computer />
							</IconButton>
						</Tooltip>
					</>
				}
			/>

			<Box sx={{ flex: 1, display: "flex", overflow: "auto" }}>
				{/* 左侧项目树 */}
				<Box sx={{ width: 300, borderRight: 1, borderColor: "divider" }}>
					<ProjectTreeComponent onSelectProject={setSelectedProject} />
				</Box>
				{/* 主内容区 */}
				<Box
					sx={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						overflow: "auto",
						minWidth: 0,
					}}
				>
					{projectDetail ? (
						<>
							<Paper
								sx={{
									width: "100%",
									borderRadius: 0,
								}}
							>
								<Box
									sx={{
										width: "100%",
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										borderBottom: 1,
										borderColor: "divider",
									}}
								>
									<Tabs
										value={selectedDeployConfigIndex}
										onChange={(_, newValue) =>
											setSelectedDeployConfigIndex(newValue)
										}
										variant="scrollable"
										scrollButtons="auto"
									>
										{projectDetail?.deployConfigs?.map(
											(deployConfig, index) => (
												<Tab
													key={deployConfig.deployConfigId}
													label={
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																gap: 1,
															}}
														>
															{deployConfig.deployConfigName}
														</Box>
													}
													id={`environment-tab-${index}`}
													aria-controls={`environment-tabpanel-${index}`}
													sx={{ textTransform: "none" }}
												/>
											),
										)}
									</Tabs>

									<Button
										startIcon={<Add />}
										onClick={() => {
											setActiveComponentName("DeployConfigFormComponent");
										}}
										sx={{ m: 1 }}
										variant="outlined"
										size="small"
									>
										{"Add Deploy Config"}
									</Button>
								</Box>
							</Paper>

							<Box
								sx={{
									flex: 1,
									display: "flex",
									flexDirection: "column",
									overflow: "auto",
								}}
							>
								{projectDetail?.deployConfigs?.length === 0 && (
									<Box
										sx={{
											height: "100%",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											flexDirection: "column",
											gap: 2,
										}}
									>
										<Typography
											variant="h6"
											color="text.secondary"
											sx={{ mb: 2 }}
										>
											{"No Deploy Configs Found"}
										</Typography>
										<Button
											variant="contained"
											startIcon={<Add />}
											onClick={() => setIsDeployConfigFormDialogOpen(true)}
										>
											{"Add First Deploy Config"}
										</Button>
									</Box>
								)}
								<Box>
									{projectDetail?.deployConfigs?.map((deployConfig, index) => (
										<TabPanel
											key={deployConfig.deployConfigId}
											value={selectedDeployConfigIndex}
											index={index}
										>
											<DeployConfigComponent
												deployStatus={deployStatus}
												onSetSelectedDeployConfigIndex={
													setSelectedDeployConfigIndex
												}
												onQueryDeployScriptLog={queryDeployScriptLog}
												projectDeployConfig={deployConfig}
											/>
										</TabPanel>
									))}
									{projectDetail?.deployConfigs?.length !== 0 && (
										<Box sx={{ p: 2 }}>
											<DeployLogViewer
												deployStatus={deployStatus}
												deployScriptLog={deployScriptLogMemo}
											/>
										</Box>
									)}
								</Box>
							</Box>
						</>
					) : (
						<Box
							sx={{
								flex: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexDirection: "column",
								gap: 2,
							}}
						>
							<RocketLaunch sx={{ fontSize: 64, color: "text.secondary" }} />
							<Typography variant="h5" color="text.secondary">
								{"Select a project to get started"}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{"Choose a project from the left panel or create a new one"}
							</Typography>
						</Box>
					)}
				</Box>
			</Box>
			{/* DeployConfigForm */}
			{isDeployConfigFormDialogOpen && (
				<DeployConfigFormComponent
					projectId={projectDetail?.id}
					formStatus={FormStatusType.Create}
					onClose={() => setIsDeployConfigFormDialogOpen(false)}
				></DeployConfigFormComponent>
			)}
			{ActiveComponent && (
				<ActiveComponent
					onClose={() => setActiveComponentName(null)}
					projectId={projectDetail?.id}
				></ActiveComponent>
			)}
		</Box>
	);
};

export const Route = createFileRoute("/manage/deploy/")({
	component: Deploy,
});
