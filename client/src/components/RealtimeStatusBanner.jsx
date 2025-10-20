import PropTypes from 'prop-types';
import { Alert, AlertTitle } from '@mui/material';

const statusConfig = {
  connecting: { severity: 'info', title: 'Connecting to live data stream' },
  connected: { severity: 'success', title: 'Live data stream active' },
  disconnected: { severity: 'warning', title: 'Connection lost – attempting to reconnect' },
  idle: { severity: 'info', title: 'Realtime stream not initialised' }
};

export const RealtimeStatusBanner = ({ status, generatedAt }) => {
  const config = statusConfig[status] || statusConfig.idle;
  return (
    <Alert severity={config.severity} sx={{ mb: 2 }}>
      <AlertTitle>{config.title}</AlertTitle>
      {generatedAt ? `Last update received ${new Date(generatedAt).toLocaleTimeString()}` : 'Awaiting first payload'}
    </Alert>
  );
};

RealtimeStatusBanner.propTypes = {
  status: PropTypes.oneOf(['connecting', 'connected', 'disconnected', 'idle']).isRequired,
  generatedAt: PropTypes.string
};
