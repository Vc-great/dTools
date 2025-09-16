import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import toast from "react-hot-toast";

export const errorInterceptorLink = (): TRPCLink<any> => {
	return (runtime) =>
		({ op, next }) => {
			return observable((observer) => {
				return next(op).subscribe({
					next(result) {
						observer.next(result);
					},
					error(err) {
						// 🚨 在这里统一处理 main 抛出的错误
						toast.error(err.message);
						observer.error(err);
					},
					complete() {
						observer.complete();
					},
				});
			});
		};
};
