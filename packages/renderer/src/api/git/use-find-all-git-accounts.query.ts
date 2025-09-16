import { useQuery } from "@tanstack/react-query";
import { findAllGitAccountsService } from "./find-all-git-accounts.service.ts";

export const findAllGitAuthenticationQueryKey = () =>
	["findAllGitAuthenticationQueryKey"] as const;

export function useFindAllGitAccountsQuery() {
	return useQuery({
		queryKey: findAllGitAuthenticationQueryKey(),
		queryFn: findAllGitAccountsService,
	});
}
