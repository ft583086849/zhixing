import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Typography,
  Alert
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined 
} from '@ant-design/icons';
import { login, clearError } from '../store/slices/authSlice';

const { Title, Text } = Typography;

const AdminLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  // 如果已登录，跳转到管理员后台
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // 清除错误信息
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(login(values)).unwrap();
      message.success('登录成功！');
      navigate('/admin/dashboard');
    } catch (error) {
      message.error(error || '登录失败');
    }
  };

  return (
    <div className="page-container">
      <div className="content-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <Card 
            className="card-container" 
            style={{ 
              maxWidth: '400px', 
              width: '100%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
           role="region">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Title level={2}>管理员登录</Title>
              <Text type="secondary">请输入管理员账户信息</Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="large">
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}>
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                 tabIndex={0}>
                  登录
                </Button>
              </Form.Item>
            </Form>

            {/* 错误提示 */}
            {error && (
              <Alert
                message="登录失败"
                description={error}
                type="error"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}


          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage; 