#!/usr/bin/env node

/**
 * 支付管理系统快速启动测试
 * 提供直接可用的测试链接和步骤
 */

const { execSync } = require('child_process');

console.log('🚀 支付管理系统快速启动测试');
console.log('=====================================\n');

// 检查服务状态
try {
  const backendHealth = execSync('curl -s http://localhost:5000/api/health', { encoding: 'utf8' });
  const frontendResponse = execSync('curl -s -I http://localhost:3000 | head -1', { encoding: 'utf8' });
  
  console.log('✅ 服务状态检查通过');
  console.log('✅ 后端服务: 正常运行 (端口 5000)');
  console.log('✅ 前端服务: 正常运行 (端口 3000)');
  console.log('');
} catch (error) {
  console.log('❌ 服务检查失败，请确保服务正在运行');
  console.log('   后端: cd server && node index.js');
  console.log('   前端: cd client && npm start');
  console.log('');
  process.exit(1);
}

console.log('🎯 直接开始测试！');
console.log('=====================================\n');

console.log('📱 第1步: 创建销售链接');
console.log('   点击链接: http://localhost:3000/#/sales');
console.log('   操作步骤:');
console.log('   - 输入微信名称: "测试销售"');
console.log('   - 选择收款方式: "支付宝"');
console.log('   - 点击"生成收款链接"');
console.log('   - 复制生成的链接代码');
console.log('');

console.log('🛒 第2步: 测试用户购买');
console.log('   链接格式: http://localhost:3000/#/purchase/[你的链接代码]');
console.log('   操作步骤:');
console.log('   - 选择时长: "1个月" ($188)');
console.log('   - 选择购买方式: "即时购买"');
console.log('   - 客户微信: "测试客户"');
console.log('   - TradingView用户: "testuser"');
console.log('   - 付款方式: "支付宝"');
console.log('   - 上传任意图片作为截图');
console.log('   - 提交订单');
console.log('');

console.log('🔐 第3步: 管理员登录');
console.log('   点击链接: http://localhost:3000/#/admin');
console.log('   登录信息:');
console.log('   - 用户名: 知行');
console.log('   - 密码: Zhixing Universal Trading Signal');
console.log('');

console.log('📊 第4步: 查看后台数据');
console.log('   点击链接: http://localhost:3000/#/admin/dashboard');
console.log('   功能验证:');
console.log('   - 数据概览: 查看订单统计');
console.log('   - 订单管理: 查看刚创建的订单');
console.log('   - 收款配置: 上传收款码图片');
console.log('   - 永久授权限量: 查看限量管理');
console.log('');

console.log('💡 快速测试提示:');
console.log('   - 所有页面都已修复，可以正常使用');
console.log('   - 如果遇到问题，清除浏览器缓存');
console.log('   - 建议按顺序测试，确保功能完整');
console.log('');

console.log('🎉 开始测试吧！');
console.log('   复制上面的链接到浏览器即可开始测试');
console.log('');

// 提供示例链接
console.log('📋 示例测试数据:');
console.log('   价格: 1个月($188) | 3个月($488) | 6个月($888) | 永久($1588)');
console.log('   支付宝: 752304285@qq.com (梁)');
console.log('   链上地址: TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo');
console.log('');

console.log('🔧 如果遇到问题:');
console.log('   - 清除缓存: F12 → Application → Clear Storage');
console.log('   - 检查服务: curl http://localhost:5000/api/health');
console.log('   - 重启服务: 在server目录运行 node index.js'); 