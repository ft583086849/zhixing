import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { verifyToken } from './store/slices/authSlice';
import LoadingSpinner from './components/LoadingSpinner';

// 页面组件
const SalesPage = lazy(() => import('./pages/SalesPage'));
const PurchasePage = lazy(() => import('./pages/PurchasePage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const SalesReconciliationPage = lazy(() => import('./pages/SalesReconciliationPage'));
const AuthTestPage = lazy(() => import('./pages/AuthTestPage'));
const PrimarySalesPage = lazy(() => import('./pages/PrimarySalesPage'));
const PrimarySalesSettlementPage = lazy(() => import('./pages/PrimarySalesSettlementPage'));
const UnifiedSecondarySalesPage = lazy(() => import('./pages/UnifiedSecondarySalesPage'));

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/admin" replace />;
};

function App() {
  const dispatch = useDispatch();
  const { token, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // 如果有token，验证token有效性
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch, token]); // 添加token依赖，确保token变化时重新验证

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="App">
      {/* 跳过导航链接 - 可访问性支持 */}
      <a 
        href="#main-content" 
        className="skip-nav"
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
        跳转到主要内容
      </a>

        <Routes>
          {/* 管理员登录页面 - 优先级最高 */}
          <Route path="/admin" element={<Suspense fallback={<div>加载中...</div>}><AdminLoginPage /></Suspense>} />
          
          {/* 销售页面 - 创建收款链接 */}
          <Route path="/sales" element={<Suspense fallback={<div>加载中...</div>}><SalesPage /></Suspense>} />
          
          {/* 一级销售订单结算页面 */}
          <Route path="/sales/commission" element={<Suspense fallback={<div>加载中...</div>}><PrimarySalesSettlementPage /></Suspense>} />
          
          {/* 二级销售对账页面 */}
          <Route path="/sales/settlement" element={<Suspense fallback={<div>加载中...</div>}><SalesReconciliationPage /></Suspense>} />
          
          {/* 用户购买页面 - 通过链接访问 */}
          <Route path="/purchase/:linkCode" element={<Suspense fallback={<div>加载中...</div>}><PurchasePage /></Suspense>} />
          
          {/* 销售专用页面 */}
          <Route path="/sales-reconciliation" element={<Suspense fallback={<div>加载中...</div>}><SalesReconciliationPage /></Suspense>} />
          
          {/* 一级销售页面 */}
          <Route path="/primary-sales" element={<Suspense fallback={<div>加载中...</div>}><PrimarySalesPage /></Suspense>} />
          
          {/* 一级销售订单结算页面（备用路径） */}
          <Route path="/primary-sales-settlement" element={<Suspense fallback={<div>加载中...</div>}><PrimarySalesSettlementPage /></Suspense>} />
          
          {/* 二级销售注册页面 - 统一页面支持独立注册和关联注册 */}
          <Route path="/secondary-registration/:linkCode" element={<Suspense fallback={<div>加载中...</div>}><UnifiedSecondarySalesPage /></Suspense>} />
          
          {/* 二级销售注册页面 - 支持sales_code参数的统一路由 */}
          <Route path="/secondary-sales" element={<Suspense fallback={<div>加载中...</div>}><UnifiedSecondarySalesPage /></Suspense>} />
          <Route path="/purchase" element={<Suspense fallback={<div>加载中...</div>}><PurchasePage /></Suspense>} />
          
          {/* 认证测试页面 */}
          <Route path="/auth-test" element={<Suspense fallback={<div>加载中...</div>}><AuthTestPage /></Suspense>} />
          

          
          {/* 管理员后台页面 - 需要认证 */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<div>加载中...</div>}>
                  <AdminDashboardPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          {/* 管理员通配符路由 - 需要认证 */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<div>加载中...</div>}>
                  <AdminDashboardPage />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          
          {/* 默认显示管理员登录页面 */}
          <Route path="/" element={<Suspense fallback={<div>加载中...</div>}><AdminLoginPage /></Suspense>} />
          
          {/* 404页面 - 显示友好错误信息，不重定向 */}
          <Route path="*" element={
            <Suspense fallback={<div>加载中...</div>}>
              <div style={{textAlign: 'center', padding: '50px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                <h2>页面未找到</h2>
                <p>请检查链接是否正确，或联系管理员</p>
              </div>
            </Suspense>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 