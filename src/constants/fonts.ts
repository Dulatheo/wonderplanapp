import {Platform} from 'react-native';

export const FONTS = {
  PROXIMA: {
    REGULAR: Platform.OS === 'ios' ? 'ProximaNova-Regular' : 'ProximaNova-Reg',
    REGULAR_ITALIC:
      Platform.OS === 'ios' ? 'ProximaNova-RegularIt' : 'proximanova-regularit',
    THIN: Platform.OS === 'ios' ? 'ProximaNovaT-Thin' : 'ProximaNova-Thin',
    LIGHT: Platform.OS === 'ios' ? 'ProximaNova-Light' : 'ProximaNova-Light',
    MEDIUM: Platform.OS === 'ios' ? 'ProximaNova-Medium' : 'proximanova-medium',
    SEMIBOLD:
      Platform.OS === 'ios' ? 'ProximaNova-Semibold' : 'ProximaNova-Sbold',
    BOLD: Platform.OS === 'ios' ? 'ProximaNova-Bold' : 'proximanova-bold',
    BOLD_ITALIC:
      Platform.OS === 'ios' ? 'ProximaNova-BoldIt' : 'proximanova-boldit',
  },
} as const;

// Font weight constants for better type support
export const FONT_WEIGHTS = {
  THIN: '100',
  LIGHT: '300',
  REGULAR: '400',
  MEDIUM: '500',
  SEMIBOLD: '600',
  BOLD: '700',
} as const;
