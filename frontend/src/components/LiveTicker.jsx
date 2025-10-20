import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

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
  return numeric === null ? '$—' : `$${numeric.toFixed(2)}`;
};

const formatChange = (value) => {
  const numeric = coerceNumber(value);
  return numeric === null ? '—' : `${numeric.toFixed(2)}%`;
};

const resolveChangeColor = (value) => {
  const numeric = coerceNumber(value);
  if (numeric === null) {
    return 'text.secondary';
  }
  return numeric >= 0 ? '#4ade80' : '#f87171';
};

export function LiveTicker({ assets }) {
  const highlights = useMemo(() => {
    const sortable = assets.filter(
      (asset) => Number.isFinite(coerceNumber(asset.volumeUsd24Hr)) && Number.isFinite(coerceNumber(asset.priceUsd)),
    );
    const sorted = [...sortable].sort(
      (a, b) => (coerceNumber(b.volumeUsd24Hr) ?? 0) - (coerceNumber(a.volumeUsd24Hr) ?? 0),
    );
    const top = sorted.slice(0, 8);
    return top.length ? [...top, ...top] : [];
  }, [assets]);

  return (
    <Box
      sx={{
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid rgba(148,163,184,0.2)',
        background: 'linear-gradient(90deg, rgba(59,130,246,0.25), rgba(168,85,247,0.25))',
        p: 1.5,
        mb: 3,
      }}
    >
      <Stack direction="row" spacing={4} sx={{ animation: highlights.length ? 'ticker 30s linear infinite' : 'none' }}>
        {highlights.map((asset, index) => (
          <Stack key={`${asset.id}-${index}`} spacing={0.5} direction="row" alignItems="center">
            <Typography variant="body2" fontWeight={700} color="text.primary">
              {asset.symbol}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatPrice(asset.priceUsd)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: resolveChangeColor(asset.changePercent24Hr),
                fontWeight: 600,
              }}
            >
              {formatChange(asset.changePercent24Hr)}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </Box>
  );
}
