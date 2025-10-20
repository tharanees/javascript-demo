import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-US');

export function VelocityGauge({ metric }) {
  const rawValue = Number.isFinite(metric?.averageVelocityPercent) ? metric.averageVelocityPercent : null;
  const gaugeValue = rawValue === null ? 0 : Math.max(0, Math.min(rawValue, 100));
  const formattedValue = rawValue === null ? '—' : percentFormatter.format(rawValue / 100);
  const sampleSizeLabel = Number.isFinite(metric?.sampleSize) ? numberFormatter.format(metric.sampleSize) : '—';
  const data = [{ name: 'velocity', value: gaugeValue, fill: 'url(#velocityGradient)' }];

  return (
    <Card sx={{ backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 3, border: '1px solid rgba(148,163,184,0.2)', height: '100%' }}>
      <CardContent sx={{ height: 320 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Price Velocity Snapshot
        </Typography>
        <ResponsiveContainer width="100%" height="80%">
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={16} background={{ fill: 'rgba(148,163,184,0.15)' }} />
            <defs>
              <linearGradient id="velocityGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </RadialBarChart>
        </ResponsiveContainer>
        <Typography variant="h3" fontWeight={700} textAlign="center">
          {formattedValue}
        </Typography>
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
          Based on {sampleSizeLabel} asset velocity samples
        </Typography>
      </CardContent>
    </Card>
  );
}
