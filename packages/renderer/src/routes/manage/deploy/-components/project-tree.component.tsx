import {
	Add,
	Delete,
	Edit,
	Folder,
	MoreVert,
	Settings,
} from "@mui/icons-material";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import {
	type UseTreeItemContentSlotOwnProps,
	useTreeItem,
} from "@mui/x-tree-view";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import {
	TreeItem,
	TreeItemContent,
	type TreeItemProps,
} from "@mui/x-tree-view/TreeItem";
import { useDeleteProjectQuery } from "@renderer/api/project/use-delete-project.query.ts";
import {
	findAllProjectQueryKey,
	useFindAllProjectQuery,
} from "@renderer/api/project/use-find-all-project.query.ts";
import { FormStatusType } from "@renderer/types/form-status.type.ts";
import {
	type FindProjectResponseDto,
	type ProjectResponseDto,
	ProjectType,
} from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useMemo, useState } from "react";
import { buildTree } from "../-utils/buildTree.ts";
import ProjectFormCreateComponent from "./project-form-create.component.tsx";
import ProjectFormUpdateComponent from "./project-form-update.component.tsx";

const ParentApiContext = React.createContext<{
	openUpdateProjectDialog: (project: ProjectResponseDto) => void;
	openCreateProjectDialog: (
		projectType: ProjectType,
		treeNode?: ProjectResponseDto,
	) => void;
	deleteProject: (id: string) => Promise<void>;
} | null>(null);
type ProjectTreeProps = {
	onSelectProject: (project: ProjectResponseDto | null) => void;
};

interface CustomContentProps extends UseTreeItemContentSlotOwnProps {
	children: React.ReactNode;
	currentItem: ProjectResponseDto | undefined;
}

function CustomContent({
	children,
	currentItem,
	...props
}: CustomContentProps) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const isTitleMenuOpen = Boolean(anchorEl);
	const parentApi = React.useContext(ParentApiContext);

	return (
		<TreeItemContent {...props}>
			<Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
				{children}
			</Box>

			<IconButton
				size="small"
				onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
					event?.stopPropagation();
					setAnchorEl(event.currentTarget);
				}}
			>
				<MoreVert fontSize="small" />
			</IconButton>
			<Menu
				id="basic-menu"
				anchorEl={anchorEl}
				open={isTitleMenuOpen}
				onClose={() => {
					setAnchorEl(null);
				}}
				slotProps={{
					list: {
						"aria-labelledby": "basic-button",
					},
				}}
			>
				{currentItem?.type === ProjectType.Folder && (
					<MenuItem
						onClick={(event) => {
							event.stopPropagation();
							parentApi?.openCreateProjectDialog(
								ProjectType.Folder,
								currentItem,
							);
							setAnchorEl(null);
						}}
					>
						<Add sx={{ mr: 1 }} />
						{"New Folder"}
					</MenuItem>
				)}
				{currentItem?.type === ProjectType.Folder && (
					<MenuItem
						onClick={(event) => {
							event.stopPropagation();
							parentApi?.openCreateProjectDialog(
								ProjectType.project,
								currentItem,
							);
							setAnchorEl(null);
						}}
					>
						<Add sx={{ mr: 1 }} />
						{"New Project"}
					</MenuItem>
				)}
				<MenuItem
					onClick={(event) => {
						event.stopPropagation();
						parentApi?.openUpdateProjectDialog(currentItem!);
						setAnchorEl(null);
					}}
				>
					<Edit sx={{ mr: 1 }} />
					{"Edit"}
				</MenuItem>
				<MenuItem
					onClick={(event) => {
						event.stopPropagation();
						parentApi?.deleteProject(currentItem?.id!);
						setAnchorEl(null);
					}}
				>
					<Delete color={"error"} sx={{ mr: 1 }} />
					{"Delete"}
				</MenuItem>
			</Menu>
		</TreeItemContent>
	);
}

type CustomTreeItemProps = TreeItemProps & {
	type?: ProjectType;
};

const CustomTreeItem = React.forwardRef(function CustomTreeItem(
	props: CustomTreeItemProps,
	ref: React.Ref<HTMLLIElement>,
) {
	const { publicAPI, status } = useTreeItem(props);

	const currentItem = publicAPI.getItem(props.itemId);

	return (
		<TreeItem
			{...props}
			ref={ref}
			slots={{
				label: () => {
					return (
						<div
							style={{
								paddingLeft: "10px",
								display: "flex",
								alignItems: "center",
							}}
						>
							{currentItem?.type === ProjectType.Folder && (
								<Folder fontSize="small" sx={{ mr: 1 }} />
							)}
							{currentItem?.type === ProjectType.project && (
								<Settings fontSize="small" sx={{ mr: 1 }} />
							)}

							{currentItem.label}
						</div>
					);
				},
				content: CustomContent,
			}}
			slotProps={{
				content: { currentItem } as CustomContentProps,
			}}
		/>
	);
});

export const ProjectTreeComponent: React.FC<ProjectTreeProps> = ({
	onSelectProject,
}) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const isTitleMenuOpen = Boolean(anchorEl);
	const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

	const [selectedProjectItems, setSelectedProjectItems] = useState<
		string | null
	>(null);

	const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

	const queryClient = useQueryClient();

	const { data: projects } = useFindAllProjectQuery();
	const { mutate: deleteProhectMutate } = useDeleteProjectQuery({
		mutation: {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: findAllProjectQueryKey() });
				setSelectedProjectItems(null);
				onSelectProject(null);
			},
		},
	});

	const projectMemo = useMemo(() => {
		return buildTree(projects || []);
	}, [projects]);

	const [formStatus, setFormStatus] = useState<FormStatusType>(
		FormStatusType.Create,
	);

	const [treeNode, setTreeNode] = useState<ProjectResponseDto | undefined>();

	const [presetType, setPresetType] = useState<ProjectType>();

	const openCreateProjectDialog = (
		projectType: ProjectType,
		treeNode?: ProjectResponseDto,
	) => {
		setFormStatus(FormStatusType.Create);
		setTreeNode(treeNode);
		setPresetType(projectType);
		setIsProjectDialogOpen(true);
	};

	const openUpdateProjectDialog = (treeNode: ProjectResponseDto) => {
		setFormStatus(FormStatusType.Update);
		setTreeNode(treeNode);
		setIsProjectDialogOpen(true);
	};

	const deleteProject = async (id: string) => {
		deleteProhectMutate({ id });
	};

	const handleExpandedItemsChange = (
		event: React.SyntheticEvent | null,
		itemIds: string[],
	) => {
		setExpandedItems((oldIds) => {
			return [
				...oldIds,
				...itemIds.filter((id) => {
					const project = projects?.find((p) => p.id === id);
					return project?.type === ProjectType.Folder && !oldIds.includes(id);
				}),
			];
		});
	};

	function cancelProjectDialog() {
		setIsProjectDialogOpen(false);
		setFormStatus(FormStatusType.Create);

		setTreeNode(undefined);
	}

	function handleSetSelectedProjectItems(id: string) {
		const latestProjects = queryClient.getQueryData<FindProjectResponseDto>(
			findAllProjectQueryKey(),
		);

		const project = latestProjects?.find((p) => p.id === id);

		if (project && project.type === ProjectType.project) {
			onSelectProject(project);
			setSelectedProjectItems(id);
		}
	}

	return (
		<Box
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* 固定的标题区域 - 不会滚动 */}
			<Box
				sx={{
					p: 2,
					borderBottom: 1,
					borderColor: "divider",
					display: "flex",
					alignItems: "center",
					flexShrink: 0, // 防止被压缩
					backgroundColor: "background.paper", // 确保背景色
					zIndex: 1, // 确保在滚动内容之上
				}}
			>
				<Typography variant="h6" sx={{ flexGrow: 1 }}>
					{"Projects"}
				</Typography>
				<IconButton
					size="small"
					onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
						setAnchorEl(event.currentTarget);
					}}
					title={"Add Project"}
				>
					<Add />
				</IconButton>
				<Menu
					id="basic-menu"
					anchorEl={anchorEl}
					open={isTitleMenuOpen}
					onClose={() => {
						setAnchorEl(null);
					}}
					slotProps={{
						list: {
							"aria-labelledby": "basic-button",
						},
					}}
				>
					<MenuItem
						onClick={(event) => {
							event.stopPropagation();
							openCreateProjectDialog(ProjectType.Folder);
							setAnchorEl(null);
						}}
					>
						<Add sx={{ mr: 1 }} />
						{"New Folder"}
					</MenuItem>
					<MenuItem
						onClick={(event) => {
							event.stopPropagation();
							openCreateProjectDialog(ProjectType.project);
							setAnchorEl(null);
						}}
					>
						<Settings sx={{ mr: 1 }} />
						{"New Project"}
					</MenuItem>
				</Menu>
			</Box>
			{/* 可滚动的目录树区域 */}
			<Box>
				<ParentApiContext.Provider
					value={{
						openUpdateProjectDialog,
						openCreateProjectDialog,
						deleteProject,
					}}
				>
					<RichTreeView
						items={projectMemo}
						expandedItems={expandedItems}
						onExpandedItemsChange={handleExpandedItemsChange}
						selectedItems={selectedProjectItems}
						onSelectedItemsChange={(event, id) => {
							id && handleSetSelectedProjectItems(id);
						}}
						slots={{
							item: CustomTreeItem,
						}}
					/>
				</ParentApiContext.Provider>
			</Box>

			{isProjectDialogOpen && (
				<>
					{formStatus === FormStatusType.Create && presetType && (
						<ProjectFormCreateComponent
							formStatus={FormStatusType.Create}
							presetType={presetType}
							treeNode={treeNode}
							onSetSelectedProjectItems={(id) =>
								handleSetSelectedProjectItems(id)
							}
							onSetExpandedItems={(id: string) =>
								handleExpandedItemsChange(null, [id])
							}
							onClose={cancelProjectDialog}
						/>
					)}
					{formStatus === FormStatusType.Update && treeNode && (
						<ProjectFormUpdateComponent
							formStatus={FormStatusType.Update}
							treeNode={treeNode}
							onSetSelectedProjectItems={(id) =>
								handleSetSelectedProjectItems(id)
							}
							onClose={cancelProjectDialog}
						/>
					)}
				</>
			)}
		</Box>
	);
};
