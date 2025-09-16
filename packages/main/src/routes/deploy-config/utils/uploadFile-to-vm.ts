import fs from "fs";
import path from "path";
import { Client } from "ssh2";

/**
 * 上传本地文件到远程服务器指定目录
 * @param options SSH 连接参数
 * @param localFilePath 本地文件路径
 * @param remoteDir 远程目录（文件将上传到该目录下）
 */
export async function uploadFileToVM(
	options: {
		host: string;
		port?: number;
		username: string;
		password?: string;
		privateKey?: string; // 也可以使用密钥认证
		signal: AbortSignal;
	},
	localFilePath: string,
	remoteDir: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const conn = new Client();
		const fileName = path.basename(localFilePath);

		conn
			.on("ready", () => {
				console.log("✅ SSH连接成功，开始上传文件...");

				conn.sftp((err, sftp) => {
					if (err) {
						conn.end();
						return reject(err);
					}

					const remotePath = path.posix.join(remoteDir, fileName);
					const readStream = fs.createReadStream(localFilePath);
					const writeStream = sftp.createWriteStream(remotePath);

					writeStream.on("close", () => {
						console.log(`✅ 文件上传成功: ${remotePath}`);
						sftp.end();
						conn.end();
						resolve();
					});

					writeStream.on("error", (err) => {
						sftp.end();
						conn.end();
						reject(err);
					});

					readStream.pipe(writeStream);
				});
			})
			.on("error", (err) => {
				reject(err);
			})
			.connect({
				host: options.host,
				port: options.port ?? 22,
				username: options.username,
				password: options.password,
				privateKey: options.privateKey
					? fs.readFileSync(options.privateKey)
					: undefined,
			});
	});
}
