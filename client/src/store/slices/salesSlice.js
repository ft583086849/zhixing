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

const initialState = {
  currentSales: null,
  allSales: [],
  createdLink: null,
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
      });
  },
});

export const { clearError, clearCurrentSales, clearCreatedLink } = salesSlice.actions;
export default salesSlice.reducer; 