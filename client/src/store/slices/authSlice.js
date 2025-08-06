import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// 异步action：管理员登录
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      console.log('authAPI.login 响应:', response);
      
      // 兼容不同的响应结构
      let authData;
      if (response.data) {
        authData = response.data;
      } else {
        authData = response;
      }
      
      // 保存token到localStorage
      if (authData.token) {
        localStorage.setItem('token', authData.token);
      }
      
      return authData;
    } catch (error) {
      console.error('登录失败:', error);
      return rejectWithValue(error.message || '登录失败');
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
    // 清理所有认证相关的本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return null;
  }
);

const initialState = {
  admin: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'), // 如果有token就认为已认证
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
        state.error = null;
        
        // 统一处理登录成功状态
        if (action.payload && action.payload.token) {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.admin = action.payload.user || action.payload.admin || {
            username: 'admin',
            name: '系统管理员'
          };
          
          // 确保token已保存到localStorage
          localStorage.setItem('token', action.payload.token);
        } else {
          // 兼容旧的数据结构
          state.admin = action.payload.user || action.payload.admin;
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