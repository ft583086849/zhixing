import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
  DollarOutlined,
  AccountBookOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || 'overview';

  const menuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: <Link to="/test">数据概览</Link>
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/test/orders">订单管理</Link>
    },
    {
      key: 'sales',
      icon: <TeamOutlined />,
      label: <Link to="/test/sales">销售管理</Link>
    },
    {
      key: 'customers',
      icon: <UserOutlined />,
      label: <Link to="/test/customers">客户管理</Link>
    },
    {
      key: 'finance',
      icon: <DollarOutlined />,
      label: <Link to="/test/finance">资金统计</Link>
    },
    {
      key: 'reconciliation',
      icon: <AccountBookOutlined />,
      label: '销售对账',
      children: [
        {
          key: 'reconciliation-primary',
          label: <Link to="/test/reconciliation/primary">一级销售</Link>
        },
        {
          key: 'reconciliation-secondary',
          label: <Link to="/test/reconciliation/secondary">二级/独立</Link>
        }
      ]
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ 
          height: 32, 
          margin: 16, 
          color: 'white',
          textAlign: 'center',
          fontSize: 18,
          fontWeight: 'bold'
        }}>
          测试环境
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          defaultOpenKeys={['reconciliation']}
          theme="dark"
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px' }}>
          <h2>知行财库管理系统 - 优化测试版</h2>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;