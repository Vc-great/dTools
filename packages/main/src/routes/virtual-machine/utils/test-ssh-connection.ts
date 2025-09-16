import type { TestVmConnectionResponseVo } from "@shared/types";

import { Client } from "ssh2";

export interface SSHConnectionConfig {
	host: string;
	port?: number;
	username: string;
	password: string;
	timeout?: number;
}

export interface SSHConnectionResult {
	success: boolean;
	message: string | null;
}

export function testSSHConnection({
	host,
	port = 22,
	username,
	password,
	timeout = 10000,
}: SSHConnectionConfig): Promise<TestVmConnectionResponseVo> {
	return new Promise((resolve) => {
		//使用import导入会报错
		const conn = new Client();
		let settled = false;

		const result: SSHConnectionResult = {
			success: false,
			message: null,
		};

		const cleanup = () => {
			if (!settled) {
				settled = true;
				conn.end();
				resolve(result);
			}
		};

		conn
			.on("ready", () => {
				result.success = true;
				result.message = "Connection successful";
				cleanup();
			})
			.on("error", (err: Error) => {
				result.success = false;
				result.message = err.message;
				cleanup();
			})
			.on("end", () => {
				cleanup();
			})
			.connect({
				host,
				port,
				username,
				password,
				readyTimeout: timeout, // 连接超时时间（毫秒）
				tryKeyboard: false,
			});

		// 防止无响应时卡死
		setTimeout(() => {
			if (!settled) {
				result.success = false;
				result.message = "Connection timeout";
				cleanup();
			}
		}, timeout);
	});
}
