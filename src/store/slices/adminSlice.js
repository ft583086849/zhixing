import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

// 异步action：获取统计信息
export const getStats = createAsyncThunk(
  'admin/getStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getStats(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取统计信息失败');
    }
  }
);

// 异步action：获取订单列表
export const getAdminOrders = createAsyncThunk(
  'admin/getAdminOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取订单列表失败');
    }
  }
);

// 异步action：导出订单数据
export const exportOrders = createAsyncThunk(
  'admin/exportOrders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.exportOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '导出失败');
    }
  }
);

// 异步action：获取销售链接列表
export const getSalesLinks = createAsyncThunk(
  'admin/getSalesLinks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getSalesLinks(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取销售链接列表失败');
    }
  }
);

// 异步action：获取客户列表
export const getCustomers = createAsyncThunk(
  'admin/getCustomers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getCustomers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取客户列表失败');
    }
  }
);

// 异步action：更新订单状态
export const updateAdminOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateOrderStatus(orderId, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '更新订单状态失败');
    }
  }
);

// 异步action：获取销售列表
export const getSales = createAsyncThunk(
  'admin/getSales',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getSales(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取销售列表失败');
    }
  }
);

// 异步action：获取销售层级统计
export const getSalesHierarchyStats = createAsyncThunk(
  'admin/getSalesHierarchyStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getSalesHierarchyStats(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取销售层级统计失败');
    }
  }
);

// 异步action：更新佣金比率
export const updateCommissionRate = createAsyncThunk(
  'admin/updateCommissionRate',
  async ({ salesId, commissionRate }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateCommissionRate(salesId, commissionRate);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '更新佣金比率失败');
    }
  }
);

// 异步action：下载佣金数据
export const downloadCommissionData = createAsyncThunk(
  'admin/downloadCommissionData',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.downloadCommissionData(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '下载佣金数据失败');
    }
  }
);

const initialState = {
  stats: {
    total_orders: 0,
    pending_payment_orders: 0,
    pending_config_orders: 0,
    confirmed_payment_orders: 0,
    confirmed_config_orders: 0,
    total_amount: 0,
    total_commission: 0,
    one_month_orders: 0,
    three_month_orders: 0,
    six_month_orders: 0,
    lifetime_orders: 0,
    one_month_percentage: 0,
    three_month_percentage: 0,
    six_month_percentage: 0,
    lifetime_percentage: 0,
  },
  orders: [],
  sales: [], // 添加缺失的sales字段
  salesLinks: [],
  customers: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  },
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取统计信息
      .addCase(getStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStats.fulfilled, (state, action) => {
        state.loading = false;
        // 修复：后端返回的是 { success: true, data: {...} } 结构
        state.stats = action.payload.data || action.payload;
      })
      .addCase(getStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取销售列表
      .addCase(getSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSales.fulfilled, (state, action) => {
        state.loading = false;
        // 修复：后端返回的是 { success: true, data: { sales: [...], pagination: {...} } } 结构
        const data = action.payload.data || action.payload;
        state.sales = data.sales || data || [];
        if (data.pagination) {
          state.pagination = data.pagination;
        }
      })
      .addCase(getSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取订单列表
      .addCase(getAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        // 修复：后端返回的是 { success: true, data: {...} } 结构
        const data = action.payload.data || action.payload;
        state.orders = data.orders;
        state.pagination = data.pagination;
      })
      .addCase(getAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 导出订单数据
      .addCase(exportOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportOrders.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取销售链接列表
      .addCase(getSalesLinks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSalesLinks.fulfilled, (state, action) => {
        state.loading = false;
        // 修复：后端返回的是 { success: true, data: {...} } 结构
        state.salesLinks = action.payload.data || action.payload;
      })
      .addCase(getSalesLinks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新订单状态
      .addCase(updateAdminOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdminOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        // 更新本地订单状态
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.data.orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = action.payload.data.status;
        }
      })
      .addCase(updateAdminOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取客户列表
      .addCase(getCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomers.fulfilled, (state, action) => {
        state.loading = false;
        // 修复：后端返回的是 { success: true, data: { customers: [...], pagination: {...} } } 结构
        const data = action.payload.data || action.payload;
        state.customers = data.customers || data || [];
      })
      .addCase(getCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setPagination } = adminSlice.actions;
export default adminSlice.reducer; 