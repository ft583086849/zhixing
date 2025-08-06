import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import salesReducer from './slices/salesSlice';
import ordersReducer from './slices/ordersSlice';
import adminReducer from './slices/adminSlice';

import paymentConfigReducer from './slices/paymentConfigSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sales: salesReducer,
    orders: ordersReducer,
    admin: adminReducer,
    paymentConfig: paymentConfigReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
}); 