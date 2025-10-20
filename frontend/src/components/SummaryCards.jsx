import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import GroupsIcon from '@mui/icons-material/Groups';
import SsidChartIcon from '@mui/icons-material/SsidChart';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);

const cards = [
  {
    title: 'Total Market Cap',
    icon: <TrendingUpIcon />,
    key: 'totalMarketCapUsd',
    formatter: (value) => `$${formatCurrency(value)}`,
  },
  {
    title: '24h Volume',
    icon: <SsidChartIcon />,
    key: 'totalVolumeUsd24Hr',
    formatter: (value) => `$${formatCurrency(value)}`,
  },
  {
    title: 'Avg. Change (24h)',
    icon: <ShowChartIcon />,
    key: 'averageChangePercent24Hr',
    formatter: (value) => `${value.toFixed(2)}%`,
  },
  {
    title: 'Assets Tracked',
    icon: <GroupsIcon />,
    key: 'assetsTracked',
    formatter: (value) => value,
  },
];

export function SummaryCards({ summary }) {
  const resolveValue = (card) => {
    if (!summary) {
      return '—';
    }

    const value = summary[card.key];
    if (!Number.isFinite(value)) {
      return '—';
    }

    return card.formatter(value);
  };

  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {cards.map((card) => (
        <Grid key={card.key} size={{ xs: 12, md: 6, lg: 3 }}>
          <Card sx={{ backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 3, border: '1px solid rgba(148,163,184,0.2)' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)' }}>{card.icon}</Avatar>
                <Stack>
                  <Typography variant="body2" color="text.secondary">
                    {card.title}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    {resolveValue(card)}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
