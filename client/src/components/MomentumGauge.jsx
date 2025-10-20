import PropTypes from 'prop-types';
import { Card, CardContent, Typography } from '@mui/material';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function MomentumGauge({ momentum }) {
  if (!momentum?.length) {
    return null;
  }

  const data = momentum.map((value, index) => ({
    label: `Δ${index}`,
    value
  }));

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Momentum Pulses
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <XAxis dataKey="label" stroke="#475569" />
            <YAxis stroke="#475569" tickFormatter={(tick) => `${tick.toFixed(1)}%`} />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
              formatter={(value) => `${value.toFixed(2)}%`}
              contentStyle={{ background: '#111c34', border: '1px solid #1e293b' }}
            />
            <Bar dataKey="value" fill="#ffc947" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

MomentumGauge.propTypes = {
  momentum: PropTypes.arrayOf(PropTypes.number)
};

MomentumGauge.defaultProps = {
  momentum: []
};

export default MomentumGauge;
