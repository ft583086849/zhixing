import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI } from '../../services/api';

// 异步action：创建订单
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.createOrder(orderData);
      return response.data;
    } catch (error) {
      // 订单创建失败时显示友好提示
      return rejectWithValue('下单拥挤，请等待');
    }
  }
);

// 异步action：获取订单列表
export const getOrdersList = createAsyncThunk(
  'orders/getOrdersList',
  async (params, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrdersList(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取订单列表失败');
    }
  }
);

// 异步action：更新订单状态
export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.updateOrderStatus(orderId, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '更新订单状态失败');
    }
  }
);

const initialState = {
  orders: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  },
  loading: false,
  error: null,
  createdOrder: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCreatedOrder: (state) => {
      state.createdOrder = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // 创建订单
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.createdOrder = action.payload.data;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取订单列表
      .addCase(getOrdersList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrdersList.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data.orders;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(getOrdersList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新订单状态
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        // 更新本地订单状态
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.data.orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = action.payload.data.status;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCreatedOrder, setPagination } = ordersSlice.actions;
export default ordersSlice.reducer; 