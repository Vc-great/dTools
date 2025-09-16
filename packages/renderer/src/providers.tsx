import type { PropsWithChildren } from "react";
import MuiProvider from "./components/mantine.tsx";

export default function ({ children }: PropsWithChildren) {
	return <MuiProvider>{children}</MuiProvider>;
}
