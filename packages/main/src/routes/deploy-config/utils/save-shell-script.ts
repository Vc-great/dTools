import path from "node:path";
import fse from "fs-extra";

/**
 *  shell 命令保存为 .sh 文件
 * @param deployScript - 前端传来的 shell 命令字符串（如 "docker ps\n\ndocker images"）
 * @param outputDir - 保存脚本的目录路径
 * @param baseName - 文件名（不带扩展名），默认 "deploy-script"
 * @returns 返回生成的脚本完整路径
 */
export async function saveShellScript(
	deployScript: string,
	outputDir: string,
	baseName = "dTools-deploy-script",
): Promise<string> {
	// 确保输出目录存在
	await fse.ensureDir(outputDir);

	// 拼接路径
	const filePath = path.join(outputDir, `${baseName}.sh`);

	// 格式化命令内容：加上 shebang
	const content = [deployScript.trim()].join("\n");

	// 写入文件
	await fse.writeFile(filePath, content, { mode: 0o755 });

	return filePath;
}
