import type { FindProjectByIdResponseDto } from "@shared/types";

import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { findProjectByIdService } from "./find-project-by-id.service.ts";

/** the final transformed data type after `select` (or other transforms); this is what components receive. */
type TData = FindProjectByIdResponseDto;

/** the raw data type returned directly from your `queryFn` (e.g. a network response). */
type TQueryFnData = FindProjectByIdResponseDto;

export const findProjectByIdQueryKey = (params?: { id: string }) =>
	["findProjectByIdQueryKey", ...(params ? [params] : [])] as const;

type FindProjectByIdQueryKey = ReturnType<typeof findProjectByIdQueryKey>;

export function useFindProjectById(
	params: { id: string },
	options?: {
		query?: Partial<
			UseQueryOptions<TQueryFnData, unknown, TData, FindProjectByIdQueryKey>
		>;
	},
) {
	const { query: userQueryOptions } = options ?? {};
	return useQuery({
		queryKey: findProjectByIdQueryKey(params),
		queryFn: () => findProjectByIdService(params),
		...userQueryOptions,
	});
}
