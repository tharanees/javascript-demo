import PropTypes from 'prop-types';
import { Avatar, Chip, Divider, List, ListItem, ListItemAvatar, ListItemText, Paper, Typography } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import InfoIcon from '@mui/icons-material/Info';

const disruptionIcon = (category) => {
  if (!category) return <InfoIcon />;
  if (category.toLowerCase().includes('sev')) {
    return <ReportProblemIcon color="error" />;
  }
  return <InfoIcon color="warning" />;
};

export const DisruptionList = ({ disruptions }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Network disruptions
    </Typography>
    <List dense>
      {disruptions.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No active disruptions reported.
        </Typography>
      )}
      {disruptions.map((disruption, index) => (
        <>
          <ListItem alignItems="flex-start" key={`${disruption.lineId}-${index}`}>
            <ListItemAvatar>
              <Avatar>{disruptionIcon(disruption.category)}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={disruption.summary || disruption.description || 'Disruption'}
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.secondary">
                    {disruption.description}
                  </Typography>
                  <Chip
                    label={disruption.category || 'Info'}
                    color="warning"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                  {disruption.additionalInfo && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {disruption.additionalInfo}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
          {index < disruptions.length - 1 && <Divider component="li" />}
        </>
      ))}
    </List>
  </Paper>
);

DisruptionList.propTypes = {
  disruptions: PropTypes.arrayOf(
    PropTypes.shape({
      lineId: PropTypes.string,
      category: PropTypes.string,
      description: PropTypes.string,
      summary: PropTypes.string,
      additionalInfo: PropTypes.string
    })
  ).isRequired
};
