import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Stack,
  CircularProgress,
  Divider
} from '@mui/material';
import { Bolt } from '@mui/icons-material';
import { ASSET_METRICS, MARKET_SUMMARY } from '../graphql/queries.js';
import useDashboardStore from '../state/useDashboardStore.js';
import useRealtimeFeed from '../hooks/useRealtimeFeed.js';
import ConnectionStatusChip from '../components/ConnectionStatusChip.jsx';
import SymbolSelector from '../components/SymbolSelector.jsx';
import GlobalMetricsPanel from '../components/GlobalMetricsPanel.jsx';
import MarketLeadersTable from '../components/MarketLeadersTable.jsx';
import PricePerformance from '../components/PricePerformance.jsx';
import PriceSparkline from '../components/PriceSparkline.jsx';
import OrderBookPanel from '../components/OrderBookPanel.jsx';
import MomentumGauge from '../components/MomentumGauge.jsx';
import PriceBandsCard from '../components/PriceBandsCard.jsx';
import TradeTape from '../components/TradeTape.jsx';
import TradeSummaryCard from '../components/TradeSummaryCard.jsx';
import LiquidityPulse from '../components/LiquidityPulse.jsx';
import ExtremeMoversList from '../components/ExtremeMoversList.jsx';

function AppShell() {
  const selectedSymbol = useDashboardStore((state) => state.selectedSymbol);
  const connectionStatus = useDashboardStore((state) => state.connectionStatus);
  const realtimeSnapshots = useDashboardStore((state) => state.realtime);

  useRealtimeFeed();

  const { data: summaryData, loading: summaryLoading } = useQuery(MARKET_SUMMARY, {
    variables: { symbol: selectedSymbol },
    fetchPolicy: 'cache-and-network',
    pollInterval: 20000
  });
  const { data: metricsData, loading: metricsLoading } = useQuery(ASSET_METRICS, {
    variables: { symbol: selectedSymbol },
    fetchPolicy: 'cache-and-network',
    pollInterval: 25000
  });

  const realtimeSummary = realtimeSnapshots[selectedSymbol];
  const summary = useMemo(() => {
    const base = summaryData?.marketSummary;
    if (!base && !realtimeSummary) {
      return null;
    }
    const ticker = { ...base?.ticker, ...realtimeSummary?.ticker };
    const depth = realtimeSummary?.depth || base?.depth;
    const trades = realtimeSummary?.trades || base?.trades || [];
    return {
      ...base,
      ...realtimeSummary,
      ticker,
      depth,
      trades,
      series: base?.series,
      volatility: base?.volatility
    };
  }, [summaryData, realtimeSummary]);

  const metrics = metricsData?.assetMetrics;
  const loading = summaryLoading || metricsLoading;

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0} color="transparent" sx={{ borderBottom: '1px solid rgba(148,163,184,0.16)' }}>
        <Toolbar sx={{ display: 'flex', gap: 2 }}>
          <Bolt color="secondary" />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Crypto Pulse
          </Typography>
          <SymbolSelector />
          <ConnectionStatusChip status={connectionStatus} />
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={4}>
          <GlobalMetricsPanel />
          {loading && !summary ? (
            <Stack alignItems="center" py={8}>
              <CircularProgress />
            </Stack>
          ) : (
            <Stack spacing={4}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {selectedSymbol} Overview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <PricePerformance summary={summary} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <PriceSparkline series={summary?.series} />
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <OrderBookPanel depth={summary?.depth} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <MomentumGauge momentum={metrics?.momentum} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <PriceBandsCard priceBands={metrics?.priceBands} />
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TradeTape trades={summary?.trades} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TradeSummaryCard largestTrade={metrics?.largestTrade} smallestTrade={metrics?.smallestTrade} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <LiquidityPulse orderBook={metrics?.orderBook} />
                </Grid>
              </Grid>
            </Stack>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <MarketLeadersTable />
            </Grid>
            <Grid item xs={12} md={5}>
              <ExtremeMoversList />
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

export default AppShell;
