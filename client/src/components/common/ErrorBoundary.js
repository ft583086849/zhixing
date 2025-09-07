import React from 'react';
import { Alert, Card, Typography, Space, Button } from 'antd';
import { ReloadOutlined, BugOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    console.error('❌ ErrorBoundary捕获到错误:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card style={{ margin: '20px', maxWidth: '800px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message="页面加载出现错误"
              description="遇到了一些技术问题，请尝试刷新页面或联系管理员"
              type="error"
              showIcon
              icon={<BugOutlined />}
            />
            
            <div>
              <Title level={4}>错误详情</Title>
              <Paragraph>
                <Text code>{this.state.error?.toString()}</Text>
              </Paragraph>
              
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                  <summary>详细错误信息（开发模式）</summary>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '4px',
                    marginTop: '10px',
                    fontSize: '12px'
                  }}>
                    {this.state.error?.stack}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <Space>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
              >
                刷新页面
              </Button>
              <Button onClick={this.handleReset}>
                重试
              </Button>
            </Space>
          </Space>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;