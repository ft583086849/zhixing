#!/usr/bin/env node

/**
 * 基础功能测试指南
 */

console.log('🧪 销售统计排除功能 - 基础测试指南\n');

console.log('步骤1: 启动开发服务器');
console.log('运行命令: npm start');
console.log('等待服务器启动完成\n');

console.log('步骤2: 测试收款配置页面');
console.log('1. 访问: http://localhost:3000/admin/payment-config');
console.log('2. 检查页面是否正常加载');
console.log('3. 检查是否显示"统计排除名单"部分');
console.log('4. 检查是否有"添加排除"按钮\n');

console.log('步骤3: 测试数据库连接');
console.log('在浏览器控制台执行:');
console.log(`
// 测试ExcludedSalesService
import('/src/services/excludedSalesService.js').then(module => {
  const ExcludedSalesService = module.default;
  
  // 测试获取排除名单
  ExcludedSalesService.getExcludedSales().then(list => {
    console.log('✅ 排除名单:', list);
  }).catch(err => {
    console.error('❌ 获取失败:', err);
  });
  
  // 测试获取统计
  ExcludedSalesService.getExclusionStats().then(stats => {
    console.log('✅ 排除统计:', stats);
  }).catch(err => {
    console.error('❌ 统计失败:', err);
  });
});
`);

console.log('\n步骤4: 测试添加排除功能');
console.log('1. 点击"添加排除"按钮');
console.log('2. 填写表单:');
console.log('   - 销售微信号: "测试销售001"');
console.log('   - 销售代码: "TEST001"'); 
console.log('   - 销售类型: "一级销售"');
console.log('   - 排除原因: "测试账号"');
console.log('3. 点击确定');
console.log('4. 检查是否成功添加\n');

console.log('步骤5: 测试统计过滤');
console.log('1. 访问管理后台: http://localhost:3000/admin/dashboard');
console.log('2. 检查控制台日志是否有排除相关信息');
console.log('3. 查看是否显示"已排除X个销售的数据"信息\n');

console.log('预期结果:');
console.log('✅ 页面正常加载，无JavaScript错误');
console.log('✅ 可以成功连接数据库');
console.log('✅ 排除名单界面显示正确');
console.log('✅ 可以添加/查看排除记录');
console.log('✅ 统计API应用了排除过滤\n');

console.log('如果遇到错误:');
console.log('1. 检查数据库表是否创建成功');
console.log('2. 检查浏览器控制台的错误信息');
console.log('3. 检查网络请求是否正常');
console.log('4. 检查Supabase连接配置\n');

console.log('🚀 开始测试吧！');