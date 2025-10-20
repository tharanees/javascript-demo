import PropTypes from 'prop-types';
import { Card, CardContent, Typography } from '@mui/material';

export const MetricCard = ({ title, value, caption, color = 'primary' }) => (
  <Card sx={{ minWidth: 200, borderLeft: (theme) => `4px solid ${theme.palette[color].main}` }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
      {caption && (
        <Typography variant="body2" color="text.secondary">
          {caption}
        </Typography>
      )}
    </CardContent>
  </Card>
);

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  caption: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info'])
};
