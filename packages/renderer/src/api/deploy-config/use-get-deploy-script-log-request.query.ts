import { getDeployScriptLogService } from "@renderer/api/deploy-config/get-deploy-script-log-request.service.ts";
import type {
	GetDeployScriptLogRequestDto,
	GetDeployScriptLogResponseVo,
} from "@shared/types";
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

/** the final transformed data type after `select` (or other transforms); this is what components receive. */
type TData = GetDeployScriptLogResponseVo;

/** the raw data type returned directly from your `queryFn` (e.g. a network response). */
type TQueryFnData = GetDeployScriptLogResponseVo;

export const getDeployScriptLogQueryKey = (
	params?: GetDeployScriptLogRequestDto,
) => ["getDeployScriptLogQueryKey", ...(params ? [params] : [])] as const;

type GetDeployConfigByIdQueryKey = ReturnType<
	typeof getDeployScriptLogQueryKey
>;

export function useGetDeployScriptLogQuery(
	params: GetDeployScriptLogRequestDto,
	options?: {
		query?: Partial<
			UseQueryOptions<TQueryFnData, unknown, TData, GetDeployConfigByIdQueryKey>
		>;
	},
) {
	const { query: userQueryOptions } = options ?? {};
	return useQuery({
		queryKey: getDeployScriptLogQueryKey(params),
		queryFn: () => {
			return getDeployScriptLogService(params);
		},
		...userQueryOptions,
	});
}
