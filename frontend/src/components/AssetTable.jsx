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
        valueFormatter: ({ value }) => currencyFormatter.format(Number(value || 0)),
      },
      {
        field: 'changePercent24Hr',
        headerName: '24h %',
        width: 120,
        valueFormatter: ({ value }) => `${Number(value || 0).toFixed(2)}%`,
        cellClassName: (params) => (Number(params.value) >= 0 ? 'gain-cell' : 'loss-cell'),
      },
      {
        field: 'marketCapUsd',
        headerName: 'Market Cap',
        flex: 1,
        valueFormatter: ({ value }) => `$${numberFormatter.format(Number(value || 0))}`,
      },
      {
        field: 'volumeUsd24Hr',
        headerName: '24h Volume',
        flex: 1,
        valueFormatter: ({ value }) => `$${numberFormatter.format(Number(value || 0))}`,
      },
      {
        field: 'supply',
        headerName: 'Circulating Supply',
        flex: 1,
        valueFormatter: ({ value }) => numberFormatter.format(Number(value || 0)),
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
