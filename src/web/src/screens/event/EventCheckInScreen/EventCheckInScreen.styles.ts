import { StyleSheet } from 'react-native'; // ^0.71.0
import { theme } from '../../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main
  },
  contentContainer: {
    padding: theme.spacing.medium,
    flex: 1
  },
  card: {
    marginBottom: theme.spacing.medium
  },
  title: {
    ...theme.typography.heading2,
    marginBottom: theme.spacing.medium,
    textAlign: 'center',
    color: theme.colors.text.primary
  },
  subtitle: {
    ...theme.typography.body,
    marginBottom: theme.spacing.large,
    textAlign: 'center',
    color: theme.colors.text.secondary
  },
  buttonContainer: {
    marginTop: theme.spacing.large,
    marginBottom: theme.spacing.large
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large
  },
  successAnimation: {
    width: 200,
    height: 200
  },
  successText: {
    ...theme.typography.heading3,
    marginTop: theme.spacing.large,
    textAlign: 'center',
    color: theme.colors.success
  },
  successSubtext: {
    ...theme.typography.body,
    marginTop: theme.spacing.medium,
    textAlign: 'center',
    color: theme.colors.text.secondary
  },
  errorContainer: {
    padding: theme.spacing.large,
    alignItems: 'center'
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.medium
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  locationVerifyingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.small
  }
});

export { styles };