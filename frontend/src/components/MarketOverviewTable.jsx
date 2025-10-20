import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from '@mui/material';
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js';

export const MarketOverviewTable = ({ rows }) => {
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box px={2} py={2} borderBottom={1} borderColor="divider">
        <Typography variant="h6">Market Overview</Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time performance metrics for your watchlist.
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 420 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Change</TableCell>
              <TableCell align="right">24h High</TableCell>
              <TableCell align="right">24h Low</TableCell>
              <TableCell align="right">24h Volume</TableCell>
              <TableCell align="right">Quote Volume</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow hover key={row.symbol}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">{row.symbol}</Typography>
                    <Chip
                      size="small"
                      color={row.priceChangePercent >= 0 ? 'success' : 'error'}
                      label={formatPercent(row.priceChangePercent)}
                    />
                  </Box>
                </TableCell>
                <TableCell align="right">{formatCurrency(row.lastPrice)}</TableCell>
                <TableCell align="right" sx={{ color: row.priceChangePercent >= 0 ? 'success.main' : 'error.main' }}>
                  {formatPercent(row.priceChangePercent)}
                </TableCell>
                <TableCell align="right">{formatCurrency(row.highPrice)}</TableCell>
                <TableCell align="right">{formatCurrency(row.lowPrice)}</TableCell>
                <TableCell align="right">{formatNumber(row.volume, 0)}</TableCell>
                <TableCell align="right">{formatCurrency(row.quoteVolume)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

MarketOverviewTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object),
};
