import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Autocomplete, Box, Chip, TextField, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useDashboardStore } from '../state/dashboardStore.js';

const DEFAULT_OPTIONS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT'];

export const SymbolSelector = ({ symbols }) => {
  const { selectedSymbols, setSelectedSymbols, primarySymbol, setPrimarySymbol } = useDashboardStore((state) => ({
    selectedSymbols: state.selectedSymbols,
    setSelectedSymbols: state.setSelectedSymbols,
    primarySymbol: state.primarySymbol,
    setPrimarySymbol: state.setPrimarySymbol,
  }));

  const options = useMemo(() => {
    const whitelisted = (symbols?.length ? symbols : DEFAULT_OPTIONS).filter((symbol) => symbol.endsWith('USDT'));
    return Array.from(new Set([...whitelisted, ...DEFAULT_OPTIONS, ...selectedSymbols])).sort();
  }, [symbols, selectedSymbols]);

  return (
    <Box display="flex" gap={3} flexWrap="wrap">
      <Box flex={1} minWidth={280}>
        <Typography variant="subtitle2" gutterBottom color="text.secondary">
          Watchlist Symbols
        </Typography>
        <Autocomplete
          multiple
          options={options}
          value={selectedSymbols}
          onChange={(_, newValue) => setSelectedSymbols(newValue.slice(0, 12))}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />)
          }
          renderInput={(params) => <TextField {...params} label="Add symbols" placeholder="Search" size="small" />}
        />
      </Box>
      <Box minWidth={200}>
        <Typography variant="subtitle2" gutterBottom color="text.secondary">
          Focus Symbol
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel id="primary-symbol-label">Symbol</InputLabel>
          <Select
            labelId="primary-symbol-label"
            label="Symbol"
            value={primarySymbol || ''}
            onChange={(event) => setPrimarySymbol(event.target.value)}
            disabled={!selectedSymbols.length}
          >
            {selectedSymbols.map((symbol) => (
              <MenuItem value={symbol} key={symbol}>
                {symbol}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

SymbolSelector.propTypes = {
  symbols: PropTypes.arrayOf(PropTypes.string),
};
