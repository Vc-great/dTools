import { getRemoteInfo } from "isomorphic-git";
import http from "isomorphic-git/http/node";

/**
 * 直接远程读取 refs（branches 和 tags）
 * @param {string} url 远程仓库 URL
 * @param {object} [opts] 可选参数，如用户名 / 密码 / token 等
 * @returns {Promise<{branches: string[], tags: string[]}>}
 */
export async function getGitRemoteInfo(
	url: string,
	opts: Partial<Parameters<typeof getRemoteInfo>[0]>,
): Promise<{ branches: string[]; tags: string[] }> {
	console.log("-> url", url);
	console.log("-> opts", opts);
	const info = await getRemoteInfo({
		...opts,
		http,
		url,
	});
	// info.refs.heads 是一个对象，key 为分支名，value 是对应 commit oid
	// info.refs.tags 是一个对象，key 为 tag 名，value 为 oid 或 tag 对象
	const branches = Object.keys(info.refs?.heads || []);
	const tags = Object.keys(info.refs?.tags || []).filter(
		(tag) => !tag.endsWith("^{}"),
	);
	return { branches, tags };
}
