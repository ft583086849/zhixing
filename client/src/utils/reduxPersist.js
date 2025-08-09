/**
 * Redux状态持久化工具
 * 用于解决页面刷新后数据显示为0的问题
 */

const STORAGE_KEY = 'zhixing_admin_state';
const EXPIRY_TIME = 30 * 60 * 1000; // 30分钟过期

/**
 * 保存状态到localStorage
 */
export const saveState = (state) => {
  try {
    // 保存所有业务数据（不保存loading/error状态）
    const stateToPersist = {
      admin: {
        stats: state.admin?.stats || {},
        sales: state.admin?.sales || [],
        orders: state.admin?.orders || [],
        customers: state.admin?.customers || [],
        salesLinks: state.admin?.salesLinks || {},
      },
      sales: {
        currentSales: state.sales?.currentSales || null,
        salesList: state.sales?.salesList || [],
        settlementData: state.sales?.settlementData || null,
      },
      orders: {
        orders: state.orders?.orders || [],
        createdOrder: state.orders?.createdOrder || null,
      },
      paymentConfig: {
        config: state.paymentConfig?.config || null,
      },
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
  } catch (error) {
    console.warn('保存状态失败:', error);
  }
};

/**
 * 从localStorage加载状态
 */
export const loadState = () => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (!serializedState) return undefined;
    
    const state = JSON.parse(serializedState);
    
    // 检查数据是否过期
    if (Date.now() - state.timestamp > EXPIRY_TIME) {
      localStorage.removeItem(STORAGE_KEY);
      return undefined;
    }
    
    // 返回恢复的状态（所有模块）
    return {
      admin: {
        ...state.admin,
        loading: false,
        error: null,
        pagination: { current: 1, pageSize: 100 }
      },
      sales: {
        ...state.sales,
        loading: false,
        error: null
      },
      orders: {
        ...state.orders,
        loading: false,
        error: null
      },
      paymentConfig: {
        ...state.paymentConfig,
        loading: false,
        error: null
      }
    };
  } catch (error) {
    console.warn('加载状态失败:', error);
    return undefined;
  }
};

/**
 * 清除持久化状态
 */
export const clearPersistedState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('清除状态失败:', error);
  }
};

/**
 * 节流函数，避免频繁写入localStorage
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  };
};
