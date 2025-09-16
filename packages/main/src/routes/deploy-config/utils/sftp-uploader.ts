// sftp-uploader.ts

import fs, { promises as fsp } from "node:fs";
import crypto from "crypto";
import { EventEmitter } from "events";
import path from "path";
import { Client, type ConnectConfig } from "ssh2";

export type SSHOptions = {
	host: string;
	port?: number;
	username: string;
	password?: string;
	privateKey?: string; // path or raw key
	signal?: AbortSignal; // optional external AbortSignal
	// Optional: timeout for connection in ms
	readyTimeout?: number;
};

export type SFTPUploaderEvents = {
	progress: (uploadedBytes: number) => void;
	done: (remotePath: string) => void;
	aborted: () => void;
	warning: (info: any) => void;
	error: (err: Error) => void;
};

export class SFTPUploader extends EventEmitter {
	private readonly opts: SSHOptions;
	private client?: Client;
	private sftp: any | null = null;
	private readStream: fs.ReadStream | null = null;
	private writeStream: any | null = null;
	private settled = false;
	private connected = false;
	private aborted = false;
	private uploadedBytes = 0;
	private remoteTempPath?: string;
	private remoteFinalPath?: string;
	private readonly randomSuffix: string;

	constructor(opts: SSHOptions) {
		super();
		this.opts = opts;
		this.randomSuffix = `${Date.now()}.${crypto.randomBytes(4).toString("hex")}`;
	}

	private emitError(err: Error) {
		if (this.listenerCount("error") > 0) {
			this.emit("error", err);
		}
	}

	/**
	 * 主动中止上传（等价于外部调用 signal.abort()）
	 */
	public async abort() {
		if (this.aborted || this.settled) return;
		this.aborted = true;

		// try to destroy read/write streams
		try {
			this.readStream?.destroy();
		} catch {}
		try {
			this.writeStream?.destroy?.();
		} catch {}

		// best-effort remove remote temp file
		try {
			if (this.sftp && this.remoteTempPath) {
				await new Promise<void>((res) => {
					this.sftp.unlink(this.remoteTempPath, () => res());
				});
			}
		} catch {}

		// close sftp / ssh
		try {
			if (this.sftp && typeof this.sftp.end === "function") this.sftp.end();
		} catch {}
		try {
			if (this.client && this.connected) this.client.end();
		} catch {}

		this.settled = true;
		if (this.listenerCount("aborted") > 0) this.emit("aborted");
	}

	/**
	 * 上传文件到远程目录
	 * @param localFilePath 本地文件路径
	 * @param remoteDir 远端目录（假设已存在）
	 */
	public async upload(localFilePath: string, remoteDir: string): Promise<void> {
		const {
			host,
			port = 22,
			username,
			password,
			privateKey,
			signal,
			readyTimeout,
		} = this.opts;

		return new Promise<void>((resolve, reject) => {
			if (this.settled) return reject(new Error("uploader already settled"));
			// early abort check
			if (signal?.aborted) {
				this.settled = true;
				this.aborted = true;
				if (this.listenerCount("aborted") > 0) this.emit("aborted");
				return reject(new Error("upload aborted"));
			}

			const fileName = path.basename(localFilePath);
			const tempName = `${fileName}.part.${this.randomSuffix}`;
			const remoteTempPath = path.posix.join(remoteDir, tempName);
			const remoteFinalPath = path.posix.join(remoteDir, fileName);
			this.remoteTempPath = remoteTempPath;
			this.remoteFinalPath = remoteFinalPath;

			//判断远程文件是否存在remoteFinalPath,存在则删除

			const client = new Client();
			this.client = client;

			let sftp: any = null;
			this.sftp = null;

			const cleanup = async () => {
				try {
					signal?.removeEventListener("abort", onAbort);
				} catch {}
				try {
					this.readStream?.destroy();
				} catch {}
				try {
					this.writeStream?.destroy?.();
				} catch {}
				try {
					if (sftp && typeof sftp.end === "function") sftp.end();
				} catch {}
				try {
					if (client && this.connected) client.end();
				} catch {}
			};

			const onceResolve = (val?: void) => {
				if (this.settled) return;
				this.settled = true;
				cleanup().finally(() => {
					if (this.listenerCount("done") > 0 && remoteFinalPath)
						this.emit("done", remoteFinalPath);
					resolve();
				});
			};

			const onceReject = (err: any) => {
				if (this.settled) return;
				this.settled = true;
				cleanup().finally(async () => {
					// try remove remote temp file best-effort
					try {
						if (sftp && remoteTempPath) {
							await new Promise<void>((res) => {
								sftp.unlink(remoteTempPath, () => res());
							});
						}
					} catch {}
					this.emitError(err instanceof Error ? err : new Error(String(err)));
					reject(err);
				});
			};

			const onAbort = async () => {
				if (this.aborted || this.settled) return;
				this.aborted = true;
				// destroy streams and attempt to delete remote temp file
				try {
					this.readStream?.destroy();
				} catch {}
				try {
					this.writeStream?.destroy?.();
				} catch {}
				try {
					if (sftp && remoteTempPath) {
						await new Promise<void>((res) => {
							sftp.unlink(remoteTempPath, () => res());
						});
					}
				} catch {}
				// close connections
				try {
					if (sftp && typeof sftp.end === "function") sftp.end();
				} catch {}
				try {
					if (client && this.connected) client.end();
				} catch {}
				this.settled = true;
				if (this.listenerCount("aborted") > 0) this.emit("aborted");
				onceReject(new Error("upload aborted"));
			};

			// attach external signal
			if (signal) {
				signal.addEventListener("abort", onAbort);
			}

			client
				.on("ready", () => {
					this.connected = true;
					client.sftp((err, _sftp) => {
						if (err) return onceReject(err);
						sftp = _sftp;
						this.sftp = sftp;

						// prepare streams
						try {
							this.readStream = fs.createReadStream(localFilePath);
						} catch (e) {
							return onceReject(e);
						}

						try {
							this.writeStream = sftp.createWriteStream(remoteTempPath, {
								flags: "w",
							});
						} catch (e) {
							return onceReject(e);
						}

						// track progress by counting readStream bytes
						this.uploadedBytes = 0;
						this.readStream.on("data", (chunk: Buffer) => {
							this.uploadedBytes += chunk.length;
							if (this.listenerCount("progress") > 0)
								this.emit("progress", this.uploadedBytes);
						});

						this.readStream.on("error", (err) => {
							onceReject(err);
						});

						this.writeStream.on("error", (err: any) => {
							onceReject(err);
						});

						this.writeStream.on("close", () => {
							// remote write finished. First delete the final file if exists, then rename temp -> final
							sftp.stat(remoteFinalPath, (statErr: any) => {
								const finalFileExists = !statErr;

								const doRename = () => {
									sftp.rename(
										remoteTempPath,
										remoteFinalPath,
										(renameErr: any) => {
											if (renameErr) {
												// try cleanup then reject
												sftp.unlink(remoteTempPath, () => {
													onceReject(renameErr);
												});
											} else {
												onceResolve();
											}
										},
									);
								};

								if (finalFileExists) {
									// Delete existing file first
									sftp.unlink(remoteFinalPath, (unlinkErr: any) => {
										if (unlinkErr) {
											// Failed to delete existing file, cleanup and reject
											sftp.unlink(remoteTempPath, () => {
												onceReject(unlinkErr);
											});
										} else {
											// Successfully deleted, now rename
											doRename();
										}
									});
								} else {
									// File doesn't exist, directly rename
									doRename();
								}
							});
						});

						this.writeStream.on("end", () => {
							// noop
						});

						// start piping
						this.readStream.pipe(this.writeStream);
					});
				})
				.on("error", (err) => {
					onceReject(err);
				})
				.on("end", () => {
					// remote ended
				})
				.on("close", () => {
					// connection closed
				});

			// build connect config
			const connectConfig: ConnectConfig = {
				host,
				port,
				username,
				password,
				readyTimeout: readyTimeout ?? 20000,
			};

			if (privateKey) {
				try {
					if (fs.existsSync(privateKey)) {
						connectConfig.privateKey = fs.readFileSync(privateKey);
					} else {
						connectConfig.privateKey = privateKey;
					}
				} catch (e) {
					connectConfig.privateKey = privateKey;
				}
			}

			// start connect
			try {
				client.connect(connectConfig);
			} catch (e) {
				onceReject(e);
			}
		});
	}
}
