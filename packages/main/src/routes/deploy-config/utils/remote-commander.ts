import fs from "fs";
import { Client } from "ssh2";

export type SSHOptions = {
	host: string;
	port?: number;
	username: string;
	password?: string;
	privateKey?: string; // path to private key file or raw key string
	signal?: AbortSignal; // optional external AbortSignal
	readyTimeout?: number;
};

export type StreamHandler = {
	onStdout?: (line: string) => void;
	onStderr?: (line: string) => void;
};

export class RemoteCommander {
	private opts: SSHOptions;
	private client: Client | null = null;
	private currentStream: any | null = null;
	private settled = false; // whether run()'s promise is already settled
	private aborted = false;
	private externalAbortHandler: (() => void) | null = null;

	constructor(opts: SSHOptions) {
		this.opts = { readyTimeout: 20000, ...opts };
		// bind external signal if provided
		if (this.opts.signal) {
			const onAbort = () => {
				// call instance abort (which will try to SIGINT current stream and cleanup)
				this.abort();
			};
			this.externalAbortHandler = onAbort;
			this.opts.signal.addEventListener("abort", onAbort);
		}
	}

	/** 主动中止：向当前 stream 发 SIGINT 并尽力关闭连接 */
	public abort() {
		if (this.aborted) return;
		this.aborted = true;

		// try to send SIGINT to the current running remote process
		try {
			if (
				this.currentStream &&
				typeof this.currentStream.signal === "function"
			) {
				// send SIGINT
				this.currentStream.signal("SIGINT");
			}
		} catch (e) {
			// ignore
		}

		// also destroy current stream if possible
		try {
			this.currentStream?.destroy?.();
		} catch {}

		// close ssh client connection
		try {
			this.client?.end();
		} catch {}

		// note: run() will observe aborted flag and reject appropriately
	}

	/** 关闭实例：移除外部 signal 监听并关闭底层 client */
	public dispose() {
		try {
			if (this.opts.signal && this.externalAbortHandler) {
				this.opts.signal.removeEventListener(
					"abort",
					this.externalAbortHandler,
				);
			}
		} catch {}
		try {
			this.client?.end();
		} catch {}
	}

	/**
	 * 顺序执行命令数组，返回每条命令的结果
	 * 会在内部处理中断、错误与清理
	 */
	public async run(
		commands: string[],
		streamHandler?: StreamHandler,
	): Promise<
		Array<{
			cmd: string;
			result: {
				stdout: string;
				stderr: string;
				code: number | null;
				signal: string | null;
			};
		}>
	> {
		if (this.settled)
			throw new Error("RemoteCommander: already used (settled)");
		// quick abort check
		if (this.opts.signal?.aborted) {
			this.aborted = true;
			this.settled = true;
			throw new Error("aborted");
		}

		const key = this.opts.privateKey
			? this.readPrivateKey(this.opts.privateKey)
			: undefined;

		return new Promise((resolve, reject) => {
			const conn = new Client();
			this.client = conn;
			let finished = false;

			const cleanupAndReject = (err: any) => {
				if (finished) return;
				finished = true;
				this.settled = true;
				// best-effort cleanup
				try {
					this.currentStream?.destroy?.();
				} catch {}
				try {
					conn.end();
				} catch {}
				// remove external listener
				try {
					if (this.opts.signal && this.externalAbortHandler) {
						this.opts.signal.removeEventListener(
							"abort",
							this.externalAbortHandler,
						);
					}
				} catch {}
				reject(err);
			};

			const cleanupAndResolve = (res: any) => {
				if (finished) return;
				finished = true;
				this.settled = true;
				try {
					conn.end();
				} catch {}
				try {
					if (this.opts.signal && this.externalAbortHandler) {
						this.opts.signal.removeEventListener(
							"abort",
							this.externalAbortHandler,
						);
					}
				} catch {}
				resolve(res);
			};

			conn
				.on("ready", async () => {
					try {
						const results: Array<{ cmd: string; result: any }> = [];
						for (const cmd of commands) {
							// if aborted externally, stop
							if (this.aborted) throw new Error("aborted");

							// signal start of command in stdout stream
							streamHandler?.onStdout?.(`\n$ ${cmd}\n`);

							const res = await this.execCommand(conn, cmd, {
								onStdout: (chunk: Buffer) => {
									const s = chunk.toString();
									streamHandler?.onStdout?.(s);
								},
								onStderr: (chunk: Buffer) => {
									const s = chunk.toString();
									streamHandler?.onStderr?.(s);
								},
							});

							results.push({ cmd, result: res });

							// if you want to break on non-zero exit code, check res.code here and throw
							// if (res.code !== 0) throw new Error(`Command failed: ${cmd}`);
						}
						cleanupAndResolve(results);
					} catch (e) {
						cleanupAndReject(e);
					}
				})
				.on("error", (err) => {
					cleanupAndReject(err);
				})
				.on("end", () => {
					// noop
				})
				.on("close", () => {
					// noop
				});

			// build connect config
			const connectConfig: any = {
				host: this.opts.host,
				port: this.opts.port ?? 22,
				username: this.opts.username,
				readyTimeout: this.opts.readyTimeout,
			};
			if (this.opts.password) connectConfig.password = this.opts.password;
			if (key) connectConfig.privateKey = key;

			try {
				conn.connect(connectConfig);
			} catch (e) {
				cleanupAndReject(e);
			}
		});
	}

	/** 内部 helper：读取私钥（如果传入路径则读取文件，否则直接返回字符串） */
	private readPrivateKey(pk: string) {
		try {
			if (fs.existsSync(pk)) {
				return fs.readFileSync(pk);
			}
		} catch (e) {
			// ignore read error, maybe pk is content
		}
		return pk;
	}

	/**
	 * 内部 helper：执行单个命令
	 * - 使用 pty: true，这样 stream.signal('SIGINT') 可用
	 * - 返回 stdout/stderr/code/signal
	 */
	private execCommand(
		conn: Client,
		command: string,
		streamHandler?: {
			onStdout?: (chunk: Buffer) => void;
			onStderr?: (chunk: Buffer) => void;
		},
	): Promise<{
		stdout: string;
		stderr: string;
		code: number | null;
		signal: string | null;
	}> {
		return new Promise((resolve, reject) => {
			if (this.aborted) return reject(new Error("aborted"));

			conn.exec(command, { pty: true }, (err, stream) => {
				if (err) return reject(err);

				this.currentStream = stream; // keep reference for abort

				let stdout = "";
				let stderr = "";

				// expose a function caller can call to send SIGINT to this stream
				const sendSignal = () => {
					try {
						if (stream && typeof stream.signal === "function") {
							stream.signal("SIGINT");
						}
					} catch (e) {
						// ignore
					}
				};

				// Also provide a convenience to external AbortSignal: if external abort happens, attempt to SIGINT
				const onExternalAbort = () => {
					// mark aborted
					this.aborted = true;
					try {
						if (stream && typeof stream.signal === "function")
							stream.signal("SIGINT");
					} catch {}
					try {
						stream.destroy();
					} catch {}
				};

				if (this.opts.signal) {
					this.opts.signal.addEventListener("abort", onExternalAbort);
				}

				stream
					.on("close", (code: number | null, signal: string | null) => {
						// remove external abort listener bound above
						try {
							if (this.opts.signal)
								this.opts.signal.removeEventListener("abort", onExternalAbort);
						} catch {}
						// clear current stream ref
						this.currentStream = null;
						resolve({ stdout, stderr, code, signal });
					})
					.on("data", (data: Buffer) => {
						const s = data.toString();
						stdout += s;
						try {
							streamHandler?.onStdout?.(Buffer.from(s));
						} catch {}
					})
					.stderr.on("data", (data: Buffer) => {
						const s = data.toString();
						stderr += s;
						try {
							streamHandler?.onStderr?.(Buffer.from(s));
						} catch {}
					});

				// defensive: if instance was aborted between exec and stream setup
				if (this.aborted) {
					try {
						if (typeof stream.signal === "function") stream.signal("SIGINT");
					} catch {}
					try {
						stream.destroy();
					} catch {}
					// let 'close' event handle resolve/reject; but guard against hang:
					// set a timeout to reject if close not emitted.
					const t = setTimeout(() => {
						try {
							this.currentStream = null;
						} catch {}
						reject(new Error("aborted"));
					}, 5000);
					stream.once("close", () => clearTimeout(t));
				}
			});
		});
	}
}
