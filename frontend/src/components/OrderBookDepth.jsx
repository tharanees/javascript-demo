import PropTypes from 'prop-types';
import { Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { formatCurrency, formatNumber } from '../utils/format.js';

const DepthList = ({ title, rows, color }) => {
  const theme = useTheme();
  const maxQuantity = Math.max(...rows.map((row) => row.quantity), 0);
  return (
    <Box flex={1} minWidth={220}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Stack spacing={1}>
        {rows.map((row) => (
          <Box key={`${row.price}-${row.quantity}`}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{formatCurrency(row.price)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatNumber(row.quantity, 3)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={maxQuantity ? (row.quantity / maxQuantity) * 100 : 0}
              sx={{
                height: 6,
                borderRadius: 3,
                mt: 0.5,
                backgroundColor: `${theme.palette[color].main}22`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette[color].main,
                },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

DepthList.propTypes = {
  title: PropTypes.string.isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number,
      quantity: PropTypes.number,
    }),
  ).isRequired,
  color: PropTypes.string.isRequired,
};

export const OrderBookDepth = ({ symbol, depth }) => {
  if (!depth) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Depth Snapshot · {symbol}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
          <DepthList title="Bids" rows={(depth.bids || []).slice(0, 10)} color="success" />
          <DepthList title="Asks" rows={(depth.asks || []).slice(0, 10)} color="error" />
        </Stack>
      </CardContent>
    </Card>
  );
};

OrderBookDepth.propTypes = {
  symbol: PropTypes.string.isRequired,
  depth: PropTypes.shape({
    bids: PropTypes.arrayOf(PropTypes.object),
    asks: PropTypes.arrayOf(PropTypes.object),
  }),
};
