import PropTypes from 'prop-types';
import { Card, CardContent, List, ListItem, ListItemText, Stack, Typography, Chip } from '@mui/material';
import { formatCurrency, formatNumber, formatTime } from '../utils/format.js';

const getBaseAsset = (symbol) => {
  const quoteSuffixes = ['USDT', 'BUSD', 'USDC', 'BTC', 'ETH'];
  const suffix = quoteSuffixes.find((item) => symbol.endsWith(item));
  return suffix ? symbol.replace(suffix, '') : symbol;
};

export const LiveTrades = ({ symbol, trades = [] }) => {
  const baseAsset = getBaseAsset(symbol);
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Recent Trades · {symbol}</Typography>
          <Chip label={`${trades.length} latest`} size="small" />
        </Stack>
        <List dense sx={{ maxHeight: 320, overflow: 'auto' }}>
          {trades.map((trade) => (
            <ListItem key={trade.id} divider>
              <ListItemText
                primaryTypographyProps={{ variant: 'body2', color: trade.isBuyerMaker ? 'error.main' : 'success.main' }}
                primary={`${formatCurrency(trade.price)} · ${formatNumber(trade.quantity, 4)} ${baseAsset}`}
                secondary={`at ${formatTime(trade.timestamp)}`}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

LiveTrades.propTypes = {
  symbol: PropTypes.string.isRequired,
  trades: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      price: PropTypes.number,
      quantity: PropTypes.number,
      timestamp: PropTypes.number,
      isBuyerMaker: PropTypes.bool,
    }),
  ),
};
