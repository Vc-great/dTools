import { Delete, Edit } from "@mui/icons-material";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Tooltip,
} from "@mui/material";
import { useDeleteGitAccountQuery } from "@renderer/api/git/use-delete-git-account.query.ts";
import {
	findAllGitAuthenticationQueryKey,
	useFindAllGitAccountsQuery,
} from "@renderer/api/git/use-find-all-git-accounts.query.ts";
import GitRepositoryForm from "@renderer/routes/manage/deploy/-components/git-account-form.component.tsx";
import { FormStatusType } from "@renderer/types/form-status.type.ts";
import type { GitAccountEntityDto } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useCallback, useState } from "react";

interface GitRepositoryManagerProps {
	onClose: () => void;
}

export const GitAccountComponent: React.FC<GitRepositoryManagerProps> = ({
	onClose,
}) => {
	const [listRow, setListRow] = useState<GitAccountEntityDto>();
	const [formStatus, setFormStatus] = useState<FormStatusType>(
		FormStatusType.Create,
	);
	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const queryClient = useQueryClient();
	const { data: gitAuthentications } = useFindAllGitAccountsQuery();
	const { mutate: deleteGitAuthenticationMutate } = useDeleteGitAccountQuery({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: findAllGitAuthenticationQueryKey(),
				});
			},
		},
	});
	const closeFormDialog = useCallback(() => {
		setIsFormDialogOpen(false);
		setListRow(undefined);
		setFormStatus(FormStatusType.Create);
	}, []);

	const openUpdateDialog = (repo: GitAccountEntityDto) => {
		setListRow(repo);
		setFormStatus(FormStatusType.Update);
		setIsFormDialogOpen(true);
	};

	const openCreateDialog = useCallback(() => {
		setListRow(undefined);
		setFormStatus(FormStatusType.Create);
		setIsFormDialogOpen(true);
	}, []);

	return (
		<Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>{"Git Authentications"}</DialogTitle>
			<DialogContent>
				{isFormDialogOpen ? (
					<GitRepositoryForm
						formStatus={formStatus}
						listRow={listRow}
						onCancel={closeFormDialog}
					/>
				) : (
					<>
						<Box sx={{ mb: 2 }}>
							<Button variant="contained" onClick={openCreateDialog}>
								{"Add Authentication"}
							</Button>
						</Box>

						<List>
							{gitAuthentications?.map((account) => (
								<ListItem
									key={account.id}
									divider
									secondaryAction={
										<>
											<Tooltip title="Edit">
												<IconButton onClick={() => openUpdateDialog(account)}>
													<Edit />
												</IconButton>
											</Tooltip>
											<Tooltip title="Delete">
												<IconButton
													onClick={() =>
														deleteGitAuthenticationMutate({
															id: account.id,
														})
													}
													color="error"
												>
													<Delete />
												</IconButton>
											</Tooltip>
										</>
									}
								>
									<ListItemText
										primary={account.platformName}
										secondary={`(${account.type})`}
									/>
								</ListItem>
							))}
							{gitAuthentications?.length === 0 && (
								<Box
									sx={{ textAlign: "center", py: 4, color: "text.secondary" }}
								>
									{"No account configured"}
								</Box>
							)}
						</List>
					</>
				)}
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose}>{"Close"}</Button>
			</DialogActions>
		</Dialog>
	);
};
