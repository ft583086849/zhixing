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
        window.location.href = '/#/admin';
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


// 创建axios实例 - 临时配置用于纯前端部署
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://api-placeholder.temp/api',
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

// 响应拦截器 - 添加临时mock响应用于纯前端部署
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 临时处理：如果API调用失败，返回mock数据
    if (error.code === 'ENOTFOUND' || error.message.includes('api-placeholder')) {
      console.log('🎯 纯前端模式：API调用被mock，返回示例数据');
      return Promise.resolve({
        data: { 
          success: true, 
          message: '纯前端演示模式',
          data: [] 
        }
      });
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // 401错误统一跳转到管理员登录页面
      window.location.href = '/#/admin';
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
  createPrimarySales: (data) => api.post('/primary-sales?path=create', data),
  getSalesByLink: (linkCode) => api.get(`/sales?sales_code=${linkCode}`),
  getAllSales: () => api.get('/sales?path=list'),
  getPrimarySalesSettlement: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/sales?path=primary-settlement&${queryString}`);
  },
  updateSecondaryCommissionRate: (secondarySalesId, commissionRate) => api.put(`/sales?path=update-secondary-commission&id=${secondarySalesId}`, { commissionRate }),
  removeSecondarySales: (secondarySalesId, reason) => api.put(`/sales?path=remove-secondary&id=${secondarySalesId}`, { reason }),
  // 一级销售订单结算相关API
  getPrimarySalesStats: () => api.get('/primary-sales?path=stats'),
  getPrimarySalesOrders: (params) => api.get('/primary-sales?path=orders', { params }),
  updateSecondarySalesCommission: (secondarySalesId, commissionRate) => api.put(`/primary-sales?path=update-commission&id=${secondarySalesId}`, { commissionRate }),
  urgeOrder: (orderId) => api.post(`/primary-sales?path=urge-order&id=${orderId}`),
  // 二级销售对账API
  getSecondarySalesSettlement: (params) => api.get('/secondary-sales?path=settlement', { params }),
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
  getSales: (params) => api.get('/admin?path=sales', { params }),
  getSalesLinks: (params) => api.get('/admin?path=links', { params }),
  getCustomers: (params) => api.get('/admin?path=customers', { params }),
  updateOrderStatus: (orderId, status) => api.put(`/admin?path=update-order&id=${orderId}`, { status }),
  updateCommissionRate: (salesId, commissionRate, salesType) => api.put(`/admin?path=update-commission&sales_id=${salesId}&sales_type=${salesType}`, { commission_rate: commissionRate }),
  updateSalesCommission: (salesId, commissionRate, salesType) => api.post('/admin?path=update-sales-commission', { salesId, commissionRate, salesType }),
  getPaymentConfig: () => api.get('/payment-config?path=get'),
  savePaymentConfig: (data) => api.put('/payment-config?path=update', data),
  getSalesHierarchyStats: (params) => api.get('/admin?path=sales-hierarchy-stats', { params }),
  downloadCommissionData: (params) => api.get('/admin?path=commission-export', { 
    params,
    responseType: 'blob'
  }),
  exportSalesData: (params) => api.get('/admin?path=export-sales', { 
    params,
    responseType: 'blob'
  }),
};

// 公开API（不需要认证）
export const publicAPI = {
  getPaymentConfig: () => api.get('/payment-config?path=public'),
};

// 永久授权限量API已移除

export default api; 