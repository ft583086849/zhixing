// 测试环境路由配置
// 不会影响生产环境，所有优化后的页面都在这里配置

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';

// 优化后的页面组件
import AdminOverview from '../components/admin/AdminOverview'; // 使用原有的已优化版本
import AdminOrdersOptimized from '../components/admin/AdminOrdersOptimized';
import AdminSalesOptimized from '../components/admin/AdminSalesOptimized';
import AdminCustomersOptimized from '../components/admin/AdminCustomersOptimized';
import AdminFinance from '../components/admin/AdminFinance';
import SalesReconciliation from '../components/admin/SalesReconciliation';

const TestRoutes = () => {
  // 只在测试环境启用
  if (process.env.REACT_APP_ENABLE_TEST_ROUTES !== 'true') {
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* 数据概览 - 使用已优化版本 */}
        <Route index element={<AdminOverview />} />
        <Route path="overview" element={<AdminOverview />} />
        
        {/* 订单管理 - 优化版 */}
        <Route path="orders" element={<AdminOrdersOptimized />} />
        
        {/* 销售管理 - 优化版 */}
        <Route path="sales" element={<AdminSalesOptimized />} />
        
        {/* 客户管理 - 优化版 */}
        <Route path="customers" element={<AdminCustomersOptimized />} />
        
        {/* 资金统计 - 稳定版 */}
        <Route path="finance" element={<AdminFinance />} />
        
        {/* 一级销售对账 */}
        <Route path="reconciliation/primary" element={<SalesReconciliation salesType="primary" />} />
        
        {/* 二级/独立销售对账 */}
        <Route path="reconciliation/secondary" element={<SalesReconciliation salesType="secondary" />} />
      </Route>
    </Routes>
  );
};

export default TestRoutes;

// 测试页面访问地址：
// http://localhost:3000/test - 数据概览
// http://localhost:3000/test/orders - 订单管理
// http://localhost:3000/test/sales - 销售管理
// http://localhost:3000/test/customers - 客户管理
// http://localhost:3000/test/finance - 资金统计
// http://localhost:3000/test/reconciliation/primary - 一级销售对账
// http://localhost:3000/test/reconciliation/secondary - 二级销售对账