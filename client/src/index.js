import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import { store } from './store';
import './index.css';

// === 全局调试对象挂载 ===
import { AdminAPI } from './services/api';
// 如果你有supabase-js初始化的supabaseClient，按实际情况补充
// import { createClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  window.store = store;
  window.adminAPI = AdminAPI;
  // 如果你有supabaseClient，按实际情况补充
  // window.supabaseClient = createClient(
  //   process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  //   process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);