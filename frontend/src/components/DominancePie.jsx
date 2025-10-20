import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#38bdf8', '#818cf8', '#f472b6', '#facc15', '#34d399', '#fb7185'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }
  const item = payload[0];
  return (
    <Card sx={{ p: 1.5, backgroundColor: 'rgba(15,23,42,0.9)' }}>
      <Typography variant="caption" color="text.secondary">
        {item.payload.symbol}
      </Typography>
      <Typography variant="body2" color="text.primary" fontWeight={600}>
        {item.value.toFixed(2)}% dominance
      </Typography>
    </Card>
  );
}

export function DominancePie({ data }) {
  return (
    <Card sx={{ backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 3, border: '1px solid rgba(148,163,184,0.2)', height: '100%' }}>
      <CardContent sx={{ height: 320 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Market Dominance (Top Assets)
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie dataKey="dominancePercent" data={data} innerRadius={60} outerRadius={100} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={entry.assetId} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
          {data.map((entry, index) => (
            <Stack key={entry.assetId} direction="row" spacing={1} alignItems="center">
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {entry.symbol}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
