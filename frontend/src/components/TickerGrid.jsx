import PropTypes from 'prop-types';
import { Box, Card, CardContent, LinearProgress, Typography, Stack } from '@mui/material';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';
import { useDashboardStore } from '../state/dashboardStore.js';

const TickerCard = ({ ticker, history }) => {
  if (!ticker) return null;

  const changePositive = ticker.priceChangePercent >= 0;

  const areaData = (history ?? []).map((point) => ({
    time: point.time,
    price: point.price,
  }));

  return (
    <Card variant="outlined" sx={{ minWidth: 240 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="h6">{ticker.symbol}</Typography>
          <Typography variant="subtitle2" color={changePositive ? 'success.main' : 'error.main'}>
            {formatPercent(ticker.priceChangePercent)}
          </Typography>
        </Stack>
        <Typography variant="h5" sx={{ mt: 1 }}>
          {formatCurrency(ticker.lastPrice)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          24h Vol {formatNumber(ticker.quoteVolume, 0)}
        </Typography>
        <Box height={120} mt={2}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id={`gradient-${ticker.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={changePositive ? '#4caf50' : '#ef5350'} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={changePositive ? '#4caf50' : '#ef5350'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <Area type="monotone" dataKey="price" strokeWidth={2} stroke={changePositive ? '#4caf50' : '#ef5350'} fill={`url(#gradient-${ticker.symbol})`} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(Math.max(((ticker.lastPrice - ticker.lowPrice) / (ticker.highPrice - ticker.lowPrice || 1)) * 100, 0), 100)}
          sx={{ mt: 2, height: 6, borderRadius: 3 }}
        />
        <Stack direction="row" justifyContent="space-between" mt={1}>
          <Typography variant="caption">Low {formatCurrency(ticker.lowPrice)}</Typography>
          <Typography variant="caption">High {formatCurrency(ticker.highPrice)}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

TickerCard.propTypes = {
  ticker: PropTypes.shape({
    symbol: PropTypes.string,
    priceChangePercent: PropTypes.number,
    lastPrice: PropTypes.number,
    highPrice: PropTypes.number,
    lowPrice: PropTypes.number,
    quoteVolume: PropTypes.number,
  }),
  history: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.number,
      price: PropTypes.number,
    }),
  ),
};

export const TickerGrid = ({ tickers }) => {
  const priceHistory = useDashboardStore((state) => state.priceHistory);

  return (
    <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(240px, 1fr))" gap={2}>
      {tickers.map((ticker) => (
        <TickerCard key={ticker.symbol} ticker={ticker} history={priceHistory[ticker.symbol]} />
      ))}
    </Box>
  );
};

TickerGrid.propTypes = {
  tickers: PropTypes.arrayOf(PropTypes.object),
};
