import type {
	GetGitRemoteInfoRequestDto,
	GetGitRemoteInfoResponseVo,
} from "@shared/types";
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { getGitRemoteInfoService } from "./get-git-remote-info.service.ts";

/** the final transformed data type after `select` (or other transforms); this is what components receive. */
type TData = GetGitRemoteInfoResponseVo;

/** the raw data type returned directly from your `queryFn` (e.g. a network response). */
type TQueryFnData = GetGitRemoteInfoResponseVo;

export const getGitRemoteInfoQueryKey = () =>
	["getGitRemoteInfoQueryKey"] as const;

type GetGitRemoteInfoQueryKey = ReturnType<typeof getGitRemoteInfoQueryKey>;

export function useGetGitRemoteInfo(
	params: GetGitRemoteInfoRequestDto,
	options: {
		query?: Partial<
			UseQueryOptions<TQueryFnData, unknown, TData, GetGitRemoteInfoQueryKey>
		>;
	},
) {
	const { query: userQueryOptions } = options ?? {};
	return useQuery({
		queryKey: getGitRemoteInfoQueryKey(),
		queryFn: () => {
			return getGitRemoteInfoService(params);
		},
		...userQueryOptions,
	});
}
