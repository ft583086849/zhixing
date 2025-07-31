import axios from 'axios';
import { getCDNUrl } from '../config/cdn';

import { message } from 'antd';
// 全局错误处理
const errorHandler = (error) => {
  console.error('API错误:', error);
  
  if (error.response) {
    // 服务器响应错误
    const { status, data } = error.response;
    switch (status) {
      case 401:
        message.error('登录已过期，请重新登录');
        // 清除本地存储并跳转到登录页
        localStorage.removeItem('token');
        window.location.href = '/#/admin/login';
        break;
      case 403:
        message.error('没有权限访问此资源');
        break;
      case 404:
        message.error('请求的资源不存在');
        break;
      case 500:
        message.error('服务器内部错误，请稍后重试');
        break;
      default:
        message.error(data?.message || '请求失败，请重试');
    }
  } else if (error.request) {
    // 网络错误
    message.error('网络连接失败，请检查网络设置');
  } else {
    // 其他错误
    message.error('发生未知错误，请重试');
  }
  
  return Promise.reject(error);
};

// API缓存配置
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 缓存工具函数
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const clearCache = () => {
  cache.clear();
};


// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // 修复：管理员页面应该跳转到/admin而不是/login
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 认证API
export const authAPI = {
  login: (credentials) => api.post('/auth?path=login', credentials),
  verifyToken: () => api.get('/auth?path=verify'),
};

// 销售API
export const salesAPI = {
  createSales: (data) => api.post('/sales?path=create', data),
  getSalesByLink: (linkCode) => api.get(`/sales?link_code=${linkCode}`),
  getAllSales: () => api.get('/sales?path=list'),
};

// 订单API
export const ordersAPI = {
  createOrder: (data) => {
    // 使用JSON格式发送数据，包括Base64图片
    return api.post('/orders?path=create', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
  getOrdersList: (params) => api.get('/orders', { params }),
  updateOrderStatus: (orderId, status) => api.put(`/orders?path=update&id=${orderId}`, { status }),
};

// 管理员API
export const adminAPI = {
  getStats: (params) => api.get('/admin?path=stats', { params }),
  getOrders: (params) => api.get('/admin?path=orders', { params }),
  exportOrders: (params) => api.get('/admin?path=export', { 
    params,
    responseType: 'blob'
  }),
  getSalesLinks: (params) => api.get('/admin?path=links', { params }),
  getCustomers: (params) => api.get('/admin?path=customers', { params }),
  updateOrderStatus: (orderId, status) => api.put(`/admin?path=update-order&id=${orderId}`, { status }),
  getPaymentConfig: () => api.get('/payment-config'),
  savePaymentConfig: (data) => api.post('/payment-config', data),
  getSales: (params) => api.get('/admin?path=sales', { params }),
  updateCommissionRate: (salesId, commissionRate) => api.put(`/admin?path=update-commission&id=${salesId}`, { commissionRate }),
  downloadCommissionData: (params) => api.get('/admin?path=commission-export', { 
    params,
    responseType: 'blob'
  }),
};

// 永久授权限量API已移除

export default api; 