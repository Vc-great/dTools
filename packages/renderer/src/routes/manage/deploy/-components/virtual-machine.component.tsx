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
import { useDeleteVirtualMachineQuery } from "@renderer/api/virtual-machine/use-delete-virtual-machine.query.ts";
import {
	findAllVirtualMachinesQuery,
	useFindAllVirtualMachinesQuery,
} from "@renderer/api/virtual-machine/use-find-all-virtual-machines.query.ts";
import { FormStatusType } from "@renderer/types/form-status.type.ts";
import type { VirtualMachineEntityDto } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useCallback, useState } from "react";
import { VirtualMachineForm } from "./virtual-machine-form.component.tsx";

interface VirtualMachineManagerProps {
	onClose: () => void;
}

export const VirtualMachineComponent: React.FC<VirtualMachineManagerProps> = ({
	onClose,
}) => {
	const [listRow, setListRow] = useState<VirtualMachineEntityDto>();
	const [showForm, setShowForm] = useState(false);
	const [formStatus, setFormStatus] = useState<FormStatusType>(
		FormStatusType.Create,
	);
	const queryClient = useQueryClient();
	const { data: virtualMachines } = useFindAllVirtualMachinesQuery();
	const { mutate: deleteVirtualMachineMutate } = useDeleteVirtualMachineQuery({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: findAllVirtualMachinesQuery(),
				});
			},
		},
	});
	const handleCancel = useCallback(() => {
		setShowForm(false);
		setListRow(undefined);
		setFormStatus(FormStatusType.Create);
	}, []);

	const handleEdit = useCallback((vm: VirtualMachineEntityDto) => {
		setListRow(vm);
		setFormStatus(FormStatusType.Update);
		setShowForm(true);
	}, []);

	const handleAdd = useCallback(() => {
		setListRow(undefined);
		setFormStatus(FormStatusType.Create);
		setShowForm(true);
	}, []);

	return (
		<Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>{"Virtual Machine"}</DialogTitle>

			<DialogContent>
				{showForm ? (
					<VirtualMachineForm
						listRow={listRow}
						formStatus={formStatus}
						onCancel={handleCancel}
					/>
				) : (
					<>
						<Box sx={{ mb: 2 }}>
							<Button variant="contained" onClick={handleAdd}>
								{"Add Virtual Machine"}
							</Button>
						</Box>

						<List>
							{virtualMachines?.map((vm) => (
								<ListItem
									key={vm.id}
									divider
									secondaryAction={
										<>
											<Tooltip title={"Edit"}>
												<IconButton onClick={() => handleEdit(vm)}>
													<Edit />
												</IconButton>
											</Tooltip>
											<Tooltip title={"Delete"}>
												<IconButton
													onClick={() =>
														deleteVirtualMachineMutate({ id: vm.id })
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
										primary={vm.name}
										secondary={`${vm.username}@${vm.host}:${vm.port} - /tmp`}
									/>
								</ListItem>
							))}
							{virtualMachines?.length === 0 && (
								<Box
									sx={{ textAlign: "center", py: 4, color: "text.secondary" }}
								>
									{"No virtual machines configured"}
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
