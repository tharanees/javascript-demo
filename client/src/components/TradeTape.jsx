import PropTypes from 'prop-types';
import { Card, CardContent, Stack, Typography, Chip } from '@mui/material';
import { formatNumber, formatTime } from '../utils/format.js';

function TradeTape({ trades }) {
  if (!trades?.length) {
    return null;
  }

  return (
    <Card elevation={0} sx={{ height: '100%', overflow: 'hidden' }}>
      <CardContent sx={{ height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Recent Trades
        </Typography>
        <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
          {trades.slice(-40).reverse().map((trade) => (
            <Stack key={`${trade.eventTime}-${trade.price}`} direction="row" spacing={2} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 72 }}>
                {formatTime(trade.eventTime)}
              </Typography>
              <Chip
                size="small"
                label={trade.price.toFixed(4)}
                color={trade.isBuyerMaker ? 'error' : 'success'}
                variant="outlined"
              />
              <Typography variant="body2" color="text.primary">
                {formatNumber(trade.quantity, 4)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

TradeTape.propTypes = {
  trades: PropTypes.arrayOf(
    PropTypes.shape({
      eventTime: PropTypes.number,
      price: PropTypes.number,
      quantity: PropTypes.number,
      isBuyerMaker: PropTypes.bool
    })
  )
};

TradeTape.defaultProps = {
  trades: []
};

export default TradeTape;
