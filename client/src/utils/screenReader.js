
// 屏幕阅读器支持工具
export const screenReader = {
  // 状态通知
  announce: (message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // 清理通知
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  },
  
  // 错误通知
  announceError: (message) => {
    screenReader.announce(`错误: ${message}`, 'assertive');
  },
  
  // 成功通知
  announceSuccess: (message) => {
    screenReader.announce(`成功: ${message}`, 'polite');
  },
  
  // 加载状态通知
  announceLoading: (message) => {
    screenReader.announce(`正在加载: ${message}`, 'polite');
  },
  
  // 表格导航
  tableNavigation: {
    // 获取表格信息
    getTableInfo: (table) => {
      const rows = table.querySelectorAll('tr');
      const cols = rows[0] ? rows[0].querySelectorAll('th, td').length : 0;
      return `表格包含 ${rows.length} 行，${cols} 列`;
    },
    
    // 单元格位置信息
    getCellPosition: (cell) => {
      const row = cell.parentElement;
      const rowIndex = Array.from(row.parentElement.children).indexOf(row) + 1;
      const colIndex = Array.from(row.children).indexOf(cell) + 1;
      return `第 ${rowIndex} 行，第 ${colIndex} 列`;
    }
  }
};

// 屏幕阅读器专用样式
export const srOnlyStyles = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
`;

export default screenReader;
