import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	Typography,
} from "@mui/material";
import { FormStatusType } from "@renderer/types/form-status.type.ts";
import { type CreateProjectRequestDto, ProjectType } from "@shared/types";

import { useState } from "react";

export type FormData = {
	name: string;
	type: ProjectType;
};

export interface BaseProjectFormProps {
	initialFormData: {
		name: string;
		type: ProjectType;
	};
	formStatus: FormStatusType;
	onClose: () => void;
	onSubmit: (formData: FormData) => Promise<void>;
}

export default function (props: BaseProjectFormProps) {
	const { formStatus, onClose, initialFormData } = props;

	const [formData, setFormData] =
		useState<CreateProjectRequestDto>(initialFormData);

	const handleSubmit = () => {
		props.onSubmit(formData);
	};

	return (
		<Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				{formStatus === FormStatusType.Update
					? "Edit Project"
					: "Create Project"}
			</DialogTitle>

			<DialogContent>
				<TextField
					fullWidth
					label={"Name"}
					value={formData.name}
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					margin="normal"
					required
					autoFocus
				/>

				<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
					{"Type"}:{" "}
					{formData.type === ProjectType.Folder ? "Folder" : "Project"}
				</Typography>
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose}>{"Cancel"}</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={!formData.name?.trim()}
				>
					{"Save"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
