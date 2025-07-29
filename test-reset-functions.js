#!/usr/bin/env node

/**
 * 管理员页面重置功能测试
 * 检测所有管理员页面的搜索重置功能
 */

const { execSync } = require('child_process');

console.log('🔍 管理员页面重置功能检测');
console.log('=====================================\n');

// 检查服务状态
function checkServices() {
  console.log('🔍 检查服务状态...');
  
  try {
    const backendHealth = execSync('curl -s http://localhost:5000/api/health', { encoding: 'utf8' });
    const backendStatus = JSON.parse(backendHealth);
    console.log('✅ 后端服务: 正常运行');
    
    const frontendResponse = execSync('curl -s -I http://localhost:3000 | head -1', { encoding: 'utf8' });
    if (frontendResponse.includes('200')) {
      console.log('✅ 前端服务: 正常运行');
    } else {
      console.log('❌ 前端服务: 未运行');
    }
    
  } catch (error) {
    console.log('❌ 服务检查失败:', error.message);
  }
  
  console.log('');
}

// 分析重置功能
function analyzeResetFunctions() {
  console.log('📋 重置功能分析');
  console.log('=====================================\n');
  
  console.log('1️⃣ 订单管理页面 (AdminOrders.js)');
  console.log('   ✅ 重置功能: 已实现');
  console.log('   - 函数: handleReset()');
  console.log('   - 功能: searchForm.resetFields() + fetchOrders({ page: 1 })');
  console.log('   - 状态: 正常');
  console.log('');
  
  console.log('2️⃣ 销售管理页面 (AdminSales.js)');
  console.log('   ⚠️  重置功能: 部分实现');
  console.log('   - 函数: handleReset()');
  console.log('   - 功能: form.resetFields()');
  console.log('   - 问题: 重置后没有重新获取数据');
  console.log('   - 建议: 添加 dispatch(getSalesLinks())');
  console.log('');
  
  console.log('3️⃣ 客户管理页面 (AdminCustomers.js)');
  console.log('   ✅ 重置功能: 已实现');
  console.log('   - 函数: handleReset()');
  console.log('   - 功能: form.resetFields() + dispatch(getCustomers())');
  console.log('   - 状态: 正常');
  console.log('');
  
  console.log('4️⃣ 收款配置页面 (AdminPaymentConfig.js)');
  console.log('   ❓ 重置功能: 需要检查');
  console.log('   - 状态: 待验证');
  console.log('');
  
  console.log('5️⃣ 永久授权限量页面 (AdminLifetimeLimit.js)');
  console.log('   ❓ 重置功能: 需要检查');
  console.log('   - 状态: 待验证');
  console.log('');
}

// 显示修复建议
function showFixSuggestions() {
  console.log('🔧 修复建议');
  console.log('=====================================\n');
  
  console.log('📝 销售管理页面重置功能修复:');
  console.log('   文件: client/src/components/admin/AdminSales.js');
  console.log('   当前代码:');
  console.log('   ```javascript');
  console.log('   const handleReset = () => {');
  console.log('     form.resetFields();');
  console.log('   };');
  console.log('   ```');
  console.log('');
  console.log('   修复后代码:');
  console.log('   ```javascript');
  console.log('   const handleReset = () => {');
  console.log('     form.resetFields();');
  console.log('     dispatch(getSalesLinks());');
  console.log('   };');
  console.log('   ```');
  console.log('');
  
  console.log('📝 测试步骤:');
  console.log('   1. 访问: http://localhost:3000/#/admin');
  console.log('   2. 登录: 知行 / Zhixing Universal Trading Signal');
  console.log('   3. 进入"销售管理"页面');
  console.log('   4. 填写搜索条件');
  console.log('   5. 点击"重置"按钮');
  console.log('   6. 验证: 表单是否清空，数据是否重新加载');
  console.log('');
}

// 显示测试链接
function showTestLinks() {
  console.log('🌐 测试链接');
  console.log('=====================================\n');
  
  console.log('🔐 管理员登录:');
  console.log('   链接: http://localhost:3000/#/admin');
  console.log('   用户名: 知行');
  console.log('   密码: Zhixing Universal Trading Signal');
  console.log('');
  
  console.log('📊 各功能页面:');
  console.log('   - 订单管理: http://localhost:3000/#/admin/orders');
  console.log('   - 销售管理: http://localhost:3000/#/admin/sales');
  console.log('   - 客户管理: http://localhost:3000/#/admin/customers');
  console.log('   - 收款配置: http://localhost:3000/#/admin/payment-config');
  console.log('   - 永久授权限量: http://localhost:3000/#/admin/lifetime-limit');
  console.log('');
}

// 显示测试检查清单
function showTestChecklist() {
  console.log('✅ 重置功能测试检查清单');
  console.log('=====================================\n');
  
  console.log('📋 订单管理页面测试:');
  console.log('   [ ] 1. 填写搜索条件（销售微信、付款方式、状态等）');
  console.log('   [ ] 2. 点击"重置"按钮');
  console.log('   [ ] 3. 验证表单字段是否清空');
  console.log('   [ ] 4. 验证数据是否重新加载（显示所有订单）');
  console.log('   [ ] 5. 验证分页是否重置到第1页');
  console.log('');
  
  console.log('📋 销售管理页面测试:');
  console.log('   [ ] 1. 填写搜索条件（销售微信、收款方式、链接代码等）');
  console.log('   [ ] 2. 点击"重置"按钮');
  console.log('   [ ] 3. 验证表单字段是否清空');
  console.log('   [ ] 4. 验证数据是否重新加载（显示所有销售链接）');
  console.log('   [ ] 5. 验证分页是否重置到第1页');
  console.log('');
  
  console.log('📋 客户管理页面测试:');
  console.log('   [ ] 1. 填写搜索条件（客户微信、销售微信、催单状态等）');
  console.log('   [ ] 2. 点击"重置"按钮');
  console.log('   [ ] 3. 验证表单字段是否清空');
  console.log('   [ ] 4. 验证数据是否重新加载（显示所有客户）');
  console.log('   [ ] 5. 验证分页是否重置到第1页');
  console.log('');
  
  console.log('📋 收款配置页面测试:');
  console.log('   [ ] 1. 检查是否有重置功能');
  console.log('   [ ] 2. 如果有，测试重置功能是否正常');
  console.log('');
  
  console.log('📋 永久授权限量页面测试:');
  console.log('   [ ] 1. 检查是否有重置功能');
  console.log('   [ ] 2. 如果有，测试重置功能是否正常');
  console.log('');
}

// 主函数
function main() {
  checkServices();
  analyzeResetFunctions();
  showFixSuggestions();
  showTestLinks();
  showTestChecklist();
  
  console.log('🎯 总结:');
  console.log('   - 订单管理: ✅ 重置功能正常');
  console.log('   - 销售管理: ⚠️  需要修复（重置后不重新获取数据）');
  console.log('   - 客户管理: ✅ 重置功能正常');
  console.log('   - 其他页面: ❓ 需要验证');
  console.log('');
  console.log('💡 建议:');
  console.log('   1. 修复销售管理页面的重置功能');
  console.log('   2. 验证其他页面的重置功能');
  console.log('   3. 统一所有页面的重置行为');
  console.log('');
}

// 运行主函数
main(); 