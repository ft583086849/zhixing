
// 键盘导航工具
export const keyboardNavigation = {
  // 焦点管理
  focusManager: {
    // 获取可聚焦元素
    getFocusableElements: (container) => {
      return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    },
    
    // 设置焦点
    setFocus: (element) => {
      if (element && element.focus) {
        element.focus();
      }
    },
    
    // 下一个焦点
    nextFocus: (container, currentElement) => {
      const focusable = Array.from(keyboardNavigation.focusManager.getFocusableElements(container));
      const currentIndex = focusable.indexOf(currentElement);
      const nextIndex = (currentIndex + 1) % focusable.length;
      keyboardNavigation.focusManager.setFocus(focusable[nextIndex]);
    },
    
    // 上一个焦点
    prevFocus: (container, currentElement) => {
      const focusable = Array.from(keyboardNavigation.focusManager.getFocusableElements(container));
      const currentIndex = focusable.indexOf(currentElement);
      const prevIndex = currentIndex === 0 ? focusable.length - 1 : currentIndex - 1;
      keyboardNavigation.focusManager.setFocus(focusable[prevIndex]);
    }
  },
  
  // 键盘事件处理
  handleKeyDown: (event, handlers) => {
    const { onEnter, onEscape, onTab, onArrowUp, onArrowDown, onArrowLeft, onArrowRight } = handlers;
    
    switch (event.key) {
      case 'Enter':
        if (onEnter) onEnter(event);
        break;
      case 'Escape':
        if (onEscape) onEscape(event);
        break;
      case 'Tab':
        if (onTab) onTab(event);
        break;
      case 'ArrowUp':
        if (onArrowUp) onArrowUp(event);
        break;
      case 'ArrowDown':
        if (onArrowDown) onArrowDown(event);
        break;
      case 'ArrowLeft':
        if (onArrowLeft) onArrowLeft(event);
        break;
      case 'ArrowRight':
        if (onArrowRight) onArrowRight(event);
        break;
    }
  },
  
  // 无障碍导航
  accessibility: {
    // 跳过链接
    createSkipLink: (targetId, text = '跳转到主要内容') => {
      return (
        <a
          href={`#${targetId}`}
          className="skip-link"
          style={{
            position: 'absolute',
            top: '-40px',
            left: '6px',
            zIndex: 1000,
            padding: '8px 16px',
            backgroundColor: '#1890ff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'top 0.3s'
          }}
          onFocus={(e) => {
            e.target.style.top = '6px';
          }}
          onBlur={(e) => {
            e.target.style.top = '-40px';
          }}
        >
          {text}
        </a>
      );
    },
    
    // 焦点指示器
    focusIndicator: {
      outline: '2px solid #1890ff',
      outlineOffset: '2px'
    }
  }
};

export default keyboardNavigation;
