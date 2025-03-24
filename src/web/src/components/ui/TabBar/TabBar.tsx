import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Animated, LayoutChangeEvent } from 'react-native';
import { theme } from '../../../theme';
import {
  TabBarContainer,
  TabItem,
  TabItemContent,
  TabIcon,
  TabLabel,
  TabBadge,
  TabBadgeText,
  TabIndicator
} from './TabBar.styles';

// Default width for the active tab indicator when measurements are not available
const DEFAULT_INDICATOR_WIDTH = 20;
// Duration in milliseconds for the tab indicator animation
const ANIMATION_DURATION = 250;

// Interface defining the structure of a tab item with key, icon, label, and optional badge count
export interface TabItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  badgeCount?: number;
}

// Interface defining the props for the TabBar component
export interface TabBarProps {
  tabs: TabItem[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  variant?: 'top' | 'bottom';
  showLabels?: boolean;
  showIndicator?: boolean;
  testID?: string;
}

// Interface for storing tab width and position measurements for indicator positioning
interface TabMeasurements {
  width: number;
  x: number;
}

/**
 * A customizable tab bar component that renders a row of tabs with icons, labels, and optional badges
 * Supports both top and bottom positioning, with options for showing labels and an animated active tab indicator
 */
const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeIndex,
  onTabPress,
  variant = 'bottom',
  showLabels = true,
  showIndicator = true,
  testID,
}) => {
  // State to store the width and position of each tab
  const [tabMeasurements, setTabMeasurements] = useState<TabMeasurements[]>([]);
  
  // Animated values for the indicator position and width
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(DEFAULT_INDICATOR_WIDTH)).current;
  
  // Update indicator position when activeIndex or tabMeasurements change
  useEffect(() => {
    if (tabMeasurements.length > activeIndex && tabMeasurements[activeIndex]) {
      const { x, width } = tabMeasurements[activeIndex];
      
      Animated.parallel([
        Animated.timing(indicatorPosition, {
          toValue: x,
          duration: ANIMATION_DURATION,
          useNativeDriver: false, // translateX cannot be animated with useNativeDriver when width also changes
        }),
        Animated.timing(indicatorWidth, {
          toValue: width,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [activeIndex, tabMeasurements, indicatorPosition, indicatorWidth]);
  
  // Handle tab press
  const handleTabPress = (index: number) => {
    onTabPress(index);
  };
  
  // Measure tab layout to correctly position the indicator
  const measureTab = (index: number, event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    
    setTabMeasurements(prevMeasurements => {
      const newMeasurements = [...prevMeasurements];
      newMeasurements[index] = { width, x };
      return newMeasurements;
    });
    
    // If this is the active tab and we're measuring it for the first time,
    // update the indicator position immediately without animation
    if (index === activeIndex && !tabMeasurements[index]) {
      indicatorPosition.setValue(x);
      indicatorWidth.setValue(width);
    }
  };
  
  // Combine indicator position and width into a style object for the animated indicator
  const indicatorStyle = useMemo(() => ({
    transform: [{ translateX: indicatorPosition }],
    width: indicatorWidth,
  }), [indicatorPosition, indicatorWidth]);
  
  return (
    <TabBarContainer 
      variant={variant}
      testID={testID}
      accessibilityRole="tablist"
      accessibilityLabel="Navigation tabs"
    >
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex;
        
        return (
          <TabItem
            key={tab.key}
            onPress={() => handleTabPress(index)}
            onLayout={(event) => measureTab(index, event)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label}${tab.badgeCount ? `, ${tab.badgeCount} notifications` : ''}`}
            testID={`${testID}-tab-${tab.key}`}
            accessible={true}
          >
            <TabItemContent>
              <TabIcon showLabel={showLabels}>
                {tab.icon}
                {tab.badgeCount ? (
                  <TabBadge
                    accessibilityLabel={`${tab.badgeCount} notifications`}
                    testID={`${testID}-badge-${tab.key}`}
                  >
                    <TabBadgeText>
                      {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                    </TabBadgeText>
                  </TabBadge>
                ) : null}
              </TabIcon>
              
              {showLabels && (
                <TabLabel 
                  active={isActive}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  testID={`${testID}-label-${tab.key}`}
                >
                  {tab.label}
                </TabLabel>
              )}
            </TabItemContent>
          </TabItem>
        );
      })}
      
      {showIndicator && tabMeasurements.length > 0 && (
        <TabIndicator
          style={indicatorStyle}
          variant={variant}
          testID={`${testID}-indicator`}
        />
      )}
    </TabBarContainer>
  );
};

export default TabBar;