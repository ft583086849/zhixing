import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 你可以将错误日志上报给服务器
    console.error('🔥 错误边界捕获到错误:', error);
    console.error('🔥 错误信息:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      return (
        <div style={{
          background: '#fff2f0',
          border: '2px solid #ff4d4f',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0'
        }}>
          <h2 style={{ color: '#ff4d4f', margin: '0 0 10px 0' }}>
            🔥 组件发生错误！
          </h2>
          
          <div style={{ 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
              错误详情：
            </h3>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>错误名称:</strong> {this.state.error?.name}
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>错误消息:</strong> {this.state.error?.message}
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>错误堆栈:</strong>
            </p>
            <pre style={{ 
              background: '#fff', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {this.state.error?.stack}
            </pre>
          </div>

          <div style={{ 
            background: '#e6f7ff', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1890ff' }}>
              组件堆栈信息：
            </h3>
            <pre style={{ 
              background: '#fff', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>

          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            style={{
              background: '#1890ff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 重新加载页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 