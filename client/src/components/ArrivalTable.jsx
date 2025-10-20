import PropTypes from 'prop-types';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack
} from '@mui/material';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';

export const ArrivalTable = ({ arrivals }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Stop level arrival insights
    </Typography>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Stop</TableCell>
            <TableCell>Platforms</TableCell>
            <TableCell>Average wait</TableCell>
            <TableCell>Soonest arrival</TableCell>
            <TableCell>Line share</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {arrivals.map((arrival) => (
            <TableRow key={arrival.stopPointId}>
              <TableCell>{arrival.stopName}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {arrival.platforms.map((platform) => (
                    <Chip key={platform} label={platform} size="small" />
                  ))}
                </Stack>
              </TableCell>
              <TableCell>{arrival.averageWait ? `${Math.round(arrival.averageWait / 60)} mins` : 'N/A'}</TableCell>
              <TableCell>
                {arrival.soonestArrival
                  ? formatDistanceToNowStrict(parseISO(arrival.soonestArrival), { addSuffix: true })
                  : 'Unknown'}
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {arrival.lineSpread.map((line) => (
                    <Chip
                      key={line.lineName}
                      label={`${line.lineName} (${line.count})`}
                      size="small"
                      color="secondary"
                    />
                  ))}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

ArrivalTable.propTypes = {
  arrivals: PropTypes.arrayOf(
    PropTypes.shape({
      stopPointId: PropTypes.string.isRequired,
      stopName: PropTypes.string,
      platforms: PropTypes.arrayOf(PropTypes.string).isRequired,
      averageWait: PropTypes.number,
      soonestArrival: PropTypes.string,
      lineSpread: PropTypes.arrayOf(
        PropTypes.shape({
          lineName: PropTypes.string.isRequired,
          count: PropTypes.number.isRequired
        })
      ).isRequired
    })
  ).isRequired
};
