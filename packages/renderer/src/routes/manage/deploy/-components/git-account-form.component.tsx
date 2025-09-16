import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
	Box,
	Button,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from "@mui/material";
import { useCreateGitAccountQuery } from "@renderer/api/git/use-create-git-account.query.ts";
import { findAllGitAuthenticationQueryKey } from "@renderer/api/git/use-find-all-git-accounts.query.ts";
import { useTestGitConnectionQuery } from "@renderer/api/git/use-test-git-connection.query.ts";
import { updateGitAuthenticationQuery } from "@renderer/api/git/use-update-git-account.query.ts";
import { FormStatusType } from "@renderer/types/form-status.type.ts";
import {
	AccountTypeDto,
	type CreateGitAccountRequestDto,
	type GitAccountEntityDto,
	type UpdateGitAccountRequestDto,
} from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

interface GitRepositoryFormProps {
	onCancel: () => void;
	listRow?: GitAccountEntityDto;
	formStatus: FormStatusType;
}

type FormData = CreateGitAccountRequestDto | UpdateGitAccountRequestDto;
const GitRepositoryForm: React.FC<GitRepositoryFormProps> = (props) => {
	const { onCancel } = props;
	const [formData, setFormData] = useState<FormData>(
		props.formStatus === FormStatusType.Update && props.listRow
			? {
					...props.listRow,
				}
			: {
					platformName: "",
					type: AccountTypeDto.UsernameAndPassword,
					username: "",
					password: "",
					token: "",
				},
	);
	const [showPassword, setShowPassword] = useState(false);
	const [testing, setTesting] = useState(false);
	const [repoUrl, setRepoUrl] = useState("");

	const [testResult, setTestResult] = useState<boolean | null>(null);
	const [showTestDialog, setShowTestDialog] = useState(false);
	const queryClient = useQueryClient();
	const { mutate: createGitAuthenticationMutate } = useCreateGitAccountQuery({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: findAllGitAuthenticationQueryKey(),
				});
				onCancel();
			},
		},
	});

	const { mutate: updateGitAuthenticationMutate } =
		updateGitAuthenticationQuery({
			mutation: {
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: findAllGitAuthenticationQueryKey(),
					});
					onCancel();
				},
			},
		});

	const { mutate: testGitConnectionMutate, isPending } =
		useTestGitConnectionQuery({
			mutation: {
				onSuccess: (data) => {
					toast.success("Connection successful");
				},
			},
		});
	const handleSubmit = () => {
		if ("id" in formData && formData.id) {
			updateGitAuthenticationMutate(formData);
		} else {
			console.log("-> formData", formData);
			createGitAuthenticationMutate(formData);
		}
	};
	const handleTestPassword = async () => {
		setTesting(true);
	};

	const handleTestSSH = async () => {};

	const handleTest = () => {
		testGitConnectionMutate({
			repoUrl: repoUrl,
			...formData,
		});
	};

	const isFormValid = () => {
		if (!formData.platformName) return false;
		//todo 其他验证
		return true;
	};

	const isTestEnabled = () => {
		if (formData.type === AccountTypeDto.UsernameAndPassword) {
			// 密码方式：需要用户名和密码
			return !!(formData.username && formData.password);
		} else {
			return !!formData.token;
		}
	};
	return (
		<Box sx={{ p: 2 }}>
			<TextField
				fullWidth
				label={"Code management platform name"}
				value={formData.platformName}
				onChange={(e) =>
					setFormData({ ...formData, platformName: e.target.value })
				}
				margin="normal"
				required
			/>

			<FormControl fullWidth margin="normal">
				<InputLabel>{"Authentication Type"}</InputLabel>
				<Select
					value={formData.type}
					onChange={(e) =>
						setFormData({
							...formData,
							type: e.target.value as AccountTypeDto,
						})
					}
				>
					<MenuItem value={AccountTypeDto.UsernameAndPassword}>
						{"Username/Password"}
					</MenuItem>
					<MenuItem value={AccountTypeDto.PersonalAccessTokens}>
						{"PersonalAccessTokens"}
					</MenuItem>
				</Select>
			</FormControl>
			<TextField
				fullWidth
				label={"Username"}
				value={formData.username}
				onChange={(e) => setFormData({ ...formData, username: e.target.value })}
				margin="normal"
				required
			/>
			{formData.type === AccountTypeDto.UsernameAndPassword && (
				<TextField
					fullWidth
					label={"Password"}
					type={showPassword ? "text" : "password"}
					value={formData.password}
					onChange={(e) =>
						setFormData({ ...formData, password: e.target.value })
					}
					margin="normal"
					required
					InputProps={{
						endAdornment: (
							<IconButton onClick={() => setShowPassword(!showPassword)}>
								{showPassword ? <VisibilityOff /> : <Visibility />}
							</IconButton>
						),
					}}
				/>
			)}

			{formData.type === AccountTypeDto.PersonalAccessTokens && (
				<TextField
					fullWidth
					label={"Personal Access Tokens"}
					value={formData.token}
					onChange={(e) => setFormData({ ...formData, token: e.target.value })}
					margin="normal"
					required
					placeholder="Personal Access Tokens"
				/>
			)}
			<Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mt: 2 }}>
				<TextField
					fullWidth
					label={"Repository URL for Testing"}
					value={repoUrl}
					onChange={(e) => setRepoUrl(e.target.value)}
					placeholder="https://code.company.cn/group/project.git"
					helperText={"Enter a Git repository URL to test the connection"}
				/>
				<Button
					onClick={() => !isPending && handleTest()}
					disabled={testing || !isTestEnabled()}
					variant="outlined"
					sx={{ minWidth: "auto", px: 2, mt: 1 }}
				>
					{isPending ? "Testing..." : "Test"}
				</Button>
			</Box>

			<Box sx={{ mt: 3, display: "flex", gap: 2 }}>
				<Button onClick={onCancel}>{"Cancel"}</Button>
				<Button
					onClick={handleSubmit}
					disabled={!isFormValid()}
					variant="contained"
				>
					{"Save"}
				</Button>
			</Box>
		</Box>
	);
};

export default GitRepositoryForm;
