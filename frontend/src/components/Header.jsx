import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return 'N/A';
  }
  return new Date(timestamp).toLocaleTimeString();
}

export function Header({ status, lastUpdated, dataSource, warning }) {
  const statusColor = {
    connected: 'success',
    connecting: 'warning',
    disconnected: 'default',
    degraded: 'warning',
    error: 'error',
  }[status] || 'default';

  const sourceLabel = {
    coinmarketcap: 'CoinMarketCap live API',
    synthetic: 'Bundled snapshot (fallback)',
    uninitialised: 'initialising',
  }[dataSource] || 'N/A';

  const sourceColor = dataSource === 'synthetic' ? 'warning' : dataSource === 'coinmarketcap' ? 'success' : 'default';

  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" fontWeight={700} color="primary.light">
            Crypto Pulse
          </Typography>
          <Chip label={`Status: ${status}`} color={statusColor} variant="outlined" size="small" />
          <Chip label={`Source: ${sourceLabel}`} color={sourceColor} variant="outlined" size="small" />
          {warning ? (
            <Tooltip title={warning} placement="bottom">
              <Chip label="Fallback active" color="warning" size="small" />
            </Tooltip>
          ) : null}
        </Stack>
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={18} thickness={6} />
          <Typography variant="body2" color="text.secondary">
            Updated {formatTimestamp(lastUpdated)}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
