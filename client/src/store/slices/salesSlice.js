import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { salesAPI } from '../../services/api';

// 异步action：创建销售收款信息
export const createSales = createAsyncThunk(
  'sales/createSales',
  async (salesData, { rejectWithValue }) => {
    try {
      const response = await salesAPI.createSales(salesData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '创建失败');
    }
  }
);

// 异步action：创建一级销售收款信息
export const createPrimarySales = createAsyncThunk(
  'sales/createPrimarySales',
  async (salesData, { rejectWithValue }) => {
    try {
      const response = await salesAPI.createPrimarySales(salesData);
      console.log('createPrimarySales API 响应:', response);
      
      // 修复数据结构问题：如果response包含success字段，说明是包装格式
      if (response.success && response.data) {
        return response.data; // 返回实际的链接数据
      }
      
      // 否则按原来的逻辑处理
      return response.data || response;
    } catch (error) {
      console.error('createPrimarySales 错误:', error);
      return rejectWithValue(error.message || '创建失败');
    }
  }
);

// 异步action：获取销售信息
export const getSalesByLink = createAsyncThunk(
  'sales/getSalesByLink',
  async (linkCode, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getSalesByLink(linkCode);
      return response.data;
    } catch (error) {
      // 显示更具体的错误信息，但保持用户友好性  
      console.error('销售链接查找失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '下单拥挤，请等待';
      return rejectWithValue(errorMessage);
    }
  }
);

// 异步action：获取所有销售信息
export const getAllSales = createAsyncThunk(
  'sales/getAllSales',
  async (_, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getAllSales();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取失败');
    }
  }
);

// 异步action：获取一级销售订单结算信息
export const getPrimarySalesSettlement = createAsyncThunk(
  'sales/getPrimarySalesSettlement',
  async (params, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getPrimarySalesSettlement(params);
      // 修复：正确处理响应数据结构
      return response.data || response; // 返回实际数据
    } catch (error) {
      console.error('getPrimarySalesSettlement error:', error);
      return rejectWithValue(error.message || error.response?.data?.message || '获取失败');
    }
  }
);

// 异步action：更新二级销售佣金比率
export const updateSecondaryCommissionRate = createAsyncThunk(
  'sales/updateSecondaryCommissionRate',
  async ({ secondarySalesId, commissionRate }, { rejectWithValue }) => {
    try {
      const response = await salesAPI.updateSecondaryCommissionRate(secondarySalesId, commissionRate);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '更新失败');
    }
  }
);

// 异步action：移除二级销售
export const removeSecondarySales = createAsyncThunk(
  'sales/removeSecondarySales',
  async ({ secondarySalesId, reason }, { rejectWithValue }) => {
    try {
      const response = await salesAPI.removeSecondarySales(secondarySalesId, reason);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '移除失败');
    }
  }
);

// 异步action：获取一级销售统计数据
export const fetchPrimarySalesStats = createAsyncThunk(
  'sales/fetchPrimarySalesStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getPrimarySalesStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取统计数据失败');
    }
  }
);

// 异步action：获取一级销售订单列表
export const fetchPrimarySalesOrders = createAsyncThunk(
  'sales/fetchPrimarySalesOrders',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getPrimarySalesOrders({ page, limit });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取订单列表失败');
    }
  }
);

// 异步action：更新二级销售佣金率
export const updateSecondarySalesCommission = createAsyncThunk(
  'sales/updateSecondarySalesCommission',
  async ({ secondarySalesId, commissionRate }, { rejectWithValue }) => {
    try {
      const response = await salesAPI.updateSecondarySalesCommission(secondarySalesId, commissionRate);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '更新佣金率失败');
    }
  }
);

// 异步action：催单
export const urgeOrder = createAsyncThunk(
  'sales/urgeOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await salesAPI.urgeOrder(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '催单失败');
    }
  }
);

const initialState = {
  currentSales: null,
  allSales: [],
  createdLink: null,
  createdLinks: null, // 一级销售的双链接
  primarySalesSettlement: null, // 一级销售订单结算信息
  primarySalesStats: null, // 一级销售统计数据
  primarySalesOrders: null, // 一级销售订单列表
  loading: false,
  error: null,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentSales: (state) => {
      state.currentSales = null;
    },
    clearCreatedLink: (state) => {
      state.createdLink = null;
    },
    clearCreatedLinks: (state) => {
      state.createdLinks = null;
    },
    clearPrimarySalesSettlement: (state) => {
      state.primarySalesSettlement = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 创建销售收款信息
      .addCase(createSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSales.fulfilled, (state, action) => {
        state.loading = false;
        state.createdLink = action.payload.data;
      })
      .addCase(createSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 创建一级销售收款信息
      .addCase(createPrimarySales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPrimarySales.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Redux收到createPrimarySales数据:', action.payload);
        state.createdLinks = action.payload; // 修复：action.payload已经是链接数据
      })
      .addCase(createPrimarySales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取销售信息
      .addCase(getSalesByLink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSalesByLink.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Redux收到getSalesByLink数据:', action.payload);
        // 修复：如果payload包含success字段，说明是包装格式，提取data
        if (action.payload && action.payload.success && action.payload.data) {
          state.currentSales = action.payload.data;
        } else {
          state.currentSales = action.payload;
        }
      })
      .addCase(getSalesByLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取所有销售信息
      .addCase(getAllSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSales.fulfilled, (state, action) => {
        state.loading = false;
        state.allSales = action.payload.data;
      })
      .addCase(getAllSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取一级销售订单结算信息
      .addCase(getPrimarySalesSettlement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPrimarySalesSettlement.fulfilled, (state, action) => {
        state.loading = false;
        state.primarySalesSettlement = action.payload.data;
      })
      .addCase(getPrimarySalesSettlement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新二级销售佣金比率
      .addCase(updateSecondaryCommissionRate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSecondaryCommissionRate.fulfilled, (state, action) => {
        state.loading = false;
        // 更新本地状态
        if (state.primarySalesSettlement) {
          const secondarySales = state.primarySalesSettlement.secondarySales || [];
          const updatedIndex = secondarySales.findIndex(s => s.id === action.payload.data.id);
          if (updatedIndex !== -1) {
            secondarySales[updatedIndex] = action.payload.data;
          }
        }
      })
      .addCase(updateSecondaryCommissionRate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 移除二级销售
      .addCase(removeSecondarySales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeSecondarySales.fulfilled, (state, action) => {
        state.loading = false;
        // 更新本地状态
        if (state.primarySalesSettlement) {
          const secondarySales = state.primarySalesSettlement.secondarySales || [];
          const removedIndex = secondarySales.findIndex(s => s.id === action.payload.data.id);
          if (removedIndex !== -1) {
            secondarySales.splice(removedIndex, 1);
          }
        }
      })
      .addCase(removeSecondarySales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取一级销售统计数据
      .addCase(fetchPrimarySalesStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrimarySalesStats.fulfilled, (state, action) => {
        state.loading = false;
        state.primarySalesStats = action.payload.data;
      })
      .addCase(fetchPrimarySalesStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取一级销售订单列表
      .addCase(fetchPrimarySalesOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrimarySalesOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.primarySalesOrders = action.payload.data;
      })
      .addCase(fetchPrimarySalesOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新二级销售佣金率
      .addCase(updateSecondarySalesCommission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSecondarySalesCommission.fulfilled, (state, action) => {
        state.loading = false;
        // 更新本地状态
        if (state.primarySalesStats && state.primarySalesStats.secondarySales) {
          const secondarySales = state.primarySalesStats.secondarySales;
          const updatedIndex = secondarySales.findIndex(s => s.id === action.payload.data.id);
          if (updatedIndex !== -1) {
            secondarySales[updatedIndex] = action.payload.data;
          }
        }
      })
      .addCase(updateSecondarySalesCommission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 催单
      .addCase(urgeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(urgeOrder.fulfilled, (state, action) => {
        state.loading = false;
        // 催单成功，可以更新订单状态
      })
      .addCase(urgeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearCurrentSales, 
  clearCreatedLink, 
  clearCreatedLinks,
  clearPrimarySalesSettlement 
} = salesSlice.actions;

export default salesSlice.reducer; 