import PropTypes from 'prop-types';
import { Grid, Stack, Typography, Chip } from '@mui/material';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import MetricCard from './MetricCard.jsx';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';

function PricePerformance({ summary }) {
  if (!summary?.ticker) {
    return null;
  }

  const { ticker, tradeVelocity, buyVolume, sellVolume, imbalance, volatility } = summary;
  const deltaPositive = ticker.priceChangePercent >= 0;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Last Price"
          value={formatCurrency(ticker.price, ticker.price > 100 ? 2 : 4)}
          trend={formatPercent(ticker.priceChangePercent)}
          trendColor={deltaPositive ? 'success.main' : 'error.main'}
          subtitle={`24h Δ ${formatCurrency(ticker.priceChange)}`}
          icon={deltaPositive ? <ArrowDropUp fontSize="large" /> : <ArrowDropDown fontSize="large" />}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard title="24h Volume" value={formatNumber(ticker.volume)} subtitle={`Quote ${formatCurrency(ticker.quoteVolume)}`} />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard title="Trade Velocity" value={`${tradeVelocity}/min`} subtitle="Trades in last minute" />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Volatility"
          value={`${(volatility?.standardDeviation * 100).toFixed(2)}%`}
          subtitle="Log return σ (1h)"
        />
      </Grid>
      <Grid item xs={12}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Chip label={`Buy Volume ${formatNumber(buyVolume)}`} color="success" variant="outlined" />
          <Chip label={`Sell Volume ${formatNumber(sellVolume)}`} color="error" variant="outlined" />
          <Typography variant="body2" color={imbalance >= 0 ? 'success.light' : 'error.light'}>
            Order Imbalance {formatNumber(imbalance)}
          </Typography>
        </Stack>
      </Grid>
    </Grid>
  );
}

PricePerformance.propTypes = {
  summary: PropTypes.shape({
    ticker: PropTypes.shape({
      price: PropTypes.number,
      priceChangePercent: PropTypes.number,
      priceChange: PropTypes.number,
      volume: PropTypes.number,
      quoteVolume: PropTypes.number
    }),
    tradeVelocity: PropTypes.number,
    buyVolume: PropTypes.number,
    sellVolume: PropTypes.number,
    imbalance: PropTypes.number,
    volatility: PropTypes.shape({
      standardDeviation: PropTypes.number
    })
  })
};

PricePerformance.defaultProps = {
  summary: null
};

export default PricePerformance;
