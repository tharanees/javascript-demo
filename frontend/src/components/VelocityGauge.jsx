import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

export function VelocityGauge({ metric }) {
  const value = metric?.averageVelocityPercent ?? 0;
  const data = [
    { name: 'velocity', value: Math.min(value, 100), fill: 'url(#velocityGradient)' },
  ];

  return (
    <Card sx={{ backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 3, border: '1px solid rgba(148,163,184,0.2)', height: '100%' }}>
      <CardContent sx={{ height: 320 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Price Velocity Snapshot
        </Typography>
        <ResponsiveContainer width="100%" height="80%">
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={16} />
            <defs>
              <linearGradient id="velocityGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </RadialBarChart>
        </ResponsiveContainer>
        <Typography variant="h3" fontWeight={700} textAlign="center">
          {value.toFixed(2)}%
        </Typography>
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
          Based on {metric?.sampleSize ?? 0} asset velocity samples
        </Typography>
      </CardContent>
    </Card>
  );
}
