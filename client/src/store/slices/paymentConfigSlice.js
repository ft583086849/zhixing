import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 异步action：获取支付配置
export const getPaymentConfig = createAsyncThunk(
  'paymentConfig/getPaymentConfig',
  async (_, { rejectWithValue }) => {
    try {
      // 返回默认支付配置
      return {
        alipay: {
          enabled: true,
          account: '支付宝账户配置'
        },
        crypto: {
          enabled: true,
          address: '加密货币地址配置'
        }
      };
    } catch (error) {
      return rejectWithValue('获取支付配置失败');
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
      });
  },
});

export const { clearError } = paymentConfigSlice.actions;
export default paymentConfigSlice.reducer;