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
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '创建失败');
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
      return rejectWithValue(error.response?.data?.message || '获取失败');
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
  async (primarySalesId, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getPrimarySalesSettlement(primarySalesId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取失败');
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

const initialState = {
  currentSales: null,
  allSales: [],
  createdLink: null,
  createdLinks: null, // 一级销售的双链接
  primarySalesSettlement: null, // 一级销售订单结算信息
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
        state.createdLinks = action.payload.data;
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
        state.currentSales = action.payload.data;
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