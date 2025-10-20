import { useMemo } from 'react';
import { Card, CardContent, List, ListItem, ListItemText, Typography } from '@mui/material';
import useDashboardStore from '../state/useDashboardStore.js';
import { GLOBAL_METRICS } from '../graphql/queries.js';
import { useQuery } from '@apollo/client/react';
import { formatPercent } from '../utils/format.js';

function ExtremeMoversList() {
  const { data } = useQuery(GLOBAL_METRICS, { pollInterval: 60000 });
  const realtime = useDashboardStore((state) => state.globalMetrics);

  const movers = useMemo(() => realtime?.extremeMovers || data?.globalMetrics?.extremeMovers || [], [data, realtime]);

  if (!movers.length) {
    return null;
  }

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Extreme Movers
        </Typography>
        <List dense>
          {movers.slice(0, 12).map((mover) => (
            <ListItem key={mover.symbol} sx={{ px: 0 }}>
              <ListItemText
                primary={mover.symbol}
                secondary={`Δ ${formatPercent(mover.priceChangePercent)} | H:${mover.highPrice} L:${mover.lowPrice}`}
                secondaryTypographyProps={{ color: mover.priceChangePercent >= 0 ? 'success.light' : 'error.light' }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default ExtremeMoversList;
