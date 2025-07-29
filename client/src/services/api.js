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
  login: (credentials) => api.post('/auth/login', credentials),
  verifyToken: () => api.get('/auth/verify'),
};

// 销售API
export const salesAPI = {
  createSales: (data) => api.post('/sales/create', data),
  getSalesByLink: (linkCode) => api.get(`/sales/link/${linkCode}`),
  getAllSales: () => api.get('/sales/all'),
};

// 订单API
export const ordersAPI = {
  createOrder: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/orders/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getOrdersList: (params) => api.get('/orders/list', { params }),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { status }),
};

// 管理员API
export const adminAPI = {
  getStats: (params) => api.get('/admin/stats', { params }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  exportOrders: (params) => api.get('/admin/export', { 
    params,
    responseType: 'blob'
  }),
  getSalesLinks: (params) => api.get('/admin/links', { params }),
  getCustomers: (params) => api.get('/admin/customers', { params }),
  updateOrderStatus: (orderId, status) => api.put(`/admin/orders/${orderId}/status`, { status }),
  getPaymentConfig: () => api.get('/admin/payment-config'),
  savePaymentConfig: (data) => api.post('/admin/payment-config', data),
  getSales: (params) => api.get('/admin/sales', { params }),
  updateCommissionRate: (salesId, commissionRate) => api.put(`/admin/sales/${salesId}/commission-rate`, { commissionRate }),
  downloadCommissionData: (params) => api.get('/admin/commission-export', { 
    params,
    responseType: 'blob'
  }),
};

// 永久授权限量API
export const lifetimeLimitAPI = {
  getLimitInfo: () => api.get('/lifetime-limit/info'),
  updateConfig: (data) => api.put('/lifetime-limit/config', data),
  incrementSold: () => api.post('/lifetime-limit/increment'),
  decrementSold: () => api.post('/lifetime-limit/decrement'),
};

export default api; 