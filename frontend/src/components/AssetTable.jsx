import { useMemo, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery } from '@apollo/client';
import { ASSETS_TABLE_QUERY } from '../graphql/queries.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

const coerceNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const normalised = trimmed.replace(/,/g, '');
    const parsed = Number.parseFloat(normalised);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatPrice = (value) => {
  const numeric = coerceNumber(value);
  return numeric === null ? '—' : currencyFormatter.format(numeric);
};

const formatPercent = (value) => {
  const numeric = coerceNumber(value);
  return numeric === null ? '—' : `${numeric.toFixed(2)}%`;
};

const formatCompactCurrency = (value) => {
  const numeric = coerceNumber(value);
  return numeric === null ? '—' : `$${numberFormatter.format(numeric)}`;
};

const formatCompactNumber = (value) => {
  const numeric = coerceNumber(value);
  return numeric === null ? '—' : numberFormatter.format(numeric);
};

export function AssetTable({ rows }) {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const { data, loading } = useQuery(ASSETS_TABLE_QUERY, {
    variables: {
      limit: paginationModel.pageSize,
      offset: paginationModel.page * paginationModel.pageSize,
    },
    fetchPolicy: 'cache-and-network',
  });

  const liveRows = rows.map((asset) => ({
    ...asset,
    id: asset.id,
  }));

  const combinedRows = useMemo(() => {
    const graphRows = data?.assets ?? [];
    if (!graphRows.length) {
      return liveRows;
    }
    const liveMap = new Map(liveRows.map((asset) => [asset.id, asset]));
    return graphRows.map((asset) => ({
      ...asset,
      ...liveMap.get(asset.id),
    }));
  }, [data, liveRows]);

  const columns = useMemo(
    () => [
      { field: 'rank', headerName: '#', width: 70, align: 'center', headerAlign: 'center' },
      { field: 'symbol', headerName: 'Symbol', width: 120 },
      { field: 'name', headerName: 'Name', width: 200 },
      {
        field: 'priceUsd',
        headerName: 'Price',
        flex: 1,
        valueFormatter: ({ value }) => formatPrice(value),
      },
      {
        field: 'changePercent24Hr',
        headerName: '24h %',
        width: 120,
        valueFormatter: ({ value }) => formatPercent(value),
        cellClassName: (params) => {
          const numeric = coerceNumber(params.value);
          if (numeric === null) {
            return '';
          }
          return numeric >= 0 ? 'gain-cell' : 'loss-cell';
        },
      },
      {
        field: 'marketCapUsd',
        headerName: 'Market Cap',
        flex: 1,
        valueFormatter: ({ value }) => formatCompactCurrency(value),
      },
      {
        field: 'volumeUsd24Hr',
        headerName: '24h Volume',
        flex: 1,
        valueFormatter: ({ value }) => formatCompactCurrency(value),
      },
      {
        field: 'supply',
        headerName: 'Circulating Supply',
        flex: 1,
        valueFormatter: ({ value }) => formatCompactNumber(value),
      },
    ],
    [],
  );

  return (
    <Card sx={{ backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 3, border: '1px solid rgba(148,163,184,0.2)' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Real-time Asset Ledger
        </Typography>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={combinedRows}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableColumnMenu
            sx={{
              border: 'none',
              color: 'text.primary',
              '& .MuiDataGrid-cell': {
                borderColor: 'rgba(148,163,184,0.2)',
              },
              '& .gain-cell': {
                color: '#4ade80',
                fontWeight: 600,
              },
              '& .loss-cell': {
                color: '#f87171',
                fontWeight: 600,
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'rgba(30,41,59,0.6)',
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
