export const COLORS = {
  // Primary brand colors
  PRIMARY: {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
  },

  // Text colors
  TEXT: {
    PRIMARY: '#202020',
    SECONDARY: '#707070',
    DISABLED: '#999999',
  },

  // Background colors
  BACKGROUND: {
    PRIMARY: '#FFFFFF',
    SECONDARY: '#F5F5F5',
  },

  // Status colors
  STATUS: {
    SUCCESS: '#4CAF50',
    ERROR: '#F44336',
    WARNING: '#FFC107',
    INFO: '#2196F3',
  },

  // Border colors
  BORDER: {
    LIGHT: '#E0E0E0',
    MEDIUM: '#BDBDBD',
    DARK: '#757575',
  },
} as const;

// Function to add opacity to hex colors
export const addOpacity = (hexColor: string, opacity: number): string => {
  const validHex = hexColor.replace('#', '');
  const opacityHex = Math.round(opacity * 255).toString(16);
  return `#${validHex}${opacityHex.padStart(2, '0')}`;
};
