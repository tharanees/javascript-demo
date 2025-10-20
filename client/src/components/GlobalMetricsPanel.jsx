import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Grid } from '@mui/material';
import { GLOBAL_METRICS } from '../graphql/queries.js';
import useDashboardStore from '../state/useDashboardStore.js';
import MetricCard from './MetricCard.jsx';
import { formatCurrency, formatNumber } from '../utils/format.js';

function GlobalMetricsPanel() {
  const { data } = useQuery(GLOBAL_METRICS, { pollInterval: 45000 });
  const realtime = useDashboardStore((state) => state.globalMetrics);

  const metrics = useMemo(() => realtime || data?.globalMetrics, [data, realtime]);
  if (!metrics) {
    return null;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <MetricCard title="24h Volume" value={formatCurrency(metrics.totalQuoteVolume)} subtitle="Quote asset aggregated" />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard title="24h Units" value={formatNumber(metrics.totalVolume)} subtitle="Total contracts" />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Advance / Decline"
          value={`${metrics.advances} / ${metrics.decliners}`}
          trend={`${metrics.advanceDeclineRatio.toFixed(2)}x`}
          trendColor={metrics.advanceDeclineRatio > 1 ? 'success.main' : 'error.main'}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Extreme Movers"
          value={metrics.extremeMovers.length}
          subtitle=">|10%| change"
        />
      </Grid>
    </Grid>
  );
}

export default GlobalMetricsPanel;
