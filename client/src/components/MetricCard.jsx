import PropTypes from 'prop-types';
import { Card, CardContent, Stack, Typography, Box } from '@mui/material';

function MetricCard({ title, value, subtitle, trend, trendColor, icon }) {
  return (
    <Card elevation={0} sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          {icon && <Box color="primary.light">{icon}</Box>}
          <Stack spacing={1} flex={1}>
            <Typography variant="overline" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" color="text.primary">
              {value}
            </Typography>
            {(subtitle || trend) && (
              <Stack direction="row" spacing={1} alignItems="center">
                {trend && (
                  <Typography variant="body2" color={trendColor || 'text.secondary'}>
                    {trend}
                  </Typography>
                )}
                {subtitle && (
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  trend: PropTypes.node,
  trendColor: PropTypes.string,
  icon: PropTypes.node
};

MetricCard.defaultProps = {
  subtitle: null,
  trend: null,
  trendColor: undefined,
  icon: null
};

export default MetricCard;
