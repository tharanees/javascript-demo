import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <Card sx={{ p: 1.5, backgroundColor: 'rgba(15,23,42,0.9)' }}>
        <Typography variant="caption" color="text.secondary">
          {item.payload.label}
        </Typography>
        <Typography variant="body2" color="text.primary" fontWeight={600}>
          {item.value} assets
        </Typography>
      </Card>
    );
  }
  return null;
}

export function ChangeDistributionChart({ data }) {
  return (
    <Card sx={{ backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 3, border: '1px solid rgba(148,163,184,0.2)', height: '100%' }}>
      <CardContent sx={{ height: 320 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          24h Change Distribution
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="label" stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.2)' }} />
            <YAxis allowDecimals={false} stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.2)' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.1)' }} />
            <Bar dataKey="count" fill="url(#changeGradient)" radius={[8, 8, 0, 0]} />
            <defs>
              <linearGradient id="changeGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
