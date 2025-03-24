import { StyleSheet } from 'react-native';
import { theme } from '../../../theme';

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  weatherCard: {
    borderRadius: theme.spacing.sm,
    backgroundColor: theme.colors.background.subtle,
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
  },
  compactContent: {
    padding: theme.spacing.xs,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  weatherCondition: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  weatherTemperature: {
    ...theme.typography.heading3,
    color: theme.colors.text.primary,
  },
  weatherDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherDetail: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    width: 48,
    height: 48,
  },
  compactIcon: {
    width: 36,
    height: 36,
  },
  detailIcon: {
    width: 12,
    height: 12,
    marginRight: theme.spacing.xs / 2,
  },
  title: {
    ...theme.typography.caption,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs / 2,
    textTransform: 'uppercase',
  }
});

export default styles;