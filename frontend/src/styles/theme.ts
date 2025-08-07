// Color Palette
export const colors = {
  // Primary colors
  primary: '#2c3e50',
  primaryLight: '#3498db',
  secondary: '#667eea',
  
  // Status colors
  success: '#28a745',
  successLight: '#d4edda',
  successText: '#155724',
  error: '#dc3545',
  errorLight: '#f8d7da',
  errorText: '#721c24',
  warning: '#ffc107',
  warningLight: '#fff3cd',
  warningText: '#856404',
  info: '#17a2b8',
  infoLight: '#e3f2fd',
  infoText: '#0d47a1',
  
  // Neutral colors
  white: '#ffffff',
  light: '#f8f9fa',
  lightGray: '#e9ecef',
  gray: '#6c757d',
  darkGray: '#495057',
  dark: '#222222',
  text: '#333333',
  textLight: '#555555',
  textMuted: '#666666',
  textDisabled: '#888888',
  
  // Background colors
  background: '#f5f5f5',
  cardBackground: '#ffffff',
  
  // Border colors
  border: '#e0e0e0',
  borderLight: '#e9ecef'
} as const;

// Common styles
export const commonStyles = {
  // Card styles
  card: {
    padding: '20px',
    backgroundColor: colors.cardBackground,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    color: colors.text
  },
  
  // Typography
  cardTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: colors.dark
  },
  
  cardText: {
    margin: '5px 0',
    fontSize: '14px',
    color: colors.textLight
  },
  
  // Button styles
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer' as const,
    transition: 'all 0.3s ease'
  },
  
  // Alert styles
  successAlert: {
    padding: '15px',
    backgroundColor: colors.successLight,
    color: colors.successText,
    border: `1px solid #c3e6cb`,
    borderRadius: '6px',
    fontWeight: 'bold' as const
  },
  
  errorAlert: {
    padding: '15px',
    backgroundColor: colors.errorLight,
    color: colors.errorText,
    border: `1px solid #f5c6cb`,
    borderRadius: '6px',
    fontWeight: 'bold' as const
  },
  
  // Form styles
  input: {
    width: '100%',
    padding: '10px',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '4px',
    fontSize: '14px'
  },
  
  textarea: {
    width: '100%',
    padding: '10px',
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical' as const
  }
} as const;

// Button variants
export const buttonVariants = {
  primary: {
    backgroundColor: colors.primaryLight,
    color: colors.white
  },
  
  success: {
    backgroundColor: colors.success,
    color: colors.white
  },
  
  secondary: {
    backgroundColor: colors.secondary,
    color: colors.white
  },
  
  disabled: {
    backgroundColor: colors.gray,
    color: colors.white,
    cursor: 'not-allowed' as const
  }
} as const;