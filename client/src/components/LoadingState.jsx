import PropTypes from 'prop-types';
import { Box, CircularProgress, Typography } from '@mui/material';

export const LoadingState = ({ label }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
    <CircularProgress />
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
      {label}
    </Typography>
  </Box>
);

LoadingState.propTypes = {
  label: PropTypes.string
};

LoadingState.defaultProps = {
  label: 'Loading dashboard data...'
};
