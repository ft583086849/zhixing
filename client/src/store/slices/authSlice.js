import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// 异步action：管理员登录
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      // 保存token到localStorage
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '登录失败');
    }
  }
);

// 异步action：验证token
export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到token');
      }
      const response = await authAPI.verifyToken();
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue(error.response?.data?.message || 'token验证失败');
    }
  }
);

// 异步action：登出
export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('token');
    return null;
  }
);

const initialState = {
  admin: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false, // 初始状态为未认证，等待token验证
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // 🔧 临时设置认证状态
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
      if (action.payload) {
        state.admin = { username: 'admin', name: '系统管理员(临时)' };
        state.token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('Redux: login.fulfilled 被调用');
        console.log('Redux: action.payload:', action.payload);
        
        state.loading = false;
        state.isAuthenticated = true;
        
        // 修复数据结构匹配问题
        if (action.payload.data) {
          // AuthService返回的结构: { data: { token, user } }
          state.admin = action.payload.data.user;
          state.token = action.payload.data.token;
        } else {
          // 直接结构: { token, user }
          state.admin = action.payload.user;
          state.token = action.payload.token;
        }
        
        console.log('Redux: 设置后的state.token:', state.token);
        console.log('Redux: 设置后的state.admin:', state.admin);
        
        // 确保localStorage和Redux状态同步
        localStorage.setItem('token', state.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 验证token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.admin = action.payload.data.admin;
        state.token = localStorage.getItem('token'); // 确保token状态同步
      })
      .addCase(verifyToken.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.admin = null;
        state.token = null; // 验证失败时清除token，保持状态一致性
        localStorage.removeItem('token'); // 同时清除localStorage
      })
      // 登出
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.admin = null;
        state.token = null;
        // 确保localStorage也被清除
        localStorage.removeItem('token');
      });
  },
});

export const { clearError, setAuthenticated } = authSlice.actions;
export default authSlice.reducer; 