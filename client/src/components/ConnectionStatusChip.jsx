import PropTypes from 'prop-types';
import { Chip } from '@mui/material';

const STATUS_MAP = {
  connected: { label: 'Live', color: 'success' },
  connecting: { label: 'Connecting', color: 'warning' },
  error: { label: 'Error', color: 'error' },
  disconnected: { label: 'Offline', color: 'default' }
};

function ConnectionStatusChip({ status }) {
  const config = STATUS_MAP[status] || STATUS_MAP.disconnected;
  return <Chip size="small" color={config.color} label={config.label} variant="outlined" />;
}

ConnectionStatusChip.propTypes = {
  status: PropTypes.oneOf(['connected', 'connecting', 'error', 'disconnected']).isRequired
};

export default ConnectionStatusChip;
