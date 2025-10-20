import PropTypes from 'prop-types';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { formatNumber, formatTime } from '../utils/format.js';

function TradeSummaryCard({ largestTrade, smallestTrade }) {
  if (!largestTrade && !smallestTrade) {
    return null;
  }

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Trade Extremes (100 trades)
        </Typography>
        <Stack spacing={2}>
          {largestTrade && (
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="success.light">
                Largest
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatNumber(Number(largestTrade.qty), 4)} at {largestTrade.price}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {formatTime(largestTrade.time)}
              </Typography>
            </Stack>
          )}
          {smallestTrade && (
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="error.light">
                Smallest
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatNumber(Number(smallestTrade.qty), 4)} at {smallestTrade.price}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {formatTime(smallestTrade.time)}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

TradeSummaryCard.propTypes = {
  largestTrade: PropTypes.object,
  smallestTrade: PropTypes.object
};

TradeSummaryCard.defaultProps = {
  largestTrade: null,
  smallestTrade: null
};

export default TradeSummaryCard;
