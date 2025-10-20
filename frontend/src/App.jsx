import { useEffect, useMemo } from 'react';
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Toolbar,
  Typography,
  Grid,
  ThemeProvider,
  createTheme,
  CircularProgress,
  Stack,
  IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQuery } from '@apollo/client';
import { SymbolSelector } from './components/SymbolSelector.jsx';
import { TickerGrid } from './components/TickerGrid.jsx';
import { MarketOverviewTable } from './components/MarketOverviewTable.jsx';
import { GlobalStatsPanel } from './components/GlobalStatsPanel.jsx';
import { OrderBookDepth } from './components/OrderBookDepth.jsx';
import { LiveTrades } from './components/LiveTrades.jsx';
import { PriceInsights } from './components/PriceInsights.jsx';
import {
  AVAILABLE_SYMBOLS_QUERY,
  MARKET_OVERVIEW_QUERY,
  GLOBAL_STATS_QUERY,
  ORDER_BOOK_QUERY,
  AGG_TRADES_QUERY,
  KLINES_QUERY,
} from './graphql/queries.js';
import { useDashboardStore } from './state/dashboardStore.js';
import { useBinanceStream } from './hooks/useBinanceStream.js';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0b0d17',
      paper: '#11152b',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
  },
});

const LoadingState = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight={160}>
    <CircularProgress />
  </Box>
);

export const App = () => {
  const {
    selectedSymbols,
    primarySymbol,
    tickerData,
    depthData,
    trades,
    setAvailableSymbols,
    upsertTicker,
    resetDepth,
    resetTrades,
  } = useDashboardStore((state) => ({
    selectedSymbols: state.selectedSymbols,
    primarySymbol: state.primarySymbol,
    tickerData: state.tickerData,
    depthData: state.depthData,
    trades: state.trades,
    setAvailableSymbols: state.setAvailableSymbols,
    upsertTicker: state.upsertTicker,
    resetDepth: state.resetDepth,
    resetTrades: state.resetTrades,
  }));

  useBinanceStream();

  const { data: availableSymbolsData } = useQuery(AVAILABLE_SYMBOLS_QUERY, {
    onCompleted: (data) => setAvailableSymbols(data.availableSymbols),
  });

  const marketOverviewQuery = useQuery(MARKET_OVERVIEW_QUERY, {
    variables: { symbols: selectedSymbols, forceRefresh: false },
    skip: !selectedSymbols.length,
    pollInterval: 15_000,
  });

  useEffect(() => {
    if (marketOverviewQuery.data?.marketOverview) {
      marketOverviewQuery.data.marketOverview.forEach((ticker) => {
        upsertTicker(ticker.symbol, ticker);
      });
    }
  }, [marketOverviewQuery.data, upsertTicker]);

  const globalStatsQuery = useQuery(GLOBAL_STATS_QUERY, {
    pollInterval: 60_000,
  });

  const orderBookQuery = useQuery(ORDER_BOOK_QUERY, {
    variables: { symbol: primarySymbol, limit: 20 },
    skip: !primarySymbol,
    pollInterval: 20_000,
    onCompleted: (data) => {
      if (data?.orderBook) {
        resetDepth(primarySymbol, data.orderBook);
      }
    },
  });

  const aggTradesQuery = useQuery(AGG_TRADES_QUERY, {
    variables: { symbol: primarySymbol, limit: 40 },
    skip: !primarySymbol,
    onCompleted: (data) => {
      if (data?.aggregateTrades) {
        resetTrades(primarySymbol, data.aggregateTrades);
      }
    },
  });

  const klinesQuery = useQuery(KLINES_QUERY, {
    variables: { symbol: primarySymbol, interval: '1m', limit: 60 },
    skip: !primarySymbol,
    pollInterval: 60_000,
  });

  const watchlistTickers = useMemo(() => {
    const fallbackTickers = marketOverviewQuery.data?.marketOverview || [];
    const fallbackMap = new Map(fallbackTickers.map((item) => [item.symbol, item]));
    return selectedSymbols
      .map((symbol) => tickerData[symbol] || fallbackMap.get(symbol))
      .filter(Boolean);
  }, [selectedSymbols, tickerData, marketOverviewQuery.data]);

  const primaryTicker = tickerData[primarySymbol];
  const depthSnapshot = depthData[primarySymbol];
  const recentTrades = trades[primarySymbol] || [];

  const handleRefresh = () => {
    marketOverviewQuery.refetch({ symbols: selectedSymbols, forceRefresh: true });
    globalStatsQuery.refetch();
    orderBookQuery.refetch();
    aggTradesQuery.refetch();
    klinesQuery.refetch();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: 'blur(12px)' }}>
        <Toolbar>
          <Box flexGrow={1}>
            <Typography variant="h6" fontWeight={600}>
              Crypto Intelligence Control Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time analytics powered by Binance spot market APIs
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <SymbolSelector symbols={availableSymbolsData?.availableSymbols} />
          {globalStatsQuery.loading ? (
            <LoadingState />
          ) : (
            <GlobalStatsPanel stats={globalStatsQuery.data?.globalStats} />
          )}
          <TickerGrid tickers={watchlistTickers} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              {klinesQuery.loading && !klinesQuery.data ? (
                <LoadingState />
              ) : (
                <PriceInsights symbol={primarySymbol} klines={klinesQuery.data?.klines} ticker={primaryTicker} />
              )}
            </Grid>
            <Grid item xs={12} md={5}>
              {orderBookQuery.loading && !depthSnapshot ? (
                <LoadingState />
              ) : (
                <OrderBookDepth symbol={primarySymbol} depth={depthSnapshot} />
              )}
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              {marketOverviewQuery.loading && !watchlistTickers.length ? (
                <LoadingState />
              ) : (
                <MarketOverviewTable rows={watchlistTickers} />
              )}
            </Grid>
            <Grid item xs={12} md={5}>
              {aggTradesQuery.loading && !recentTrades.length ? (
                <LoadingState />
              ) : (
                <LiveTrades symbol={primarySymbol} trades={recentTrades} />
              )}
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </ThemeProvider>
  );
};
