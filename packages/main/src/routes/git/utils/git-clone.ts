import { RefType } from "@shared/types";
import fse from "fs-extra";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

export async function gitClone({
	dir,
	repoUrl,
	username,
	password,
	refType,
	refName,
	signal,
}: {
	dir: string;
	repoUrl: string;
	username: string;
	password: string;
	refType: RefType;
	refName: string;
	signal: AbortSignal;
}) {
	await fse.remove(dir); // 清理旧目录
	await fse.mkdirp(dir);

	try {
		await git.clone({
			fs: fse,
			http,
			dir,
			url: repoUrl,
			ref:
				refType === RefType.Tag
					? `refs/tags/${refName}`
					: `refs/heads/${refName}`,
			onAuth: () => ({ username, password }),
			onProgress: (progress) => {
				if (signal.aborted) {
					throw new Error("signal:Clone operation aborted");
				}
				process.stdout.write(
					`下载进度: ${progress.phase} ${progress.loaded}/${progress.total}\r`,
				);
			},
			singleBranch: true,
			depth: 1, // 仅拉取最近一次提交，加快测试速度
		});
	} catch (error) {
		if (signal.aborted) {
			return;
		}
		throw error;
	}
}
