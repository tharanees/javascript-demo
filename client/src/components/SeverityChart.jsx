import PropTypes from 'prop-types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Paper, Typography } from '@mui/material';

const transformData = (breakdown = []) =>
  breakdown.map(({ severity, count }) => ({ severity, count }));

export const SeverityChart = ({ breakdown }) => (
  <Paper sx={{ height: 320, p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Severity breakdown
    </Typography>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={transformData(breakdown)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="severity" interval={0} angle={-20} textAnchor="end" height={70} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </Paper>
);

SeverityChart.propTypes = {
  breakdown: PropTypes.arrayOf(
    PropTypes.shape({
      severity: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  )
};
