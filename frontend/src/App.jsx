import { useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';

import { Header } from './components/Header.jsx';
import { SummaryCards } from './components/SummaryCards.jsx';
import { MarketMovers } from './components/MarketMovers.jsx';
import { ChangeDistributionChart } from './components/ChangeDistributionChart.jsx';
import { DominancePie } from './components/DominancePie.jsx';
import { LiveTicker } from './components/LiveTicker.jsx';
import { useLiveAssets } from './hooks/useLiveAssets.js';
import { DASHBOARD_QUERY } from './graphql/queries.js';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0f172a',
      paper: 'rgba(15,23,42,0.6)',
    },
    primary: {
      main: '#38bdf8',
      light: '#a855f7',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

export default function App() {
  const live = useLiveAssets();
  const { data, loading, refetch } = useQuery(DASHBOARD_QUERY, {
    variables: { assetLimit: 5 },
    pollInterval: 60000,
  });

  useEffect(() => {
    if (live.status === 'connected') {
      refetch();
    }
  }, [live.status, refetch]);

  const liveSummary = useMemo(() => {
    if (!live.assets.length) {
      return null;
    }

    const roundValue = (value, digits = 2) => {
      const parsed = Number.parseFloat(value);
      if (!Number.isFinite(parsed)) {
        return 0;
      }
      return Number.parseFloat(parsed.toFixed(digits));
    };

    const totalMarketCap = live.assets.reduce((sum, asset) => sum + (Number(asset.marketCapUsd) || 0), 0);
    const totalVolume = live.assets.reduce((sum, asset) => sum + (Number(asset.volumeUsd24Hr) || 0), 0);
    const averageChange =
      live.assets.reduce((sum, asset) => sum + (Number(asset.changePercent24Hr) || 0), 0) / live.assets.length;
    const positiveChangeCount = live.assets.filter((asset) => Number(asset.changePercent24Hr) >= 0).length;

    return {
      totalMarketCapUsd: roundValue(totalMarketCap, 0),
      totalVolumeUsd24Hr: roundValue(totalVolume, 0),
      averageChangePercent24Hr: roundValue(averageChange, 2),
      assetsTracked: live.assets.length,
      positiveChangeCount,
      negativeChangeCount: live.assets.length - positiveChangeCount,
      lastUpdated: live.lastUpdated,
      dataSource: live.source,
    };
  }, [live.assets, live.lastUpdated, live.source]);

  const summary = liveSummary ?? data?.marketSummary;
  const movers = data?.topMovers;
  const distribution = data?.changeDistribution ?? [];
  const dominance = data?.dominance ?? [];
  const dataSource = summary?.dataSource ?? live.source;
  const dataSourceDescription = {
    coinmarketcap: 'CoinMarketCap live market data',
    synthetic: 'Bundled offline snapshot with synthetic updates',
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header
        status={live.status}
        lastUpdated={live.lastUpdated ?? summary?.lastUpdated}
        dataSource={dataSource}
        warning={live.warning}
      />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LiveTicker assets={live.assets} />
        <SummaryCards summary={summary} />
        {dataSource ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Data source: {dataSourceDescription[dataSource] ?? dataSource}
          </Typography>
        ) : null}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, lg: 4 }}>
            {loading && !movers ? (
              <Skeleton variant="rounded" height={360} />
            ) : (
              <MarketMovers movers={movers} />
            )}
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            {loading && !distribution.length ? (
              <Skeleton variant="rounded" height={360} />
            ) : (
              <ChangeDistributionChart data={distribution} />
            )}
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            {loading && !dominance.length ? (
              <Skeleton variant="rounded" height={360} />
            ) : (
              <DominancePie data={dominance} />
            )}
          </Grid>
        </Grid>
        <Stack direction="row" justifyContent="flex-end" mt={4}>
          <Typography variant="caption" color="text.secondary">
            Powered by CoinMarketCap market data (with offline synthetic fallback)
          </Typography>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
