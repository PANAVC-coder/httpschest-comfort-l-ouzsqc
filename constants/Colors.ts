export const COLORS = {
  background: '#F7FAF8',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF5F1',
  text: '#1A2E24',
  textSecondary: '#5A7A6A',
  textTertiary: '#9BB5A8',
  primary: '#34C78A',
  primaryMuted: 'rgba(52, 199, 138, 0.12)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.12)',
  amber: '#F59E0B',
  amberMuted: 'rgba(245, 158, 11, 0.12)',
  border: 'rgba(52, 199, 138, 0.15)',
  divider: 'rgba(52, 199, 138, 0.08)',
  shadow: 'rgba(26, 46, 36, 0.06)',
};

export const comfortColor = (level: number): string => {
  if (level <= 3) return '#EF4444';
  if (level <= 6) return '#F59E0B';
  return '#34C78A';
};

export const comfortColorMuted = (level: number): string => {
  if (level <= 3) return 'rgba(239, 68, 68, 0.12)';
  if (level <= 6) return 'rgba(245, 158, 11, 0.12)';
  return 'rgba(52, 199, 138, 0.12)';
};

export const comfortLabel = (level: number): string => {
  if (level <= 2) return 'Severe';
  if (level <= 4) return 'Poor';
  if (level <= 6) return 'Fair';
  if (level <= 8) return 'Good';
  return 'Excellent';
};
