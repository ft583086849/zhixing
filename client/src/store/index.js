import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import salesReducer from './slices/salesSlice';
import ordersReducer from './slices/ordersSlice';
import adminReducer from './slices/adminSlice';
import paymentConfigReducer from './slices/paymentConfigSlice';
import { loadState, saveState, throttle } from '../utils/reduxPersist';

// 加载持久化的状态
const persistedState = loadState();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sales: salesReducer,
    orders: ordersReducer,
    admin: adminReducer,
    paymentConfig: paymentConfigReducer,
  },
  preloadedState: persistedState, // 使用持久化的状态作为初始状态
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// 订阅store变化，保存状态到localStorage（节流处理，每秒最多保存一次）
store.subscribe(
  throttle(() => {
    const state = store.getState();
    // 保存条件：
    // 1. 管理员系统有数据
    // 2. 销售系统有数据
    // 3. 订单系统有数据
    // 4. 支付配置有数据
    const hasAdminData = state.admin?.stats?.total_orders >= 0 || 
                        state.admin?.sales?.length > 0 || 
                        state.admin?.orders?.length > 0 ||
                        state.admin?.customers?.length > 0;
    
    const hasSalesData = state.sales?.currentSales !== null || 
                        state.sales?.salesList?.length > 0;
    
    const hasOrderData = state.orders?.orders?.length > 0;
    
    const hasConfigData = state.paymentConfig?.config !== null;
    
    // 只要有任何数据就保存
    if (hasAdminData || hasSalesData || hasOrderData || hasConfigData) {
      saveState(state);
    }
  }, 1000)
); 