import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const formatPrice = (value) => `$${Number(value).toFixed(2)}`;

export function LiveTicker({ assets }) {
  const highlights = useMemo(() => {
    const sorted = [...assets].sort((a, b) => b.volumeUsd24Hr - a.volumeUsd24Hr);
    const top = sorted.slice(0, 8);
    return [...top, ...top];
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
                color: Number(asset.changePercent24Hr) >= 0 ? '#4ade80' : '#f87171',
                fontWeight: 600,
              }}
            >
              {Number(asset.changePercent24Hr).toFixed(2)}%
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
