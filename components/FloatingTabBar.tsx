import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { IconSymbol } from './IconSymbol';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps extends BottomTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

const COLORS = {
  primary: '#34C78A',
  text: '#1A2E24',
  textSecondary: '#5A7A6A',
  surface: '#FFFFFF',
};

const TAB_HEIGHT = 60;

export default function FloatingTabBar({
  state,
  navigation,
  tabs,
  containerWidth,
  borderRadius = 35,
  bottomMargin = 20,
}: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get('window');
  const width = containerWidth ?? screenWidth - 32;
  const tabCount = tabs.length;
  const tabWidth = width / tabCount;

  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 20,
      stiffness: 200,
    });
  }, [state.index, activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeIndex.value * tabWidth }],
  }));

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom + bottomMargin,
        left: 16,
        right: 16,
        alignItems: 'center',
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          width,
          height: TAB_HEIGHT,
          borderRadius,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
            },
            android: { elevation: 8 },
            web: { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } as object,
          }),
        }}
      >
        <BlurView
          intensity={80}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(255,255,255,0.7)' },
          ]}
        />

        {/* Sliding indicator */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 6,
              left: 6,
              width: tabWidth - 12,
              height: TAB_HEIGHT - 12,
              borderRadius: borderRadius - 6,
              backgroundColor: COLORS.primary + '22',
            },
            indicatorStyle,
          ]}
        />

        {/* Tabs */}
        <View style={{ flexDirection: 'row', flex: 1 }}>
          {tabs.map((tab, index) => {
            const isActive = state.index === index;
            const iconColor = isActive ? COLORS.primary : COLORS.textSecondary;
            const labelColor = isActive ? COLORS.primary : COLORS.textSecondary;
            const labelWeight = isActive ? '600' : '400';

            return (
              <Pressable
                key={tab.name}
                onPress={() => {
                  console.log('[FloatingTabBar] Tab pressed:', tab.label, 'index:', index);
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: state.routes[index]?.key,
                    canPreventDefault: true,
                  });
                  if (!isActive && !event.defaultPrevented) {
                    navigation.navigate(state.routes[index]?.name);
                  }
                }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
              >
                <IconSymbol
                  android_material_icon_name={tab.icon}
                  ios_icon_name={tab.icon}
                  size={22}
                  color={iconColor}
                />
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: labelWeight,
                    color: labelColor,
                    letterSpacing: 0.2,
                  }}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
