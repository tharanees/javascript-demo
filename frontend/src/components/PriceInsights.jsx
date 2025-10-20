import PropTypes from 'prop-types';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';

const tooltipFormatter = (value, name) => {
  if (name === 'volume') {
    return [formatNumber(value, 0), 'Volume'];
  }
  return [formatCurrency(value), 'Price'];
};

export const PriceInsights = ({ symbol, klines, ticker }) => {
  if (!klines?.length) return null;

  const chartData = klines.map((kline) => ({
    time: new Date(kline.openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    close: kline.close,
    high: kline.high,
    low: kline.low,
    volume: kline.volume,
  }));

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} mb={2}>
          <Typography variant="h6">Price & Volume · {symbol}</Typography>
          {ticker && (
            <Stack direction="row" spacing={3}>
              <Stack>
                <Typography variant="caption" color="text.secondary">
                  Last Price
                </Typography>
                <Typography variant="subtitle1">{formatCurrency(ticker.lastPrice)}</Typography>
              </Stack>
              <Stack>
                <Typography variant="caption" color="text.secondary">
                  24h Change
                </Typography>
                <Typography variant="subtitle1" color={ticker.priceChangePercent >= 0 ? 'success.main' : 'error.main'}>
                  {formatPercent(ticker.priceChangePercent)}
                </Typography>
              </Stack>
              <Stack>
                <Typography variant="caption" color="text.secondary">
                  24h Volume
                </Typography>
                <Typography variant="subtitle1">{formatNumber(ticker.quoteVolume, 0)}</Typography>
              </Stack>
            </Stack>
          )}
        </Stack>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
            <XAxis dataKey="time" minTickGap={30} />
            <YAxis yAxisId="left" orientation="left" tickFormatter={formatNumber} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={formatNumber} />
            <Tooltip formatter={tooltipFormatter} />
            <Area type="monotone" dataKey="close" stroke="#2196f3" fill="rgba(33,150,243,0.2)" strokeWidth={2} yAxisId="left" />
            <Bar dataKey="volume" fill="rgba(76, 175, 80, 0.7)" barSize={14} yAxisId="right" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

PriceInsights.propTypes = {
  symbol: PropTypes.string.isRequired,
  klines: PropTypes.arrayOf(
    PropTypes.shape({
      openTime: PropTypes.number,
      close: PropTypes.number,
      high: PropTypes.number,
      low: PropTypes.number,
      volume: PropTypes.number,
    }),
  ),
  ticker: PropTypes.shape({
    lastPrice: PropTypes.number,
    priceChangePercent: PropTypes.number,
    quoteVolume: PropTypes.number,
  }),
};
