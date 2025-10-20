import PropTypes from 'prop-types';
import { Card, CardContent, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import { formatNumber } from '../utils/format.js';

function SideBook({ levels, type }) {
  const total = levels.reduce((acc, level) => acc + level.quantity, 0);
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" color={type === 'bids' ? 'success.light' : 'error.light'}>
        {type === 'bids' ? 'Bids' : 'Asks'}
      </Typography>
      {levels.slice(0, 10).map((level) => (
        <Stack key={`${type}-${level.price}`}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {level.price.toFixed(4)}
            </Typography>
            <Typography variant="caption" color="text.primary">
              {formatNumber(level.quantity, 4)}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(level.quantity / total) * 100}
            color={type === 'bids' ? 'success' : 'error'}
            sx={{ height: 4, borderRadius: 999 }}
          />
        </Stack>
      ))}
    </Stack>
  );
}

SideBook.propTypes = {
  levels: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number,
      quantity: PropTypes.number
    })
  ),
  type: PropTypes.oneOf(['bids', 'asks']).isRequired
};

SideBook.defaultProps = {
  levels: []
};

function OrderBookPanel({ depth }) {
  if (!depth) {
    return null;
  }

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Order Book Depth
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <SideBook levels={depth.bids} type="bids" />
          </Grid>
          <Grid item xs={12} md={6}>
            <SideBook levels={depth.asks} type="asks" />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

OrderBookPanel.propTypes = {
  depth: PropTypes.shape({
    bids: PropTypes.array,
    asks: PropTypes.array
  })
};

OrderBookPanel.defaultProps = {
  depth: null
};

export default OrderBookPanel;
