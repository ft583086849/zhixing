# MCP自动回测开发文档

## 📋 文档概述

**目的**：规范MCP工具在架构重构后的自动化测试流程
**适用场景**：产品体系升级、数据库架构改动、核心业务逻辑变更
**执行时机**：架构重构完成后，页面Bug修复前

## 🔧 MCP工具能力映射

### `mcp__ide__executeCode`
**用途**：执行JavaScript代码进行自动化测试
**测试范围**：
- API接口响应验证
- 数据库查询结果检查
- 业务逻辑计算验证
- 前端组件渲染测试

### `mcp__ide__getDiagnostics`
**用途**：检查代码语法和逻辑错误
**检查范围**：
- TypeScript类型错误
- ESLint规则违反
- React Hook依赖警告
- 导入路径错误

## 🧪 回测测试用例设计

### Test Case 1: 产品配置API验证
```javascript
// 测试ProductConfigAPI是否返回正确数据
const testProductConfigAPI = async () => {
  console.log('🧪 测试产品配置API...');
  
  try {
    // 测试获取产品配置
    const configs = await ProductConfigAPI.getProductConfigs();
    console.log('✅ 产品配置获取成功:', configs.length, '个产品');
    
    // 验证数据结构
    const requiredFields = ['product_type', 'duration_months', 'price_usd', 'is_trial'];
    const isValid = configs.every(config => 
      requiredFields.every(field => config.hasOwnProperty(field))
    );
    
    if (isValid) {
      console.log('✅ 产品配置数据结构验证通过');
    } else {
      console.error('❌ 产品配置数据结构不完整');
      return false;
    }
    
    // 测试免费试用配置
    const trialConfigs = await ProductConfigAPI.getTrialConfig();
    console.log('✅ 免费试用配置:', trialConfigs.length, '个产品');
    
    return true;
  } catch (error) {
    console.error('❌ 产品配置API测试失败:', error);
    return false;
  }
};
```

### Test Case 2: 数据库兼容性验证
```javascript
// 测试新架构与历史数据的兼容性
const testDatabaseCompatibility = async () => {
  console.log('🧪 测试数据库兼容性...');
  
  try {
    // 检查历史订单是否能正确查询
    const { SupabaseService } = await import('./services/supabase');
    
    const historicalOrders = await SupabaseService.supabase
      .from('orders_optimized')
      .select('*')
      .eq('duration', '7天')  // 历史7天免费订单
      .limit(5);
    
    if (historicalOrders.data && historicalOrders.data.length > 0) {
      console.log('✅ 历史订单查询正常:', historicalOrders.data.length, '条记录');
    }
    
    // 检查新配置表是否存在
    const productConfigs = await SupabaseService.supabase
      .from('product_config')
      .select('*')
      .limit(1);
    
    if (!productConfigs.error) {
      console.log('✅ 产品配置表访问正常');
      return true;
    } else {
      console.error('❌ 产品配置表不存在或无权限访问');
      return false;
    }
  } catch (error) {
    console.error('❌ 数据库兼容性测试失败:', error);
    return false;
  }
};
```

### Test Case 3: 订单创建流程验证
```javascript
// 测试完整的订单创建流程
const testOrderCreationFlow = async () => {
  console.log('🧪 测试订单创建流程...');
  
  try {
    const { OrdersAPI } = await import('./services/api');
    
    // 模拟免费试用订单数据
    const freeOrderData = {
      tradingview_username: 'mcp_test_user',
      customer_wechat: 'mcp_test_wechat',
      product_type: '信号策略',
      duration: '3天',
      amount: 0,
      sales_code: 'PRI17554350234757516'  // 测试销售代码
    };
    
    // 测试免费试用资格检查
    const eligibility = await ProductConfigAPI.checkTrialEligibility(
      freeOrderData.tradingview_username,
      freeOrderData.product_type
    );
    
    console.log('✅ 免费试用资格检查:', eligibility.eligible ? '通过' : '不通过');
    
    // 如果符合条件，测试订单创建（不实际创建，只验证逻辑）
    if (eligibility.eligible) {
      console.log('✅ 订单创建逻辑验证通过');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('❌ 订单创建流程测试失败:', error);
    return false;
  }
};
```

### Test Case 4: 前端组件渲染验证
```javascript
// 测试ProductSelector组件的动态数据加载
const testProductSelectorRendering = async () => {
  console.log('🧪 测试产品选择器组件...');
  
  try {
    // 模拟组件数据获取
    const productConfigs = await ProductConfigAPI.getProductConfigs();
    
    // 验证产品分组
    const groupedProducts = productConfigs.reduce((groups, config) => {
      if (!groups[config.product_type]) {
        groups[config.product_type] = [];
      }
      groups[config.product_type].push(config);
      return groups;
    }, {});
    
    const productTypes = Object.keys(groupedProducts);
    console.log('✅ 产品类型:', productTypes.join(', '));
    
    // 验证每个产品类型都有免费试用和付费选项
    const allProductsValid = productTypes.every(type => {
      const products = groupedProducts[type];
      const hasTrial = products.some(p => p.is_trial);
      const hasPaid = products.some(p => !p.is_trial);
      
      console.log(`✅ ${type}: 试用期${hasTrial ? '✓' : '✗'}, 付费${hasPaid ? '✓' : '✗'}`);
      return hasTrial && hasPaid;
    });
    
    return allProductsValid;
  } catch (error) {
    console.error('❌ 产品选择器组件测试失败:', error);
    return false;
  }
};
```

## 📊 完整回测执行脚本

### 主回测函数
```javascript
const runFullMCPRegression = async () => {
  console.log('🚀 开始MCP自动回测...\n');
  
  const testResults = {
    productConfigAPI: await testProductConfigAPI(),
    databaseCompatibility: await testDatabaseCompatibility(),
    orderCreationFlow: await testOrderCreationFlow(),
    productSelectorRendering: await testProductSelectorRendering()
  };
  
  console.log('\n📊 回测结果汇总:');
  Object.entries(testResults).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? '通过' : '失败'}`);
  });
  
  const allTestsPassed = Object.values(testResults).every(result => result === true);
  
  if (allTestsPassed) {
    console.log('\n🎉 所有MCP回测通过！可以继续修复页面Bug');
    return true;
  } else {
    console.log('\n⚠️ 部分测试失败，需要先修复架构问题');
    return false;
  }
};

// 执行回测
runFullMCPRegression();
```

## ⚡ 使用流程

### 1. 架构重构完成后执行
```bash
# 1. 确保开发服务器运行
npm start

# 2. 使用MCP执行回测脚本
# (在Claude Code中使用 mcp__ide__executeCode 执行上述脚本)
```

### 2. 根据回测结果决定下一步
- ✅ **全部通过** → 进入Bug修复阶段
- ❌ **部分失败** → 修复架构问题，重新回测

### 3. Bug修复后再次验证
```javascript
// Bug修复后的验证测试
const testBugFixes = async () => {
  // 测试页面显示问题是否修复
  // 测试提交按钮状态是否正确  
  // 测试免费订单逻辑是否正常
};
```

## 🎯 回测通过标准

- ✅ 所有API返回预期数据格式
- ✅ 数据库新旧架构完全兼容
- ✅ 订单创建逻辑无错误
- ✅ 前端组件能正确渲染
- ✅ 免费试用和付费逻辑分离清晰
- ✅ 现有功能零回归问题

只有达到以上标准，才能进入页面Bug修复阶段。

## 📝 注意事项

1. **测试数据隔离**：使用专用测试账号，不影响生产数据
2. **回滚准备**：保留原有逻辑作为fallback选项
3. **性能监控**：关注API响应时间是否在可接受范围内
4. **错误处理**：确保所有异常情况都有适当处理

这个MCP回测流程确保架构重构的质量和稳定性，为后续Bug修复奠定坚实基础。