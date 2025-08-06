
// 高对比度主题配置
export const highContrastTheme = {
  colors: {
    // 主要颜色 - 高对比度
    primary: '#0066cc',
    primaryHover: '#0052a3',
    primaryActive: '#003d7a',
    
    // 背景颜色
    background: '#ffffff',
    backgroundSecondary: '#f5f5f5',
    
    // 文本颜色
    text: '#000000',
    textSecondary: '#333333',
    textDisabled: '#666666',
    
    // 边框颜色
    border: '#000000',
    borderLight: '#333333',
    
    // 状态颜色
    success: '#006600',
    warning: '#cc6600',
    error: '#cc0000',
    info: '#0066cc'
  },
  
  // 字体大小
  fontSize: {
    small: '14px',
    medium: '16px',
    large: '18px',
    xlarge: '20px'
  },
  
  // 间距
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px',
    xlarge: '32px'
  }
};

// 高对比度样式
export const highContrastStyles = `
.high-contrast {
  --primary-color: ${highContrastTheme.colors.primary};
  --primary-hover: ${highContrastTheme.colors.primaryHover};
  --primary-active: ${highContrastTheme.colors.primaryActive};
  --background-color: ${highContrastTheme.colors.background};
  --background-secondary: ${highContrastTheme.colors.backgroundSecondary};
  --text-color: ${highContrastTheme.colors.text};
  --text-secondary: ${highContrastTheme.colors.textSecondary};
  --text-disabled: ${highContrastTheme.colors.textDisabled};
  --border-color: ${highContrastTheme.colors.border};
  --border-light: ${highContrastTheme.colors.borderLight};
  --success-color: ${highContrastTheme.colors.success};
  --warning-color: ${highContrastTheme.colors.warning};
  --error-color: ${highContrastTheme.colors.error};
  --info-color: ${highContrastTheme.colors.info};
}

.high-contrast * {
  color: var(--text-color) !important;
  background-color: var(--background-color) !important;
  border-color: var(--border-color) !important;
}

.high-contrast button {
  border: 2px solid var(--border-color) !important;
  background-color: var(--background-color) !important;
  color: var(--text-color) !important;
}

.high-contrast button:hover {
  background-color: var(--primary-hover) !important;
  color: white !important;
}

.high-contrast input {
  border: 2px solid var(--border-color) !important;
  background-color: var(--background-color) !important;
  color: var(--text-color) !important;
}

.high-contrast table {
  border: 2px solid var(--border-color) !important;
}

.high-contrast th,
.high-contrast td {
  border: 1px solid var(--border-color) !important;
  padding: 8px !important;
}
`;

export default highContrastTheme;
