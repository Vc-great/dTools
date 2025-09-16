// compress-tar-class.ts

import { EventEmitter } from "node:events";
import fs, { promises as fsp } from "node:fs";
import path from "node:path";
import archiver from "archiver";

export type CompressOptions = {
	sourceDir: string;
	outPath: string; // 最终文件路径（.tar 或 .tar.gz）
	destPath?: string | false; // archiver 的第二个参数
	gzip?: boolean;
	signal?: AbortSignal;
};

export class TarCompressor extends EventEmitter {
	private opts: CompressOptions;
	private archive?: archiver.Archiver;
	private output?: fs.WriteStream;
	private finished = false;
	private aborted = false;
	private tempPath: string;

	constructor(opts: CompressOptions) {
		super();
		this.opts = { destPath: false, gzip: false, ...opts };
		// 临时文件：outPath + .part
		this.tempPath = `${this.opts.outPath}.part`;
		// 绑定外部 signal（如果有）
		if (this.opts.signal) {
			this.opts.signal.addEventListener("abort", () => this.abort());
		}
	}

	/**
	 * 主动中止压缩（会尝试删除临时文件）
	 */
	public async abort() {
		if (this.aborted || this.finished) return;
		this.aborted = true;
		try {
			// 尽量停止 archiver
			try {
				this.archive?.abort();
			} catch {}
			// 关闭/销毁输出流
			try {
				this.output?.destroy();
			} catch {}
		} finally {
			// 删除临时文件（忽略错误）
			try {
				await fsp.unlink(this.tempPath).catch(() => {});
			} catch {}
			throw new Error("compress aborted");
		}
	}

	/**
	 * 执行压缩
	 */
	public async compress(): Promise<void> {
		const { sourceDir, destPath, gzip, outPath } = this.opts;
		const temp = this.tempPath;

		// 确保输出目录存在
		await fsp.mkdir(path.dirname(outPath), { recursive: true }).catch(() => {});
		return new Promise<void>((resolve, reject) => {
			if (this.finished) {
				return resolve();
			}

			const output = fs.createWriteStream(temp);
			this.output = output;

			const archive = archiver("tar", { gzip: !!gzip });
			this.archive = archive;

			let settled = false;

			const cleanupListeners = () => {
				output.removeAllListeners();
				archive.removeAllListeners();
				if (this.opts.signal) {
					try {
						this.opts.signal.removeEventListener("abort", () => this.abort());
					} catch {}
				}
			};

			const safeResolve = async () => {
				if (settled) return;
				settled = true;
				cleanupListeners();
				// 重命名临时文件为目标文件（覆盖同名）
				try {
					await fsp.rename(temp, outPath);
				} catch (err) {
					// 如果 rename 失败，尝试删除临时并 reject
					try {
						await fsp.unlink(temp).catch(() => {});
					} catch {}
					return reject(err);
				}
				this.finished = true;
				this.emit("done", outPath);
				resolve();
			};

			const safeReject = async (err: any) => {
				if (settled) return;
				settled = true;
				cleanupListeners();
				// 尝试删除临时文件
				try {
					await fsp.unlink(temp).catch(() => {});
				} catch {}
				this.finished = true;
				this.emit("error", err);
				reject(err);
			};

			// 绑定流事件
			output.on("close", () => {
				// archiver 的 pointer 可用于进度（完成时）
				if (this.aborted) return; // 已被 abort 处理
				// 注意：close 可能在 finalize 后立即触发 —— 最终由 safeResolve 做 rename
			});

			output.on("error", (err) => {
				safeReject(err);
			});

			archive.on("warning", (warning: any) => {
				// ENOENT 非致命
				if (warning && (warning as any).code === "ENOENT") {
					this.emit("warning", warning);
				} else {
					safeReject(warning);
				}
			});

			archive.on("error", (err: any) => {
				safeReject(err);
			});

			// 可选：如果你想要实时进度（粗略），可以在 'progress' 事件上监听 archiver.stats
			// archiver 在部分版本会触发 'progress'，但并非完全稳定。我们在这里尝试绑定。
			// @ts-expect-error
			archive.on("progress", (progress: any) => {
				// progress.entries.processed, progess.entries.total, progress.fs.processedBytes
				this.emit("progress", progress);
			});

			archive.on("end", () => {
				// archiver 内部流结束（不一定是视觉上的 close）
				// 这里不 finalize 文件重命名：等待 'close' 或 finalize promise
			});

			// pipe 并开始
			archive.pipe(output);
			archive.directory(sourceDir, destPath === undefined ? false : destPath);

			// finalize 返回 Promise 在内置实现中可能没有，但我们保护性捕获
			archive.finalize().catch((err) => {
				// finalize 抛错（非常罕见）
				safeReject(err);
			});

			// 当 output close 时，说明写入流已结束。我们将重命名临时文件并 resolve。
			output.once("close", async () => {
				if (this.aborted) {
					// 如果已被 abort，则 safeReject 已在 abort 中处理（或会处理）
					try {
						await fsp.unlink(temp).catch(() => {});
					} catch {}
					return safeReject(new Error("aborted"));
				}
				// 如果没 aborted，认为是正常完成（但也要确保存量）
				try {
					// small delay could help ensure FS flush, but avoid setTimeout in library; proceed directly
					await safeResolve();
				} catch (err) {
					safeReject(err);
				}
			});

			// 如果外部 signal 在构造时没有绑定（理论上已绑定），这里再保险一遍
			if (this.opts.signal) {
				const onAbort = () => {
					if (this.aborted) return;
					this.abort().catch(() => {});
					// safeReject will be triggered in abort cleanup
					safeReject(new Error("signal: compress aborted"));
				};
				try {
					this.opts.signal.addEventListener("abort", onAbort);
				} catch {}
			}
		});
	}
}
