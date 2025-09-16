import { findAllProjectQueryKey } from "@renderer/api/project/use-find-all-project.query.ts";
import { useUpdateProjectQuery } from "@renderer/api/project/use-update-project.query.ts";
import type { FormStatusType } from "@renderer/types/form-status.type.ts";
import type { ProjectResponseDto } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";

import ProjectFormComponent, {
	type FormData,
} from "./project-form.component.tsx";

interface UpdateProjectFormProps {
	formStatus: FormStatusType.Update;
	treeNode: ProjectResponseDto;
	onSetSelectedProjectItems: (id: string) => void;
	onClose: () => void;
}

export default function (props: UpdateProjectFormProps) {
	const { treeNode, onClose, onSetSelectedProjectItems } = props;
	const initialFormData: FormData = {
		name: props.treeNode.name,
		type: props.treeNode.type,
	};

	const queryClient = useQueryClient();

	const { mutate: updateProjectMutate } = useUpdateProjectQuery({
		mutation: {
			onSuccess: (data) => {
				queryClient.invalidateQueries({ queryKey: findAllProjectQueryKey() });
				onSetSelectedProjectItems(data.id);
				onClose();
			},
		},
	});

	const handleSubmit = async (formData: FormData) => {
		updateProjectMutate({
			...treeNode,
			...formData,
		});
	};

	return (
		<ProjectFormComponent
			formStatus={props.formStatus}
			initialFormData={initialFormData}
			onClose={props.onClose}
			onSubmit={handleSubmit}
		></ProjectFormComponent>
	);
}
