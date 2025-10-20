import PropTypes from 'prop-types';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { formatCurrency } from '../utils/format.js';

function PriceBandsCard({ priceBands }) {
  if (!priceBands) {
    return null;
  }
  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Price Bands (3h)
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Average {formatCurrency(priceBands.average, 4)}
          </Typography>
          <Typography variant="body2" color="success.light">
            High {formatCurrency(priceBands.highest, 4)}
          </Typography>
          <Typography variant="body2" color="error.light">
            Low {formatCurrency(priceBands.lowest, 4)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

PriceBandsCard.propTypes = {
  priceBands: PropTypes.shape({
    highest: PropTypes.number,
    lowest: PropTypes.number,
    average: PropTypes.number
  })
};

PriceBandsCard.defaultProps = {
  priceBands: null
};

export default PriceBandsCard;
