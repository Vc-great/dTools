import { Box, CircularProgress } from '@mui/material';

export default function () {
	return (
		<Box
			sx={{
				height: '100%',
				width: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			}}
		>
			<CircularProgress size={60} />
		</Box>
	);
}
