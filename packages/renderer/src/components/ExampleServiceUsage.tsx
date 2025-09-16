// 示例：在React组件中使用tRPC服务
import type React from "react";
import { useEffect, useState } from "react";

// 类型定义
interface User {
	id: string;
	name: string;
	email: string;
	createdAt?: Date;
}

interface DeployRecord {
	id: string;
	projectId: string;
	status: string;
	branch: string;
	commit: string;
	deployedAt: Date;
	duration?: number;
	error?: string;
}

export const ExampleServiceUsage: React.FC = () => {
	const [users, setUsers] = useState<User[]>([]);
	const [deploys, setDeploys] = useState<DeployRecord[]>([]);
	const [loading, setLoading] = useState(false);

	// 获取所有用户
	const fetchUsers = async () => {
		try {
			setLoading(true);
			const result = await window.electronAPI.trpc({
				path: "user.getAll",
			});
			setUsers(result);
		} catch (error) {
			console.error("Failed to fetch users:", error);
		} finally {
			setLoading(false);
		}
	};

	// 创建新用户
	const createUser = async (userData: { name: string; email: string }) => {
		try {
			const newUser = await window.electronAPI.trpc({
				path: "user.create",
				input: userData,
			});
			setUsers((prev) => [...prev, newUser]);
		} catch (error) {
			console.error("Failed to create user:", error);
		}
	};

	// 获取部署历史
	const fetchDeployHistory = async (projectId: string) => {
		try {
			const result = await window.electronAPI.trpc({
				path: "deploy.getHistory",
				input: { projectId },
			});
			setDeploys(result);
		} catch (error) {
			console.error("Failed to fetch deploy history:", error);
		}
	};

	// 创建部署任务
	const createDeploy = async (deployConfig: {
		projectId: string;
		branch: string;
		environment: "development" | "staging" | "production";
	}) => {
		try {
			const newDeploy = await window.electronAPI.trpc({
				path: "deploy.create",
				input: deployConfig,
			});
			console.log("Deploy created:", newDeploy);
		} catch (error) {
			console.error("Failed to create deploy:", error);
		}
	};

	useEffect(() => {
		fetchUsers();
		fetchDeployHistory("project-123");
	}, []);

	return (
		<div>
			<h1>tRPC服务示例</h1>

			{/* 用户管理 */}
			<section>
				<h2>用户管理</h2>
				<button onClick={fetchUsers} disabled={loading}>
					{loading ? "加载中..." : "刷新用户列表"}
				</button>
				<button
					onClick={() =>
						createUser({
							name: "Test User",
							email: "test@example.com",
						})
					}
				>
					创建测试用户
				</button>
				<ul>
					{users.map((user) => (
						<li key={user.id}>
							{user.name} ({user.email})
						</li>
					))}
				</ul>
			</section>

			{/* 部署管理 */}
			<section>
				<h2>部署管理</h2>
				<button onClick={() => fetchDeployHistory("project-123")}>
					刷新部署历史
				</button>
				<button
					onClick={() =>
						createDeploy({
							projectId: "project-123",
							branch: "main",
							environment: "staging",
						})
					}
				>
					创建部署任务
				</button>
				<ul>
					{deploys.map((deploy) => (
						<li key={deploy.id}>
							{deploy.branch} - {deploy.status} ({deploy.commit})
						</li>
					))}
				</ul>
			</section>
		</div>
	);
};
