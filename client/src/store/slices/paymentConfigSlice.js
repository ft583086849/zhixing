import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI, publicAPI } from '../../services/api';

// 异步action：获取收款配置（公开访问）
export const getPaymentConfig = createAsyncThunk(
  'paymentConfig/getPaymentConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await publicAPI.getPaymentConfig();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取收款配置失败');
    }
  }
);

// 异步action：保存收款配置
export const savePaymentConfig = createAsyncThunk(
  'paymentConfig/savePaymentConfig',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await adminAPI.savePaymentConfig(configData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '保存收款配置失败');
    }
  }
);

// 异步action：更新收款配置
export const updatePaymentConfig = createAsyncThunk(
  'paymentConfig/updatePaymentConfig',
  async (configData, { rejectWithValue }) => {
    try {
      const response = await adminAPI.savePaymentConfig(configData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '更新收款配置失败');
    }
  }
);

const initialState = {
  config: null,
  loading: false,
  error: null,
};

const paymentConfigSlice = createSlice({
  name: 'paymentConfig',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取收款配置
      .addCase(getPaymentConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload.data;
      })
      .addCase(getPaymentConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 保存收款配置
      .addCase(savePaymentConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePaymentConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload.data;
      })
      .addCase(savePaymentConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新收款配置
      .addCase(updatePaymentConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePaymentConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload.data;
      })
      .addCase(updatePaymentConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = paymentConfigSlice.actions;
export default paymentConfigSlice.reducer; 