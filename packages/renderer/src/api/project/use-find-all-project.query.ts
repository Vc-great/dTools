import { useQuery } from "@tanstack/react-query";
import { findAllProjectService } from "./find-all-project.service.ts";

export const findAllProjectQueryKey = () => ["findAllProjectQueryKey"] as const;

export function useFindAllProjectQuery() {
	return useQuery({
		queryKey: findAllProjectQueryKey(),
		queryFn: findAllProjectService,
	});
}
