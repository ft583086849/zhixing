
// 焦点管理工具
export const focusManagement = {
  // 焦点陷阱
  createFocusTrap: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // 返回清理函数
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },
  
  // 焦点恢复
  focusRestore: {
    previousFocus: null,
    
    save: () => {
      focusManagement.focusRestore.previousFocus = document.activeElement;
    },
    
    restore: () => {
      if (focusManagement.focusRestore.previousFocus) {
        focusManagement.focusRestore.previousFocus.focus();
      }
    }
  },
  
  // 焦点指示器
  focusIndicator: {
    show: (element) => {
      element.style.outline = '2px solid #1890ff';
      element.style.outlineOffset = '2px';
    },
    
    hide: (element) => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }
  }
};

export default focusManagement;
