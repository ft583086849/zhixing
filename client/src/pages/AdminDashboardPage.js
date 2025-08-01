import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Menu, 
  Button, 
  Space,
  Avatar,
  Dropdown
} from 'antd';
import { 
  DashboardOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { logout } from '../store/slices/authSlice';
import ErrorBoundary from '../components/ErrorBoundary';
import AdminOverview from '../components/admin/AdminOverview';
import AdminOrders from '../components/admin/AdminOrders';
import AdminSales from '../components/admin/AdminSales';
import AdminCustomers from '../components/admin/AdminCustomers';
import AdminPaymentConfig from '../components/admin/AdminPaymentConfig';


const { Header, Sider, Content } = Layout;

const AdminDashboardPage = () => {
  console.log('AdminDashboardPage 组件开始加载');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { admin } = useSelector((state) => state.auth);
  const [collapsed, setCollapsed] = useState(false);

  // 设置页面标题
  useEffect(() => {
    document.title = '知行财库';
  }, []);

  console.log('AdminDashboardPage 状态:', { admin, collapsed });

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人信息
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        设置
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '数据概览',
    },
    {
      key: '/admin/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
    },
    {
      key: '/admin/sales',
      icon: <UserOutlined />,
      label: '销售管理',
    },
    {
      key: '/admin/customers',
      icon: <UserOutlined />,
      label: '客户管理',
    },
    {
      key: '/admin/payment-config',
      icon: <SettingOutlined />,
      label: '收款配置',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <div>
      <div style={{ 
        background: 'red', 
        color: 'white', 
        padding: '10px', 
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        测试：AdminDashboardPage 组件已加载 - 时间: {new Date().toLocaleString()}
      </div>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          theme="dark"
          style={{
            background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ 
            height: 64, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? '16px' : '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            margin: '8px',
            borderRadius: '8px'
          }}>
            {collapsed ? 'ZXCK' : '知行财库'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['/admin/dashboard']}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
        
        <Layout>
          <Header style={{ 
            padding: '0 24px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            color: 'white'
          }}>
            <Button
              type="text"
              icon={collapsed ? '☰' : '✕'}
              onClick={() => setCollapsed(!collapsed)}
              tabIndex={0}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            
            <Space>
              <span style={{ color: 'white', fontWeight: 'bold' }}>欢迎，{admin?.username}</span>
              <Dropdown overlay={userMenu} placement="bottomRight">
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.2)' }}
                />
              </Dropdown>
            </Space>
          </Header>
          
          <Content style={{ 
            margin: '16px', 
            padding: '24px', 
            background: 'white',
            borderRadius: '16px',
            minHeight: 'calc(100vh - 96px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
          }}>
            <ErrorBoundary>
              <Routes>
                <Route path="dashboard" element={<AdminOverview />} />
                <Route path="" element={<AdminOverview />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="sales" element={<AdminSales />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="payment-config" element={<AdminPaymentConfig />} />
              </Routes>
            </ErrorBoundary>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default AdminDashboardPage; 