import PropTypes from 'prop-types';
import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { formatNumber } from '../utils/format.js';

function LiquidityPulse({ orderBook }) {
  if (!orderBook?.bids?.length || !orderBook?.asks?.length) {
    return null;
  }

  const bidNotional = orderBook.bids.reduce((acc, level) => acc + level.price * level.quantity, 0);
  const askNotional = orderBook.asks.reduce((acc, level) => acc + level.price * level.quantity, 0);
  const total = bidNotional + askNotional;
  const bidShare = total === 0 ? 50 : (bidNotional / total) * 100;

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Liquidity Pulse
        </Typography>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Bid Notional {formatNumber(bidNotional)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ask Notional {formatNumber(askNotional)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={bidShare}
            sx={{ height: 10, borderRadius: 999, backgroundColor: 'error.dark', '& .MuiLinearProgress-bar': { backgroundColor: 'success.main' } }}
          />
          <Typography variant="caption" color="text.disabled">
            Bid / Ask {bidShare.toFixed(1)}% / {(100 - bidShare).toFixed(1)}%
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

LiquidityPulse.propTypes = {
  orderBook: PropTypes.shape({
    bids: PropTypes.array,
    asks: PropTypes.array
  })
};

LiquidityPulse.defaultProps = {
  orderBook: null
};

export default LiquidityPulse;
