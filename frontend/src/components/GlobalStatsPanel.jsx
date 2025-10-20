import PropTypes from 'prop-types';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { formatCurrency, formatPercent } from '../utils/format.js';

const StatList = ({ title, data, valueKey }) => (
  <Box flex={1} minWidth={200}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Stack spacing={1}>
      {data.map((item) => (
        <Stack key={item.symbol} direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="body2">{item.symbol}</Typography>
          <Typography variant="body2" fontWeight={600} color={valueKey === 'priceChangePercent' && item[valueKey] < 0 ? 'error.main' : 'success.main'}>
            {valueKey === 'priceChangePercent' ? formatPercent(item[valueKey]) : formatCurrency(item[valueKey])}
          </Typography>
        </Stack>
      ))}
    </Stack>
  </Box>
);

StatList.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  valueKey: PropTypes.string.isRequired,
};

export const GlobalStatsPanel = ({ stats }) => {
  if (!stats) return null;

  const topGainers = stats.topGainers ?? [];
  const topLosers = stats.topLosers ?? [];
  const highestVolume = stats.highestVolume ?? [];
  const marketLeaders = stats.marketLeaders ?? [];

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={3}>
          <Box minWidth={180}>
            <Typography variant="h6">Global Market Pulse</Typography>
            <Typography variant="body2" color="text.secondary">
              Tracking {stats.totalSymbols} tradable pairs on Binance. Last updated {new Date(stats.lastUpdated).toLocaleTimeString()}.
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <StatList title="Top Gainers" data={topGainers} valueKey="priceChangePercent" />
          <StatList title="Top Losers" data={topLosers} valueKey="priceChangePercent" />
          <StatList title="Highest Volume" data={highestVolume} valueKey="quoteVolume" />
          <StatList title="USDT Leaders" data={marketLeaders} valueKey="priceChangePercent" />
        </Stack>
      </CardContent>
    </Card>
  );
};

GlobalStatsPanel.propTypes = {
  stats: PropTypes.shape({
    totalSymbols: PropTypes.number,
    lastUpdated: PropTypes.string,
    topGainers: PropTypes.arrayOf(PropTypes.object),
    topLosers: PropTypes.arrayOf(PropTypes.object),
    highestVolume: PropTypes.arrayOf(PropTypes.object),
    marketLeaders: PropTypes.arrayOf(PropTypes.object),
  }),
};
