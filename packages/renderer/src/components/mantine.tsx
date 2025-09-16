import { CssBaseline, createTheme, ThemeProvider } from "@mui/material";
import { SnackbarProvider } from "notistack";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useState,
} from "react";

// 创建主题上下文
interface ThemeContextType {
	mode: "light" | "dark";
	toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
	mode: "dark",
	toggleColorScheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export default function MuiProvider({ children }: PropsWithChildren) {
	const [mode, setMode] = useState<"light" | "dark">("light");

	const toggleColorScheme = () => {
		setMode((prev) => (prev === "dark" ? "light" : "dark"));
	};

	// Create MUI theme with dynamic mode
	const theme = createTheme({
		palette: {
			mode: mode,
			...(mode === "light"
				? {
						// Light mode colors
						background: {
							default: "#ffffff",
							paper: "#f5f5f5",
						},
						text: {
							primary: "#1a1a1a",
							secondary: "#666666",
						},
					}
				: {
						// Dark mode colors
						background: {
							default: "#101113",
							paper: "#1A1B1E",
						},
						text: {
							primary: "#C1C2C5",
							secondary: "#A6A7AB",
						},
					}),
		},
		typography: {
			fontFamily:
				"-apple-system, BlinkMacSystemFont, Segoe UI Variable Text, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji",
		},
		components: {
			MuiCheckbox: {
				styleOverrides: {
					root: {
						cursor: "pointer",
					},
				},
			},
			MuiTextField: {
				styleOverrides: {
					root: {
						"& .MuiInputLabel-root": {
							marginTop: "0.5rem",
						},
					},
				},
			},
			MuiLink: {
				defaultProps: {
					target: "_blank",
				},
			},
		},
	});

	return (
		<ThemeContext.Provider value={{ mode, toggleColorScheme }}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<SnackbarProvider
					maxSnack={3}
					anchorOrigin={{ vertical: "top", horizontal: "right" }}
				>
					{children}
				</SnackbarProvider>
			</ThemeProvider>
		</ThemeContext.Provider>
	);
}
