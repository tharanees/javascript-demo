import PropTypes from 'prop-types';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Typography
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

const severityColor = (severity) => {
  if (!severity) return 'default';
  if (severity <= 5) return 'error';
  if (severity <= 8) return 'warning';
  return 'success';
};

const severityIcon = (severity) => {
  if (!severity) return <InfoIcon fontSize="small" />;
  if (severity <= 5) return <WarningIcon fontSize="small" />;
  if (severity <= 8) return <InfoIcon fontSize="small" />;
  return <CheckCircleIcon fontSize="small" />;
};

export const LineStatusGrid = ({ lines }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Line performance snapshot
    </Typography>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Line</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Active disruptions</TableCell>
            <TableCell>Service types</TableCell>
            <TableCell>Last update</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line) => {
            const latestStatus = [...line.statuses].sort((a, b) => new Date(b.created) - new Date(a.created))[0];
            return (
              <TableRow key={line.id} hover>
                <TableCell width="15%">
                  <Typography variant="subtitle2">{line.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {line.modeName}
                  </Typography>
                </TableCell>
                <TableCell width="30%">
                  <Chip
                    icon={severityIcon(latestStatus?.statusSeverity)}
                    label={latestStatus?.statusSeverityDescription || 'Unknown'}
                    color={severityColor(latestStatus?.statusSeverity)}
                  />
                  {latestStatus?.reason && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {latestStatus.reason}
                    </Typography>
                  )}
                </TableCell>
                <TableCell width="15%">{line.disruptions.length}</TableCell>
                <TableCell width="20%">
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {line.serviceTypes.map((service) => (
                      <Chip key={service.name} size="small" label={service.name} variant="outlined" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell width="20%">
                  {latestStatus?.created && new Date(latestStatus.created).toLocaleTimeString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

LineStatusGrid.propTypes = {
  lines: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      modeName: PropTypes.string.isRequired,
      statuses: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          statusSeverity: PropTypes.number,
          statusSeverityDescription: PropTypes.string,
          reason: PropTypes.string,
          created: PropTypes.string
        })
      ).isRequired,
      disruptions: PropTypes.array.isRequired,
      serviceTypes: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string.isRequired })).isRequired
    })
  ).isRequired
};
