import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, Button, IconButton, TextField } from "@mui/material";
import { useCreateVirtualMachineQuery } from "@renderer/api/virtual-machine/use-create-virtual-machine.query.ts";
import { findAllVirtualMachinesQuery } from "@renderer/api/virtual-machine/use-find-all-virtual-machines.query.ts";
import { useTestVmConnectionQuery } from "@renderer/api/virtual-machine/use-test-vm-connection.query.ts";
import { useUpdateVirtualMachineQuery } from "@renderer/api/virtual-machine/use-update-virtual-machine.query.ts";
import { FormStatusType } from "@renderer/types/form-status.type.ts";
import type {
	CreateVirtualMachineRequestDto,
	UpdateVirtualMachineRequestDto,
	VirtualMachineEntityDto,
} from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

interface VirtualMachineFormProps {
	onCancel: () => void;
	listRow?: VirtualMachineEntityDto;
	formStatus: FormStatusType;
}

type FormData = CreateVirtualMachineRequestDto | UpdateVirtualMachineRequestDto;

export const VirtualMachineForm: React.FC<VirtualMachineFormProps> = (
	props,
) => {
	const { onCancel } = props;
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState<FormData>(
		props.formStatus === FormStatusType.Update && props.listRow
			? {
					...props.listRow,
				}
			: {
					name: "",
					host: "",
					port: 22,
					username: "",
					password: "",
				},
	);
	const [showPassword, setShowPassword] = useState(false);

	const { mutate: testVmConnectionMutate, isPending: isTestLoading } =
		useTestVmConnectionQuery({
			mutation: {
				onSuccess: (data) => {
					data.success
						? toast.success(data.message)
						: toast.error(data.message);
				},
			},
		});

	const { mutate: createVirtualMachineMutate } = useCreateVirtualMachineQuery({
		mutation: {
			onSuccess: (data) => {
				onCancel();
				queryClient.invalidateQueries({
					queryKey: findAllVirtualMachinesQuery(),
				});
			},
		},
	});

	const { mutate: updateVirtualMachineMutate } = useUpdateVirtualMachineQuery({
		mutation: {
			onSuccess: (data) => {
				onCancel();
				queryClient.invalidateQueries({
					queryKey: findAllVirtualMachinesQuery(),
				});
			},
		},
	});
	const handleSubmit = () => {
		if ("id" in formData && formData.id) {
			updateVirtualMachineMutate(formData);
		} else {
			createVirtualMachineMutate(formData);
		}
	};

	const handleTest = async () => {
		testVmConnectionMutate(formData);
	};

	return (
		<Box sx={{ p: 2 }}>
			<TextField
				fullWidth
				label={"Session Name"}
				value={formData.name}
				onChange={(e) => setFormData({ ...formData, name: e.target.value })}
				margin="normal"
				required
			/>

			<TextField
				fullWidth
				label={"Host"}
				value={formData.host}
				onChange={(e) => setFormData({ ...formData, host: e.target.value })}
				margin="normal"
				required
				placeholder="192.168.1.100"
			/>

			<TextField
				fullWidth
				label={"Port"}
				type="number"
				value={formData.port}
				onChange={(e) =>
					setFormData({ ...formData, port: parseInt(e.target.value) || 22 })
				}
				margin="normal"
			/>

			<TextField
				fullWidth
				label={"Username"}
				value={formData.username}
				onChange={(e) => setFormData({ ...formData, username: e.target.value })}
				margin="normal"
				required
				autoComplete="username"
				inputProps={{
					autoCapitalize: "none",
					autoCorrect: "off",
					spellCheck: false,
				}}
			/>

			<TextField
				fullWidth
				label={"Password"}
				type={showPassword ? "text" : "password"}
				value={formData.password}
				onChange={(e) => setFormData({ ...formData, password: e.target.value })}
				margin="normal"
				InputProps={{
					endAdornment: (
						<IconButton onClick={() => setShowPassword(!showPassword)}>
							{showPassword ? <VisibilityOff /> : <Visibility />}
						</IconButton>
					),
				}}
			/>

			<TextField
				fullWidth
				label={"Work Directory"}
				value="/tmp"
				margin="normal"
				placeholder="/tmp"
				disabled
				InputProps={{
					readOnly: true,
				}}
				helperText="Work directory is configured by the system"
			/>

			<Box sx={{ mt: 3, display: "flex", gap: 2 }}>
				<Button onClick={onCancel}>{"Cancel"}</Button>
				<Button
					onClick={handleTest}
					disabled={
						isTestLoading ||
						!formData.host ||
						!formData.username ||
						!formData.password
					}
					variant="contained"
				>
					{isTestLoading ? "Testing..." : "Test Connection"}
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={!formData.name || !formData.host || !formData.username}
					variant="contained"
				>
					{"Save"}
				</Button>
			</Box>
		</Box>
	);
};
