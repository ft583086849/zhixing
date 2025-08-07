import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AdminAPI } from '../../services/api';

// 异步action：获取支付配置
export const getPaymentConfig = createAsyncThunk(
  'paymentConfig/getPaymentConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AdminAPI.getPaymentConfig();
      console.log('获取到的支付配置:', response);
      return response;
    } catch (error) {
      console.error('获取支付配置失败:', error);
      return rejectWithValue(error.message || '获取支付配置失败');
    }
  }
);

// 异步action：更新支付配置
export const updatePaymentConfig = createAsyncThunk(
  'paymentConfig/updatePaymentConfig',
  async (configData, { rejectWithValue }) => {
    try {
      console.log('Redux: 正在更新支付配置', configData);
      const response = await AdminAPI.updatePaymentConfig(configData);
      console.log('Redux: 支付配置更新成功', response);
      return response;
    } catch (error) {
      console.error('Redux: 更新支付配置失败', error);
      return rejectWithValue(error.message || '更新支付配置失败');
    }
  }
);

const initialState = {
  config: null,
  loading: false,
  updating: false,
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
      // 获取支付配置
      .addCase(getPaymentConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(getPaymentConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新支付配置
      .addCase(updatePaymentConfig.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updatePaymentConfig.fulfilled, (state, action) => {
        state.updating = false;
        state.config = action.payload;
      })
      .addCase(updatePaymentConfig.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = paymentConfigSlice.actions;
export default paymentConfigSlice.reducer;