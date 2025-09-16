import path from "node:path";
import { RemoteCommander } from "@main/routes/deploy-config/utils/remote-commander.ts";
import { saveShellScript } from "@main/routes/deploy-config/utils/save-shell-script.ts";
import { logger } from "@main/routes/deploy-config/utils/script-log.ts";
import { SFTPUploader } from "@main/routes/deploy-config/utils/sftp-uploader.ts";
import { gitClone } from "@main/routes/git/utils/git-clone.ts";
import {
	type DeployConfigEntityDto,
	DeployStatusEnum,
	type GitAccountEntityDto,
	type ProjectResponseDto,
	type VirtualMachineEntityDto,
} from "@shared/types";
import { app, Notification as ElNotification } from "electron";
import { TarCompressor } from "./compress-tar.ts";

type Options = {
	deployConfig: DeployConfigEntityDto;
	gitAccount: GitAccountEntityDto;
	project: ProjectResponseDto;
	vmAccount: VirtualMachineEntityDto;
};

export class DeploymentPipeline {
	private controller = new AbortController();
	private aborted = false;
	constructor(private options: Options) {}
	get tarFileName() {
		const { deployConfig, project } = this.options;
		return `${project.name}_${deployConfig.id}`;
	}

	get archiveName() {
		const extname = "tar.gz";

		return `${this.tarFileName}.${extname}`;
	}

	get tarPath() {
		return path.join(app.getPath("userData"), "code-temp", this.archiveName);
	}

	get steps() {
		return [
			{ name: "git clone", fn: async () => this.stepGitClone() },
			{
				name: " save deploy script",
				fn: async () => this.stepSaveShellScript(),
			},
			{ name: "compress to tar", fn: async () => this.stepCompressToTar() },
			{
				name: "upload file to vm",
				fn: async () => this.stepUploadFileToVM(),
			},
			{
				name: "execute deploy script",
				fn: async () => this.stepRemoteExecuteDeployScript(),
			},
		];
	}

	async run() {
		const { deployConfig, project } = this.options;
		logger.clearLogs(deployConfig.id);
		try {
			await this.start();
		} catch (err) {
			logger.append(
				deployConfig.id,
				`\n ❌${err instanceof Error ? err.message : "未知错误"}`,
				DeployStatusEnum.ERROR,
			);
			err instanceof Error &&
				!err?.message.startsWith("signal") &&
				new ElNotification({
					title: project.name,
					body: "部署失败",
				}).show();
		}
	}

	async start() {
		const { deployConfig } = this.options;
		logger.append(
			deployConfig.id,
			`\n🚀 开始部署: ${new Date().toLocaleString()}`,
		);
		for (const step of this.steps) {
			if (this.aborted) {
				return;
			}
			logger.append(deployConfig.id, `\n🚀 Starting step: ${step.name}`);
			await step.fn();
			logger.append(deployConfig.id, `\n✅ Completed step: ${step.name}`);
		}
		logger.append(
			deployConfig.id,
			`\n✅Deploy success`,
			DeployStatusEnum.SUCCESS,
		);
		this.completedNotify();
	}

	completedNotify() {
		const { deployConfig, project } = this.options;
		const deployLog = logger.getLogs(deployConfig.id);
		[DeployStatusEnum.SUCCESS, DeployStatusEnum.ERROR].includes(
			deployLog.status,
		) &&
			new ElNotification({
				title: project.name,
				body:
					deployLog.status === DeployStatusEnum.SUCCESS
						? "部署完成"
						: "部署失败",
			}).show();
	}

	get codeDir() {
		const { deployConfig, project } = this.options;
		return path.join(
			app.getPath("userData"),
			"code-temp",
			`${project.name}_${deployConfig.id}`,
		);
	}

	//停止部署
	stopDeploy() {
		this.aborted = true;
		this.controller.abort();

		const { deployConfig } = this.options;
		logger.append(
			deployConfig.id,
			`\n 🚫 部署已被用户取消`,
			DeployStatusEnum.CANCELLED,
		);
	}

	async stepGitClone() {
		const { deployConfig, gitAccount } = this.options;
		await gitClone({
			dir: this.codeDir,
			repoUrl: deployConfig.repoUrl,
			username: gitAccount.username,
			password: gitAccount.password || gitAccount.token,
			refType: deployConfig.refType,
			refName: deployConfig.refName,
			signal: this.controller.signal,
		});
	}

	async stepSaveShellScript() {
		const { deployConfig } = this.options;
		await saveShellScript(deployConfig.deployScript, this.codeDir);
	}

	/**
	 * 代码压缩打包
	 */
	async stepCompressToTar() {
		const compressor = new TarCompressor({
			sourceDir: this.codeDir,
			outPath: this.tarPath,
			destPath: this.tarFileName,
			gzip: true,
			signal: this.controller.signal,
		});

		// 开始压缩
		await compressor.compress();
	}

	async stepUploadFileToVM() {
		const { vmAccount } = this.options;

		const uploader = new SFTPUploader({
			host: vmAccount.host,
			port: vmAccount.port,
			username: vmAccount.username,
			password: vmAccount.password,
			signal: this.controller.signal,
		});

		await uploader.upload(this.tarPath, "/tmp");
	}

	async stepRemoteExecuteDeployScript() {
		const { deployConfig, vmAccount } = this.options;
		const untarCmd = `tar -xzf ./${this.archiveName}`;

		const cmds = [
			`cd /tmp && rm -f ./${this.tarFileName} && ${untarCmd}`,
			`cd /tmp/${this.tarFileName} && sh ./dTools-deploy-script.sh`,
			//	`cd /tmp && rm -rf ${this.tarFileName}`,
		];

		const rc = new RemoteCommander({
			host: vmAccount.host,
			port: vmAccount.port,
			username: vmAccount.username,
			password: vmAccount.password,
			signal: this.controller.signal,
		});

		await rc
			.run(cmds, {
				onStdout: (line) => {
					logger.append(deployConfig.id, line);
				},
				onStderr: (line) => {
					logger.append(deployConfig.id, line);
				},
			})
			.then(() => {
				rc.dispose();
			})
			.catch(() => {
				rc.dispose();
			});
	}
}
