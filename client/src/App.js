import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { verifyToken } from './store/slices/authSlice';

// 页面组件
const SalesPage = lazy(() => import('./pages/SalesPage'));
const PurchasePage = lazy(() => import('./pages/PurchasePage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const SalesReconciliationPage = lazy(() => import('./pages/SalesReconciliationPage'));
const AuthTestPage = lazy(() => import('./pages/AuthTestPage'));

// 组件
import LoadingSpinner from './components/LoadingSpinner';

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
          {/* 销售页面 - 创建收款链接 */}
          <Route path="/sales" element={<Suspense fallback={<div>加载中...</div>}><SalesPage /></Suspense>} />
          
          {/* 用户购买页面 - 通过链接访问 */}
          <Route path="/purchase/:linkCode" element={<Suspense fallback={<div>加载中...</div>}><PurchasePage /></Suspense>} />
          
          {/* 销售专用页面 */}
          <Route path="/sales-reconciliation" element={<Suspense fallback={<div>加载中...</div>}><SalesReconciliationPage /></Suspense>} />
          
          {/* 认证测试页面 */}
          <Route path="/auth-test" element={<Suspense fallback={<div>加载中...</div>}><AuthTestPage /></Suspense>} />
          
          {/* 管理员登录页面 */}
          <Route path="/admin" element={<Suspense fallback={<div>加载中...</div>}><AdminLoginPage /></Suspense>} />
          
          {/* 管理员后台页面 - 需要认证 */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* 默认重定向到销售页面 */}
          <Route path="/" element={<Suspense fallback={<div>加载中...</div>}><Navigate to="/sales" replace /></Suspense>} />
          
          {/* 404页面 - 排除管理员路径 */}
          <Route path="*" element={<Suspense fallback={<div>加载中...</div>}><Navigate to="/sales" replace /></Suspense>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 