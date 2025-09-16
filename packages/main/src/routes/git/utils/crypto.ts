import crypto from "node:crypto";

// 使用固定的密钥和IV，实际生产环境应该使用更安全的密钥管理方案
// 可以考虑使用环境变量或系统密钥链
const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = crypto
	.createHash("sha256")
	.update(String(process.env.ENCRYPTION_KEY || "dTools-secret-key-2025"))
	.digest();
const IV_LENGTH = 16;

/**
 * 加密敏感数据（密码、token等）
 * @param text 需要加密的文本
 * @returns 加密后的文本（格式：iv:encryptedData）
 */
export function encrypt(text: string): string {
	if (!text) {
		return "";
	}

	try {
		const iv = crypto.randomBytes(IV_LENGTH);
		const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

		let encrypted = cipher.update(text, "utf8", "hex");
		encrypted += cipher.final("hex");

		// 将IV和加密数据组合，使用冒号分隔
		return `${iv.toString("hex")}:${encrypted}`;
	} catch (error) {
		console.error("Encryption error:", error);
		throw new Error("Failed to encrypt data");
	}
}

/**
 * 解密敏感数据
 * @param text 加密的文本（格式：iv:encryptedData）
 * @returns 解密后的原始文本
 */
export function decrypt(text: string): string {
	if (!text) {
		return "";
	}

	try {
		const parts = text.split(":");
		if (parts.length !== 2) {
			// 如果格式不正确，可能是旧数据未加密，直接返回
			console.warn("Data is not in encrypted format, returning as-is");
			return text;
		}

		const iv = Buffer.from(parts[0], "hex");
		const encryptedData = parts[1];

		const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

		let decrypted = decipher.update(encryptedData, "hex", "utf8");
		decrypted += decipher.final("utf8");

		return decrypted;
	} catch (error) {
		console.error("Decryption error:", error);
		// 如果解密失败，可能是旧数据，返回原文
		return text;
	}
}

/**
 * 检查字符串是否已加密
 * @param text 需要检查的文本
 * @returns true表示已加密，false表示未加密
 */
export function isEncrypted(text: string): boolean {
	if (!text) {
		return false;
	}
	// 检查是否符合加密格式：iv:encryptedData
	const parts = text.split(":");
	return parts.length === 2 && parts[0].length === IV_LENGTH * 2;
}
