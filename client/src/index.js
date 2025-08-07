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
import { supabase } from './services/supabase';

if (typeof window !== 'undefined') {
  window.store = store;
  window.adminAPI = AdminAPI;
  window.supabaseClient = supabase;
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