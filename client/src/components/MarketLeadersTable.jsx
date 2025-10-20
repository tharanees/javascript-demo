import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { MARKET_LEADERS } from '../graphql/queries.js';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';

const SORT_OPTIONS = [
  { value: 'priceChangePercent', label: 'Top Movers' },
  { value: 'quoteVolume', label: 'Volume' },
  { value: 'weightedAvgPrice', label: 'Weighted Price' }
];

function MarketLeadersTable() {
  const [sortKey, setSortKey] = useState('priceChangePercent');
  const { data, loading } = useQuery(MARKET_LEADERS, {
    variables: { limit: 25, sortKey },
    pollInterval: 30000
  });

  const rows = useMemo(() => data?.marketLeaders || [], [data]);

  const columns = [
    { field: 'symbol', headerName: 'Symbol', flex: 1 },
    {
      field: 'price',
      headerName: 'Last Price',
      flex: 1,
      valueFormatter: ({ value }) => formatCurrency(value, 4)
    },
    {
      field: 'priceChangePercent',
      headerName: '24h %',
      flex: 1,
      valueFormatter: ({ value }) => formatPercent(value),
      cellClassName: (params) => (params.value >= 0 ? 'positive' : 'negative')
    },
    {
      field: 'volume',
      headerName: 'Volume',
      flex: 1,
      valueFormatter: ({ value }) => formatNumber(value)
    },
    {
      field: 'quoteVolume',
      headerName: 'Quote Volume',
      flex: 1,
      valueFormatter: ({ value }) => formatCurrency(value)
    }
  ];

  return (
    <Stack spacing={2} height="100%">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Market Leaders</Typography>
        <ToggleButtonGroup value={sortKey} exclusive size="small" onChange={(_, value) => value && setSortKey(value)}>
          {SORT_OPTIONS.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 360, '& .positive': { color: 'success.light' }, '& .negative': { color: 'error.light' } }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.symbol}
          density="compact"
          disableRowSelectionOnClick
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } }
          }}
          pageSizeOptions={[10, 15, 25]}
          sx={{ border: 'none', color: 'text.primary', '--DataGrid-containerBackground': 'transparent' }}
        />
      </Box>
    </Stack>
  );
}

export default MarketLeadersTable;
