import FallbackAppRenderComponent from "@renderer/components/fallback-error-boundary.component.tsx";
import Providers from "@renderer/providers.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "react-hot-toast";
import { router } from "./routes/_index.tsx";

interface AppComponentProps {
	children: React.ReactNode;
}
const queryClient = new QueryClient();
export default function AppComponent({ children }: AppComponentProps) {
	return (
		<>
			<React.StrictMode>
				<QueryClientProvider client={queryClient}>
					<Providers>
						<ErrorBoundary
							FallbackComponent={FallbackAppRenderComponent}
							// Reset the state of your app so the error doesn't happen again
							onReset={() => {
								router.navigate({ to: "/manage/deploy" });
							}}
							onError={(e) => console.error(e.message)}
						>
							{children}
						</ErrorBoundary>
						<Toaster />
					</Providers>
				</QueryClientProvider>
			</React.StrictMode>
			<TanStackRouterDevtools />
		</>
	);
}
