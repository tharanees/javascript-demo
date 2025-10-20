import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Autocomplete, TextField, Stack, Typography } from '@mui/material';
import useDashboardStore from '../state/useDashboardStore.js';
import { SYMBOLS } from '../graphql/queries.js';

function SymbolSelector() {
  const { data } = useQuery(SYMBOLS, { variables: { limit: 200 } });
  const selectedSymbol = useDashboardStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useDashboardStore((state) => state.setSelectedSymbol);

  const options = useMemo(() => data?.symbols || [], [data]);

  return (
    <Stack spacing={1}>
      <Typography variant="overline" color="text.secondary">
        Asset
      </Typography>
      <Autocomplete
        options={options}
        value={selectedSymbol}
        onChange={(_, value) => value && setSelectedSymbol(value)}
        isOptionEqualToValue={(option, value) => option === value}
        renderInput={(params) => <TextField {...params} size="small" placeholder="Search asset" />}
        sx={{ minWidth: 220 }}
      />
    </Stack>
  );
}

export default SymbolSelector;
