import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Typography, Space } from 'antd';
import { login, logout } from '../store/slices/authSlice';

const { Title, Text } = Typography;

const AuthTestPage = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated, admin, loading } = useSelector((state) => state.auth);

  const handleLogin = async () => {
    try {
      const result = await dispatch(login({
        username: '知行',
        password: 'Zhixing Universal Trading Signal'
      })).unwrap();
      console.log('登录成功，返回数据:', result);
      console.log('Token:', result.data.token);
      console.log('Admin:', result.data.admin);
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    console.log('登出成功');
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="认证状态测试" style={{ maxWidth: 600, margin: '0 auto' }} role="region">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>当前状态</Title>
            <Text>Token: {token ? '存在' : '不存在'}</Text><br />
            <Text>认证状态: {isAuthenticated ? '已认证' : '未认证'}</Text><br />
            <Text>管理员: {admin ? admin.username : '无'}</Text><br />
            <Text>加载状态: {loading ? '加载中' : '完成'}</Text>
          </div>

          <div>
            <Title level={4}>操作</Title>
            <Space>
              <Button type="primary" onClick={handleLogin} loading={loading} tabIndex={0}>
                登录
              </Button>
              <Button onClick={handleLogout} tabIndex={0}>
                登出
              </Button>
            </Space>
          </div>

          <div>
            <Title level={4}>LocalStorage</Title>
            <Text>Token: {localStorage.getItem('token') ? '存在' : '不存在'}</Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default AuthTestPage; 