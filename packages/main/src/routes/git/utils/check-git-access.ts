import {
	AccountTypeDto,
	type TestConnectionRequestDto,
} from "@shared/types";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

export async function checkGitAccess(data: TestConnectionRequestDto) {
	const { repoUrl, username, token, type, password } = data;

	try {
		await git.listServerRefs({
			http,
			url: repoUrl,
			onAuth() {
				return {
					username: username,
					password:
						type === AccountTypeDto.UsernameAndPassword
							? password
							: token,
				};
			},
		});
		return true;
	} catch (err) {
		if (typeof err === "object" && err !== null && "data" in err) {
			// @ts-expect-error
			const statusCode = err?.data?.statusCode || "";
			// @ts-expect-error
			const statusMessage = err?.data?.statusMessage || "";
			// @ts-expect-error
			const response = err?.data?.response || "";
			throw new Error(
				`Failed to access repository. Status: ${statusCode} ${statusMessage}.${response}`,
			);
		}
		throw err;
	}
}
