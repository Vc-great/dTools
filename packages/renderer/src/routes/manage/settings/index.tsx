import { Folder, Settings as SettingsIcon } from "@mui/icons-material";
import {
	Box,
	Button,
	Card,
	CardContent,
	Grid,
	TextField,
	Typography,
} from "@mui/material";
import { getSettingsService } from "@renderer/api/setting/get-settings.service";
import { updateDataFolderPathService } from "@renderer/api/setting/update-data-folder-path.service";
import PageHeader from "@renderer/components/PageHeader";
import { openDirectory } from "@renderer/ipc-hander/open-directory";
import type { UpdateDataPathRequestDto } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { tryit } from "radash";
import { useState } from "react";
import SimpleBar from "simplebar-react";

function Settings() {
	const queryClient = useQueryClient();
	const [loading, setLoading] = useState(false);

	const { data: settingData } = useQuery({
		queryKey: ["settings"],
		queryFn: async () => {
			return getSettingsService();
		},
	});

	const { mutate: mutateUpdateDataFolderPath } = useMutation({
		mutationKey: ["updateDataFolderPath"],
		mutationFn: async (data: UpdateDataPathRequestDto) => {
			return updateDataFolderPathService(data);
		},
		onSuccess(data) {
			console.log("-> data", data);
			queryClient.invalidateQueries({ queryKey: ["settings"] });
		},
		onError(error) {
			console.error("Failed to update data folder path:", error);
		},
	});

	const handleSelectFolder = async () => {
		const [, res] = await tryit(openDirectory)();
		const folderPath = !res?.canceled ? res?.filePaths[0] : "";

		if (!folderPath) {
			return;
		}
		mutateUpdateDataFolderPath({
			dataFolderPath: folderPath,
		});
		setLoading(false);
	};

	return (
		<>
			{/* 页面Header部分 - 固定在顶部 */}
			<PageHeader
				title={"Settings"}
				subtitle={"Configure application preferences and behavior"}
				icon={<SettingsIcon />}
			/>

			{/* 主内容区域 - 可滚动 */}
			<Box sx={{ flex: 1, overflow: "hidden" }}>
				<SimpleBar style={{ height: "100%" }}>
					<Box sx={{ p: 3 }}>
						<Grid container spacing={2}>
							{/* 文件管理设置 */}
							<Grid size={12}>
								<Card>
									<CardContent>
										<Box sx={{ display: "flex", alignItems: "center" }}>
											<Folder sx={{ mr: 1, color: "primary.main" }} />
											<Typography variant="h6">{"data folder path"}</Typography>
										</Box>
										{/* 自定义配置目录 */}
										<TextField
											fullWidth
											label={"Custom Data Folder Directory"}
											value={settingData?.dataFolderPath || ""}
											placeholder={"Use default location"}
											sx={{ mb: 2 }}
										/>

										<Button
											variant="outlined"
											onClick={handleSelectFolder}
											disabled={loading}
											sx={{ mb: 2 }}
										>
											{"Select Directory"}
										</Button>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					</Box>
				</SimpleBar>
			</Box>
		</>
	);
}

export const Route = createFileRoute("/manage/settings/")({
	component: Settings,
});
