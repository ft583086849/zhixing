# 📚 错题本 - RTK架构重构后

## 🗓️ 创建时间
2024年12月 - 架构重构到现代Redux模式后的问题记录

## 📋 错题记录

### ❌ 错误 #001 - Redux Slice导出函数不匹配
**时间**: 2024年12月
**错误**: 部署失败 - `'updatePaymentConfig' is not exported from '../store/slices/paymentConfigSlice'`

#### 🔍 错误分析
**问题描述**: 
某个组件尝试导入`updatePaymentConfig`函数，但我创建的`paymentConfigSlice.js`只导出了基本的`getPaymentConfig`异步action，没有包含完整的CRUD操作。

**错误原因**:
1. **不完整的Slice设计** - 只考虑了GET操作，忽略了UPDATE、DELETE等常见操作
2. **没有遵循Redux Toolkit最佳实践** - 应该一次性定义完整的slice包含所有相关操作
3. **没有检查现有代码依赖** - 没有搜索代码库确认哪些函数被引用

#### ✅ 正确解决方案

**根据Redux Toolkit官方文档最佳实践:**

1. **创建完整的Slice定义**:
```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 完整的异步actions定义
export const getPaymentConfig = createAsyncThunk(
  'paymentConfig/getPaymentConfig',
  async (_, { rejectWithValue }) => {
    try {
      // API调用逻辑
      return configData;
    } catch (error) {
      return rejectWithValue('获取支付配置失败');
    }
  }
);

export const updatePaymentConfig = createAsyncThunk(
  'paymentConfig/updatePaymentConfig',
  async (configData, { rejectWithValue }) => {
    try {
      // API更新逻辑
      return updatedConfig;
    } catch (error) {
      return rejectWithValue('更新支付配置失败');
    }
  }
);

export const deletePaymentConfig = createAsyncThunk(
  'paymentConfig/deletePaymentConfig',
  async (configId, { rejectWithValue }) => {
    try {
      // API删除逻辑
      return { id: configId };
    } catch (error) {
      return rejectWithValue('删除支付配置失败');
    }
  }
);

const paymentConfigSlice = createSlice({
  name: 'paymentConfig',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // 其他同步reducers
  },
  extraReducers: (builder) => {
    builder
      // GET操作
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
      // UPDATE操作
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
      })
      // DELETE操作
      .addCase(deletePaymentConfig.fulfilled, (state) => {
        state.config = null;
      });
  },
});

export const { clearError } = paymentConfigSlice.actions;
export default paymentConfigSlice.reducer;
```

2. **预防措施检查清单**:
- ✅ 使用`grep`搜索代码库中的函数引用
- ✅ 定义完整的CRUD操作（Create, Read, Update, Delete）  
- ✅ 遵循Redux Toolkit命名约定
- ✅ 确保所有异步操作都有对应的extraReducers处理
- ✅ 在本地测试导入/导出是否正确

#### 📚 学到的教训
1. **架构设计要全面** - 不要只实现当前需要的功能，要考虑完整的生命周期
2. **代码库依赖分析很重要** - 在创建新文件前，先了解现有依赖关系
3. **Redux Toolkit有明确的模式** - 按照官方模式可以避免大多数问题
4. **测试驱动开发** - 先写测试，确保导出的函数能被正确使用

#### 🔗 参考资料
- [Redux Toolkit createSlice API](https://redux-toolkit.js.org/api/createSlice)
- [Redux Toolkit createAsyncThunk API](https://redux-toolkit.js.org/api/createAsyncThunk)
- [Modern Redux patterns](https://redux.js.org/usage/migrating-to-modern-redux)

---

## 📝 使用说明
1. 每次遇到问题时，详细记录错误现象
2. 分析根本原因，不只是表面症状  
3. 记录正确的解决方案和预防措施
4. 定期回顾，避免重复犯错

## 🎯 改进目标
- 建立完整的Redux架构检查清单
- 实施代码审查流程
- 加强对Redux Toolkit最佳实践的理解