import {
	AccountBox,
	Code,
	Computer,
	ExpandMore,
	Warning,
} from "@mui/icons-material";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	Grid,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import { useCreateDeployConfigQuery } from "@renderer/api/deploy-config/use-create-deploy-config.query.ts";
import { useUpdateDeployConfigQuery } from "@renderer/api/deploy-config/use-update-deploy-config.query.ts";
import { useFindAllGitAccountsQuery } from "@renderer/api/git/use-find-all-git-accounts.query.ts";
import { useGetGitRemoteInfo } from "@renderer/api/git/use-get-git-remote-info.query.ts";
import { findProjectByIdQueryKey } from "@renderer/api/project/use-find-project-by-id.query.ts";
import { useFindAllVirtualMachinesQuery } from "@renderer/api/virtual-machine/use-find-all-virtual-machines.query.ts";
import { RefType } from "@renderer/routes/manage/deploy/-types.ts";
import { FormStatusType } from "@renderer/types/form-status.type.ts";
import {
	AccountTypeDto,
	type CreateDeployConfigRequestDto,
	type GetDeployConfigResponseVo,
	type UpdateDeployConfigRequestDto,
} from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { langs } from "@uiw/codemirror-extensions-langs";
import CodeMirror from "@uiw/react-codemirror";
import { isEmpty } from "lodash-es";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

interface DeployConfigFormProps {
	onClose: () => void;
	deployConfigDetail?: GetDeployConfigResponseVo;
	formStatus: FormStatusType;
	projectId?: string;
}

type FormData = CreateDeployConfigRequestDto | UpdateDeployConfigRequestDto;

export const DeployConfigFormComponent: React.FC<DeployConfigFormProps> = (
	props,
) => {
	const {
		onClose,
		deployConfigDetail,
		formStatus = FormStatusType.Create,
	} = props;
	const queryClient = useQueryClient();
	// 表单状态
	const [formData, setFormData] = useState<FormData>(
		formStatus === FormStatusType.Create
			? {
					name: "",
					projectId: props.projectId!,
					gitAccountId: "",
					vmAccountId: "",
					repoUrl: "",
					refType: RefType.Branch,
					refName: "",
					deployScript: `#!/bin/bash
#📂 Current directory: project root directory
`,
				}
			: {
					...deployConfigDetail!,
				},
	);

	// 验证状态
	const [accountValidationError, setAccountValidationError] =
		useState<string>("");

	const [expandedSections, setExpandedSections] = useState({
		source: true,
		build: true,
		deploy: true,
		accounts: true,
	});

	const { data: gitAccounts } = useFindAllGitAccountsQuery();
	const { data: virtualMachinesAccounts } = useFindAllVirtualMachinesQuery();
	const { data: gitRemoteInfo, isPending: isGetGitRemoteInfoPending } =
		useGetGitRemoteInfo(
			{
				repoUrl: formData.repoUrl,
				accountId: formData.gitAccountId,
			},
			{
				query: {
					enabled: !!formData.repoUrl && !!formData.gitAccountId,
					staleTime: 0,
					gcTime: 0,
				},
			},
		);
	const { mutate: createDeployConfigMutate } = useCreateDeployConfigQuery({
		mutation: {
			onSuccess(data) {
				queryClient.invalidateQueries({
					queryKey: findProjectByIdQueryKey(),
				});
				onClose();
			},
		},
	});

	const { mutate: updateDeployConfigMutate } = useUpdateDeployConfigQuery({
		mutation: {
			onSuccess(data) {
				queryClient.invalidateQueries({
					queryKey: findProjectByIdQueryKey(),
				});
				onClose();
			},
		},
	});

	useEffect(() => {
		setAccountValidationError(
			!isEmpty(gitAccounts) ? "" : "Please add a Git account. ",
		);

		setAccountValidationError(
			!isEmpty(virtualMachinesAccounts)
				? ""
				: (str) => {
						if (str) {
							return `${str}And please add a Virtual Machine account.`;
						} else {
							return "Please add a Virtual Machine account.";
						}
					},
		);
	}, [gitAccounts, virtualMachinesAccounts]);

	const submit = () => {
		"id" in formData && formData.id
			? updateDeployConfigMutate({
					...formData,
				})
			: createDeployConfigMutate({
					...formData,
					projectId: props.projectId!,
				});
	};

	const refOptions = useMemo(() => {
		const options =
			formData.refType === "branch"
				? gitRemoteInfo?.branches
				: gitRemoteInfo?.tags;
		return options || [];
	}, [gitRemoteInfo, formData.refType]);

	// Ensure select values match available options
	const gitAccountValue = useMemo(() => {
		const value = formData.gitAccountId || "";
		const hasOption = gitAccounts?.some((account) => account.id === value);
		return hasOption ? value : "";
	}, [formData.gitAccountId, gitAccounts]);

	const vmAccountValue = useMemo(() => {
		const value = formData.vmAccountId || "";
		const hasOption = virtualMachinesAccounts?.some(
			(account) => account.id === value,
		);
		return hasOption ? value : "";
	}, [formData.vmAccountId, virtualMachinesAccounts]);

	const refNameValue = useMemo(() => {
		const value = formData.refName || "";
		const hasOption = refOptions.includes(value);
		return hasOption ? value : "";
	}, [formData.refName, refOptions]);

	// Check if Repository URL is filled but Git Account is not selected
	const showRepoUrlWarning = useMemo(() => {
		return formData.repoUrl && !formData.gitAccountId;
	}, [formData.repoUrl, formData.gitAccountId]);

	return (
		<Dialog
			open={true}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						height: "90vh",
						"& .simplebar-scrollbar:before": {
							backgroundColor: "#bbb",
							opacity: 0.3,
						},
						"& .simplebar-scrollbar.simplebar-hover:before": {
							backgroundColor: "#999",
							opacity: 0.7,
						},
					},
				},
			}}
		>
			<DialogTitle>
				{deployConfigDetail ? "Edit Deploy Config" : "Add Deploy Config"}
			</DialogTitle>

			<DialogContent
				dividers
				sx={{
					p: 0,
					"&::-webkit-scrollbar": {
						width: "8px",
					},
					"&::-webkit-scrollbar-track": {
						background: "#f1f1f1",
						borderRadius: "4px",
					},
					"&::-webkit-scrollbar-thumb": {
						background: "#c1c1c1",
						borderRadius: "4px",
						"&:hover": {
							background: "#a8a8a8",
						},
					},
				}}
			>
				<Box sx={{ p: 3 }}>
					{/* deploy Name */}
					<Box sx={{ mb: 3 }}>
						<TextField
							label={"Deploy Config Name"}
							value={formData.name || ""}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							fullWidth
							required
							helperText={"Used for tab switching and script identification"}
						/>
					</Box>

					{/* 账户选择模块 */}
					<Accordion
						expanded={expandedSections.accounts}
						onChange={() =>
							setExpandedSections((prev) => ({
								...prev,
								accounts: !prev.accounts,
							}))
						}
					>
						<AccordionSummary expandIcon={<ExpandMore />}>
							<Typography
								variant="h6"
								sx={{ display: "flex", alignItems: "center", gap: 1 }}
							>
								<AccountBox />
								{"Account Selection"}
							</Typography>
						</AccordionSummary>
						<AccordionDetails>
							{accountValidationError && (
								<Alert severity="warning" sx={{ mb: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<Warning />
										{accountValidationError}
									</Box>
								</Alert>
							)}

							<Grid container spacing={2}>
								<Grid size={6}>
									<FormControl fullWidth>
										<InputLabel>{"Git Account"}</InputLabel>
										<Select
											label="Git Account"
											value={gitAccountValue}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													gitAccountId: e.target.value,
												}))
											}
										>
											{gitAccounts?.map((account) => (
												<MenuItem key={account.id} value={account.id}>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
														}}
													>
														<span>{account.platformName}</span>
														<Chip
															label={account.username}
															size="small"
															color={
																account.type ===
																AccountTypeDto.PersonalAccessTokens
																	? "primary"
																	: "default"
															}
														/>
													</Box>
												</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>
								<Grid size={6}>
									<FormControl fullWidth>
										<InputLabel>{"Virtual Machine Account"}</InputLabel>
										<Select
											label="Virtual Machine Account"
											value={vmAccountValue}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													vmAccountId: e.target.value,
												}))
											}
										>
											{virtualMachinesAccounts?.map((account) => (
												<MenuItem key={account.id} value={account.id}>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
														}}
													>
														<Computer fontSize="small" />
														<span>
															{account.name} ({account.host}:{account.port})
														</span>
													</Box>
												</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>
							</Grid>
						</AccordionDetails>
					</Accordion>

					{/* 源信息模块 */}
					<Accordion
						expanded={expandedSections.source}
						onChange={(_, expanded) =>
							setExpandedSections((prev) => ({ ...prev, source: expanded }))
						}
					>
						<AccordionSummary expandIcon={<ExpandMore />}>
							<Typography
								variant="h6"
								sx={{ display: "flex", alignItems: "center", gap: 1 }}
							>
								<Code />
								{"Source Information"}
							</Typography>
						</AccordionSummary>
						<AccordionDetails>
							{showRepoUrlWarning && (
								<Alert severity="warning" sx={{ mb: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<Warning />
										{
											"Please select a Git Account in the Account Selection section above to fetch repository information"
										}
									</Box>
								</Alert>
							)}

							<Grid container spacing={2}>
								{/* First row: Repository URL - full width */}
								<Grid size={12}>
									<TextField
										label={"Repository URL"}
										value={formData.repoUrl || ""}
										onChange={(e) => {
											setFormData((prev) => ({
												...prev,
												repoUrl: e.target.value,
											}));
										}}
										fullWidth
										required
										placeholder="https://github.com/user/repo.git"
									/>
								</Grid>
								{/* Second row: Ref Type and Ref Name */}
								<Grid size={6}>
									<FormControl fullWidth>
										<InputLabel>Ref Type</InputLabel>
										<Select
											label="Ref Type"
											value={formData.refType}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													refType: e.target.value as RefType,
												}))
											}
										>
											<MenuItem value={RefType.Branch}>{"Branch"}</MenuItem>
											<MenuItem value={RefType.Tag}>{"Tag"}</MenuItem>
										</Select>
									</FormControl>
								</Grid>
								<Grid size={6}>
									<FormControl fullWidth>
										<InputLabel>ref Name</InputLabel>
										<Select
											value={refNameValue}
											label="Ref Name"
											disabled={
												isGetGitRemoteInfoPending ||
												!formData.repoUrl ||
												!formData.gitAccountId
											}
											onChange={(e) => {
												setFormData((prev) => ({
													...prev,
													refName: e.target.value,
												}));
											}}
										>
											{isGetGitRemoteInfoPending ? (
												<MenuItem disabled>Loading...</MenuItem>
											) : refOptions.length === 0 ? (
												<MenuItem disabled>No options available</MenuItem>
											) : (
												refOptions.map((item) => (
													<MenuItem key={item} value={item}>
														{item}
													</MenuItem>
												))
											)}
										</Select>
									</FormControl>
								</Grid>
							</Grid>
						</AccordionDetails>
					</Accordion>
					{/* 脚本 */}
					<Accordion
						expanded={expandedSections.deploy}
						onChange={(_, expanded) =>
							setExpandedSections((prev) => ({ ...prev, deploy: expanded }))
						}
					>
						<AccordionSummary expandIcon={<ExpandMore />}>
							<Typography variant="h6">{"Deploy script"}</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<Grid container spacing={2}>
								<Grid size={12}>
									<CodeMirror
										value={formData.deployScript}
										height="400px"
										extensions={[langs.sh()]}
										onChange={(value) =>
											setFormData((prev) => {
												return { ...prev, deployScript: value };
											})
										}
									/>
								</Grid>
							</Grid>
						</AccordionDetails>
					</Accordion>
				</Box>
			</DialogContent>

			<DialogActions sx={{ p: 2 }}>
				<Button
					onClick={() => {
						onClose();
					}}
				>
					{"Cancel"}
				</Button>
				<Button
					onClick={submit}
					variant="contained"
					disabled={
						!formData.name ||
						!formData.repoUrl ||
						!formData.refName ||
						(!formData.gitAccountId && !formData.vmAccountId)
					}
				>
					Submit
				</Button>
			</DialogActions>
		</Dialog>
	);
};
