import { useCreateProjectQuery } from "@renderer/api/project/use-create-project.query.ts";
import { findAllProjectQueryKey } from "@renderer/api/project/use-find-all-project.query.ts";
import type { FormStatusType } from "@renderer/types/form-status.type.ts";
import {
	type FindProjectResponseDto,
	type ProjectResponseDto,
	ProjectType,
} from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import ProjectFormComponent, {
	type FormData,
} from "./project-form.component.tsx";

interface CreateProjectFormProps {
	formStatus: FormStatusType.Create;
	presetType: ProjectType;
	treeNode?: ProjectResponseDto;
	onClose: () => void;
	onSetSelectedProjectItems: (id: string) => void;
	onSetExpandedItems: (id: string) => void;
}

export default function (props: CreateProjectFormProps) {
	const { onClose } = props;

	const queryClient = useQueryClient();
	const { mutate: createProjectMutate } = useCreateProjectQuery({
		mutation: {
			onSuccess: async (data) => {
				await queryClient.refetchQueries({
					queryKey: findAllProjectQueryKey(),
				});

				data.type === ProjectType.project &&
					props.onSetSelectedProjectItems(data.id);

				props.treeNode && props.onSetExpandedItems(props.treeNode.id);
				onClose();
			},
		},
	});

	const handleSubmit = async (formData: FormData) => {
		createProjectMutate({
			parentId: props.treeNode?.id || "",
			...formData,
		});
	};

	return (
		<ProjectFormComponent
			formStatus={props.formStatus}
			initialFormData={{
				name: "",
				type: props.presetType,
			}}
			onClose={props.onClose}
			onSubmit={handleSubmit}
		></ProjectFormComponent>
	);
}
