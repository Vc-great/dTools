import type { GetDeployScriptLogResponseVo } from "@shared/types";

import { DeployStatusEnum } from "@shared/types";
import dayjs from "dayjs";

type LogLine = string;

interface ScriptLogger {
	append(
		deployScriptId: string,
		line: LogLine,
		status?: DeployStatusEnum,
	): void;
	getLogs(deployScriptId: string): GetDeployScriptLogResponseVo;
	clearLogs(deployScriptId: string): void;
}

function createScriptLogger(): ScriptLogger {
	const logMap = new Map<
		string,
		{
			status: DeployStatusEnum;
			timestamp: number;
			logs: LogLine[];
		}
	>();

	// 每小时清理一次，删除超过1小时的日志
	setInterval(
		() => {
			const now = Date.now();
			for (const [deployScriptId, { timestamp }] of logMap.entries()) {
				if (now - timestamp > 60 * 60 * 1000) {
					logMap.delete(deployScriptId);
				}
			}
		},
		60 * 60 * 1000,
	);

	return {
		append(deployScriptId, line, status = DeployStatusEnum.RUNNING) {
			const logLine = `${line.replace(/\r\n/g, "\n")}`;

			console.log(logLine);

			if (!logMap.has(deployScriptId)) {
				return logMap.set(deployScriptId, {
					status: status,
					timestamp: Date.now(),
					logs: [logLine],
				});
			}
			const deployScriptLog = logMap.get(deployScriptId)!;

			return logMap.set(deployScriptId, {
				status,
				timestamp: Date.now(),
				logs: [...deployScriptLog.logs, logLine],
			});
		},

		getLogs(deployConfigId) {
			const deployScripLog = logMap.get(deployConfigId);
			return {
				status: deployScripLog?.status || DeployStatusEnum.IDLE,
				log: deployScripLog ? deployScripLog.logs.join("") : "",
			};
		},

		clearLogs(deployScriptId) {
			logMap.delete(deployScriptId);
		},
	};
}

export const logger = createScriptLogger();
