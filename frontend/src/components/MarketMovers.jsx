import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const coerceNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const normalised = trimmed.replace(/,/g, '');
    const parsed = Number.parseFloat(normalised);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatPrice = (value) => {
  const numeric = coerceNumber(value);
  return numeric === null ? '—' : currencyFormatter.format(numeric);
};

const resolveChipVisuals = (value, accentColor) => {
  const numeric = coerceNumber(value);
  if (numeric === null) {
    return {
      label: '—',
      backgroundColor: 'rgba(148,163,184,0.25)',
      color: 'rgba(226,232,240,0.85)',
    };
  }

  return {
    label: `${numeric.toFixed(2)}%`,
    backgroundColor: accentColor,
    color: '#0f172a',
  };
};

function MoversList({ title, data, color }) {
  const filtered = data.filter(
    (asset) => Number.isFinite(coerceNumber(asset.changePercent24Hr)) || Number.isFinite(coerceNumber(asset.priceUsd)),
  );

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase">
        {title}
      </Typography>
      <Stack spacing={1.5}>
        {filtered.map((asset) => {
          const chipVisuals = resolveChipVisuals(asset.changePercent24Hr, color);
          return (
            <Stack key={asset.id} direction="row" justifyContent="space-between" alignItems="center">
              <Stack spacing={0.3}>
                <Typography variant="body1" fontWeight={600} color="text.primary">
                  {asset.symbol}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {asset.name}
                </Typography>
              </Stack>
              <Stack spacing={0.5} alignItems="flex-end">
                <Typography variant="body2" color="text.secondary">
                  {formatPrice(asset.priceUsd)}
                </Typography>
                <Chip
                  label={chipVisuals.label}
                  size="small"
                  sx={{
                    backgroundColor: chipVisuals.backgroundColor,
                    color: chipVisuals.color,
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

export function MarketMovers({ movers }) {
  const gainers = movers?.gainers ?? [];
  const losers = movers?.losers ?? [];

  return (
    <Card sx={{ height: '100%', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 3, border: '1px solid rgba(148,163,184,0.2)' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Market Movers
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <MoversList title="Top Gainers" data={gainers} color="rgba(34,197,94,0.4)" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <MoversList title="Top Losers" data={losers} color="rgba(248,113,113,0.4)" />
          </Grid>
        </Grid>
      </CardContent>
      <Divider sx={{ opacity: 0.2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
        Ranked by 24 hour percentage change
      </Typography>
    </Card>
  );
}
