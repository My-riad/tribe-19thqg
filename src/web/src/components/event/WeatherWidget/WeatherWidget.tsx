import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from './WeatherWidget.styles';
import { WeatherData, WeatherCondition } from '../../../types/event.types';
import { formatWeather } from '../../../utils/formatters';
import { WeatherIcons } from '../../../assets/icons';
import { isSmallDevice } from '../../../theme';

/**
 * Props for the WeatherWidget component
 */
interface WeatherWidgetProps {
  /** Weather data to display in the widget */
  weatherData: WeatherData;
  /** Whether to display the widget in compact mode */
  compact?: boolean;
  /** Whether to display temperature in Fahrenheit (default is Celsius) */
  useFahrenheit?: boolean;
  /** Optional title to display above the weather widget */
  title?: string;
}

/**
 * Returns the appropriate weather icon component based on the weather condition
 * @param condition The weather condition
 * @returns The weather icon component or null if no matching icon is found
 */
const getWeatherIcon = (condition: WeatherCondition): React.ReactElement | null => {
  // Map the condition to the corresponding icon
  const iconMapping: Record<WeatherCondition, string> = {
    [WeatherCondition.SUNNY]: 'sunny',
    [WeatherCondition.PARTLY_CLOUDY]: 'partlyCloudy',
    [WeatherCondition.CLOUDY]: 'cloudy',
    [WeatherCondition.RAINY]: 'rainy',
    [WeatherCondition.STORMY]: 'stormy',
    [WeatherCondition.SNOWY]: 'snowy',
    [WeatherCondition.WINDY]: 'windy',
    [WeatherCondition.UNKNOWN]: 'cloudy', // Default to cloudy if unknown
  };
  
  const iconName = iconMapping[condition] || 'cloudy';
  const IconComponent = WeatherIcons[iconName];
  
  if (IconComponent) {
    return <IconComponent width={48} height={48} />;
  }
  
  return null;
};

/**
 * A React Native component that displays weather information for events,
 * helping users prepare appropriately for meetups.
 */
const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weatherData,
  compact = false,
  useFahrenheit = false,
  title,
}) => {
  // If no weather data is provided, don't render anything
  if (!weatherData) {
    return null;
  }
  
  // Determine if we should use compact mode based on props or device size
  const useCompactMode = compact || isSmallDevice();
  
  // Get the appropriate weather icon
  const weatherIcon = getWeatherIcon(weatherData.condition);
  
  // Format the weather condition and temperature
  const formattedWeather = formatWeather(weatherData, useFahrenheit);
  const [condition, temperature] = formattedWeather.split(', ');
  
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.weatherCard}>
        <View style={[styles.weatherContent, useCompactMode && styles.compactContent]}>
          <View style={styles.weatherInfo}>
            <View style={styles.weatherMain}>
              <Text style={styles.weatherCondition}>{condition}</Text>
            </View>
            <Text style={styles.weatherTemperature}>{temperature}</Text>
            <View style={styles.weatherDetails}>
              <Text style={styles.weatherDetail}>
                {weatherData.humidity}% humidity
              </Text>
              <Text style={styles.weatherDetail}>
                {weatherData.windSpeed} mph wind
              </Text>
            </View>
          </View>
          {weatherIcon && (
            <View style={[useCompactMode && styles.compactIcon]}>
              {weatherIcon}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default WeatherWidget;