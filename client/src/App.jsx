import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  Box,
  Container,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert
} from '@mui/material';

import { DASHBOARD_QUERY } from './graphql/queries';
import { MetricCard } from './components/MetricCard';
import { SeverityChart } from './components/SeverityChart';
import { LineStatusGrid } from './components/LineStatusGrid';
import { ArrivalTable } from './components/ArrivalTable';
import { DisruptionList } from './components/DisruptionList';
import { RealtimeStatusBanner } from './components/RealtimeStatusBanner';
import { LoadingState } from './components/LoadingState';
import { useRealtimeSnapshot } from './hooks/useRealtimeSnapshot';

const STOP_POINTS = ['940GZZLUOXC', '940GZZLUKSX', '940GZZLUPAC'];

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || 'ws://localhost:4000/realtime';

const aggregateMetrics = (lineSummaries = []) => {
  const totals = lineSummaries.reduce(
    (acc, line) => {
      if ((line.statusSeverity || 0) >= 9) acc.good += 1;
      else if ((line.statusSeverity || 0) >= 6) acc.ok += 1;
      else acc.bad += 1;
      return acc;
    },
    { good: 0, ok: 0, bad: 0 }
  );

  return {
    total: lineSummaries.length,
    ...totals
  };
};

export default function App() {
  const [mode, setMode] = useState('tube');
  const { data, loading, error } = useQuery(DASHBOARD_QUERY, {
    variables: { mode, stopPointIds: STOP_POINTS }
  });

  const { snapshot, status: realtimeStatus } = useRealtimeSnapshot(REALTIME_URL);

  const effectiveSnapshot = snapshot || data?.insightSnapshot;
  const lineSummaries = useMemo(
    () => effectiveSnapshot?.lineSummaries ?? [],
    [effectiveSnapshot]
  );
  const metrics = useMemo(() => aggregateMetrics(lineSummaries), [lineSummaries]);
  const severityBreakdown = effectiveSnapshot?.severityBreakdown ?? [];
  const arrivalInsights = effectiveSnapshot?.arrivals ?? [];
  const disruptions = effectiveSnapshot?.disruptions ?? [];
  const lines = data?.lineStatuses ?? [];

  const handleModeChange = (_, newMode) => {
    if (newMode) {
      setMode(newMode);
    }
  };

  if (loading && !data) {
    return <LoadingState label="Fetching data from the TFL API" />;
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load dashboard data: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            TFL real-time operations console
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Granular insights across line performance, arrivals and disruptions powered by live TFL feeds.
          </Typography>
        </Box>
        <ToggleButtonGroup value={mode} exclusive onChange={handleModeChange} size="small">
          <ToggleButton value="tube">Tube</ToggleButton>
          <ToggleButton value="dlr">DLR</ToggleButton>
          <ToggleButton value="overground">Overground</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <RealtimeStatusBanner status={realtimeStatus} generatedAt={effectiveSnapshot?.generatedAt} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Total lines monitored"
            value={metrics.total}
            caption={`${metrics.good} good • ${metrics.ok} minor issues • ${metrics.bad} severe`}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard title="Active disruptions" value={disruptions.length} color="warning" />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Stops tracked"
            value={arrivalInsights.length}
            caption="Drill into platform level wait times"
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Realtime status"
            value={realtimeStatus}
            caption={`Snapshot generated ${effectiveSnapshot?.generatedAt ? new Date(effectiveSnapshot.generatedAt).toLocaleTimeString() : 'n/a'}`}
            color={realtimeStatus === 'connected' ? 'success' : realtimeStatus === 'connecting' ? 'info' : 'warning'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <SeverityChart breakdown={severityBreakdown} />
        </Grid>
        <Grid item xs={12} md={8}>
          <DisruptionList disruptions={disruptions} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <LineStatusGrid lines={lines} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ArrivalTable arrivals={arrivalInsights} />
        </Grid>
      </Grid>
    </Container>
  );
}
