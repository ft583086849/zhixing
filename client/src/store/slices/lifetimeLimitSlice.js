import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { lifetimeLimitAPI } from '../../services/api';

// 异步action：获取永久授权限量信息
export const getLifetimeLimitInfo = createAsyncThunk(
  'lifetimeLimit/getInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await lifetimeLimitAPI.getLimitInfo();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取限量信息失败');
    }
  }
);

// 异步action：更新永久授权限量配置
export const updateLifetimeLimitConfig = createAsyncThunk(
  'lifetimeLimit/updateConfig',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await lifetimeLimitAPI.updateConfig(configData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '更新配置失败');
    }
  }
);

const initialState = {
  totalLimit: 100,
  soldCount: 0,
  remainingCount: 100,
  isAvailable: true,
  isActive: true,
  loading: false,
  error: null
};

const lifetimeLimitSlice = createSlice({
  name: 'lifetimeLimit',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // 获取限量信息
      .addCase(getLifetimeLimitInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLifetimeLimitInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.totalLimit = action.payload.total_limit;
        state.soldCount = action.payload.sold_count;
        state.remainingCount = action.payload.remaining_count;
        state.isAvailable = action.payload.is_available;
        state.isActive = action.payload.is_active;
      })
      .addCase(getLifetimeLimitInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新配置
      .addCase(updateLifetimeLimitConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLifetimeLimitConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.totalLimit = action.payload.total_limit;
        state.soldCount = action.payload.sold_count;
        state.remainingCount = action.payload.remaining_count;
        state.isActive = action.payload.is_active;
      })
      .addCase(updateLifetimeLimitConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, resetState } = lifetimeLimitSlice.actions;
export default lifetimeLimitSlice.reducer; 