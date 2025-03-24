/**
 * Entry point for the ProgressBar component
 * 
 * The ProgressBar component visualizes completion progress and is part of
 * the Tribe application's design system. It supports different sizes, variants,
 * and animation options to provide visual feedback on process completion.
 * 
 * @example
 * import ProgressBar, { ProgressBarProps } from 'components/ui/ProgressBar';
 * 
 * // Basic usage
 * <ProgressBar progress={0.75} />
 * 
 * // With custom variant and size
 * <ProgressBar progress={0.5} variant="success" size="lg" />
 */
import ProgressBar from './ProgressBar';
import { ProgressBarProps } from './ProgressBar';

export { ProgressBarProps };
export default ProgressBar;