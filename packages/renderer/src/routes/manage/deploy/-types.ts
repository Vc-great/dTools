export interface VirtualMachine {
	id: string;
	name: string; // 会话名称
	host: string;
	port?: number;
	username: string;
	password: string; // 加密存储
	workDir: string;
	description?: string;
}

// 新增：Ref 类型定义
export interface RefOption {
	type: "branch" | "tag";
	name: string;
	commit: string;
	lastUpdate: string;
}

// 新增：镜像标签策略
export type ImageTagStrategy = "auto" | "ref" | "manual";

// 新增：构建方法
export type BuildMethod = "docker_build" | "docker_compose_build";

// 新增：部署方式
export type DeployMethod = "docker" | "kubernetes" | "package_only";

// 重新设计的环境配置
export interface EnvironmentConfig {
	id: string;
	name: string; // Environment Name
	//
	gitAccountId: string;
	vmAccountId: string;
	// 区块 A：源信息
	repoUrl: string;
	refType: "branch" | "tag";
	selectedRef: string;

	// 区块 B：打包配置
	buildMethod: BuildMethod;
	buildContext: string;
	dockerfilePath: string;
	imageRegistry?: string; // 可选，私有仓库
	imageName: string;
	imageTagStrategy: ImageTagStrategy;
	customTag?: string; // 手动输入时使用

	// 区块 C：部署配置
	deployMethod: DeployMethod;

	// Docker 部署配置
	dockerConfig?: {
		containerName: string;
		ports: Array<{ host: string; container: string; protocol?: "tcp" | "udp" }>;
		volumes: Array<{ host: string; container: string; mode?: "ro" | "rw" }>;
		environment: Record<string, string | { value: string; isSecret: boolean }>;
		restartPolicy: "no" | "always" | "unless-stopped" | "on-failure";
		networkMode?: string;
		extraArgs: string[];
		buildArgs?: Record<string, string | { value: string; isSecret: boolean }>;
		deployType: "docker_compose";
		dockerComposePath: string;
		services: string[];
		preDeployScript: string;
		postDeployScript: string;
	};

	// Kubernetes 部署配置
	kubernetesConfig?: {
		namespace: string;
		deploymentName: string;
		replicas: number;
		configFiles: string[]; // YAML 配置文件路径
		resources?: {
			requests: { cpu: string; memory: string };
			limits: { cpu: string; memory: string };
		};
	};

	// 通用配置
	vmId?: string; // 目标虚拟机
	healthCheck?: {
		enabled: boolean;
		url?: string;
		timeout: number;
		retries: number;
	};

	createdAt: string;
	updatedAt: string;
}

export interface DeployEnvironment {
	id: string;
	name: string;
	envType: "development" | "testing" | "production";
	gitRepoId: string;
	branch?: string;
	tag?: string;
	vmId: string;
	workDir: string;
	remoteRegistry?: RemoteRegistry;
	buildOnly: boolean; // 是否只制作镜像不部署
	deployScript?: string;
}

export interface RemoteRegistry {
	url: string;
	username?: string;
	password?: string;
}

export interface CreateDeployProject {
	name: string;
	projectType: "folder" | "project"; // 前端使用type字段
	parentId?: string | null;
}

// 添加设置接口
export interface DeploySettings {
	defaultWorkDir: string;
	maxConcurrentDeploys: number;
	logRetentionDays: number;
	autoCleanup: boolean;
}

export interface DeployLogMessage {
	id: string;
	timestamp: string;
	level: "info" | "warning" | "error" | "success";
	message: string;
	step?: string;
	data?: any;
}

export interface DeployProgress {
	id: string;
	currentStep: string;
	progress: number;
	status: "running" | "success" | "error" | "pending";
	startTime?: string;
	endTime?: string;
	error?: string;
}

export enum RefType {
	Branch = "branch",
	Tag = "tag",
}
export const RefTypeOptions = [
	{ label: "Branch", value: RefType.Branch },
	{ label: "Tag", value: RefType.Tag },
];

export const refTypeLabel = {
	[RefType.Branch]: "Branch",
	[RefType.Tag]: "Tag",
};
