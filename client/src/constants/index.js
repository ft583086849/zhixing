
// 系统常量

// API状态码
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
};

// 订单状态
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CONFIRMED_CONFIG: 'confirmed_config',
  CANCELLED: 'cancelled'
};

// 支付方式
export const PAYMENT_METHODS = {
  ALIPAY: 'alipay',
  WECHAT: 'wechat'
};

// 购买时长
export const DURATION_OPTIONS = {
  SEVEN_DAYS: '7days',
  ONE_MONTH: '1month',
  THREE_MONTHS: '3months',
  SIX_MONTHS: '6months',
  ONE_YEAR: '1year',
  LIFETIME: 'lifetime'
};

// 页面路由
export const ROUTES = {
  HOME: '/',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_SALES: '/admin/sales',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_PAYMENT_CONFIG: '/admin/payment-config',
  SALES: '/sales',
  PURCHASE: '/purchase'
};

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  THEME: 'theme',
  LANGUAGE: 'language'
};

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: ['10', '20', '50', '100']
};

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
};
