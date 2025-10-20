import PropTypes from 'prop-types';
import { Card, CardContent, Typography } from '@mui/material';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import dayjs from 'dayjs';

function PriceSparkline({ series }) {
  if (!series?.length) {
    return null;
  }

  const data = series.map((point) => ({
    time: dayjs(point.time).format('HH:mm'),
    close: point.close
  }));

  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          60 Minute Price Trace
        </Typography>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#63a4ff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#63a4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#475569" interval={5} tick={{ fontSize: 12 }} />
            <YAxis stroke="#475569" domain={['dataMin', 'dataMax']} tick={{ fontSize: 12 }} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ background: '#111c34', border: '1px solid #1e293b' }}
            />
            <Area type="monotone" dataKey="close" stroke="#63a4ff" fillOpacity={1} fill="url(#colorClose)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

PriceSparkline.propTypes = {
  series: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.number,
      close: PropTypes.number
    })
  )
};

PriceSparkline.defaultProps = {
  series: []
};

export default PriceSparkline;
