import { getDeployConfigByIdService } from "@renderer/api/deploy-config/get-deploy-config-by-id.service.ts";
import type {
	GetDeployConfigByIdRequestDto,
	GetDeployConfigResponseVo,
} from "@shared/types";
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

/** the final transformed data type after `select` (or other transforms); this is what components receive. */
type TData = GetDeployConfigResponseVo;

/** the raw data type returned directly from your `queryFn` (e.g. a network response). */
type TQueryFnData = GetDeployConfigResponseVo;

export const getDeployConfigByIdQueryKey = () =>
	["getDeployConfigByIdQueryKey"] as const;

type GetDeployConfigByIdQueryKey = ReturnType<
	typeof getDeployConfigByIdQueryKey
>;

export function useGetDeployConfigQuery(
	params: GetDeployConfigByIdRequestDto,
	options?: {
		query?: Partial<
			UseQueryOptions<TQueryFnData, unknown, TData, GetDeployConfigByIdQueryKey>
		>;
	},
) {
	const { query: userQueryOptions } = options ?? {};
	return useQuery({
		queryKey: getDeployConfigByIdQueryKey(),
		queryFn: () => {
			return getDeployConfigByIdService(params);
		},
		...userQueryOptions,
	});
}
