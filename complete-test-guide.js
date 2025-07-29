#!/usr/bin/env node

/**
 * 支付管理系统完整测试指南
 * 提供从销售页面到管理员后台的完整测试流程
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎯 支付管理系统完整测试指南');
console.log('=====================================\n');

// 检查服务状态
function checkServices() {
  console.log('🔍 检查服务状态...');
  
  try {
    // 检查后端服务
    const backendHealth = execSync('curl -s http://localhost:5000/api/health', { encoding: 'utf8' });
    const backendStatus = JSON.parse(backendHealth);
    console.log('✅ 后端服务: 正常运行');
    console.log(`   状态: ${backendStatus.message}`);
    
    // 检查前端服务
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

// 显示测试链接
function showTestLinks() {
  console.log('🌐 测试链接');
  console.log('=====================================');
  console.log('');
  
  console.log('📱 1. 销售页面 (创建收款链接)');
  console.log('   链接: http://localhost:3000/#/sales');
  console.log('   功能: 创建销售收款信息，生成唯一链接');
  console.log('   测试步骤:');
  console.log('   - 输入微信名称');
  console.log('   - 选择收款方式 (支付宝/链上地址)');
  console.log('   - 点击"生成收款链接"');
  console.log('   - 复制生成的链接代码');
  console.log('');
  
  console.log('🛒 2. 用户购买页面 (测试购买流程)');
  console.log('   链接: http://localhost:3000/#/purchase/[链接代码]');
  console.log('   功能: 用户选择时长、填写信息、上传截图');
  console.log('   测试步骤:');
  console.log('   - 将[链接代码]替换为实际生成的链接');
  console.log('   - 选择购买时长 (1个月/3个月/6个月/永久)');
  console.log('   - 选择购买方式 (即时购买/提前购买)');
  console.log('   - 填写客户信息');
  console.log('   - 选择付款方式');
  console.log('   - 上传付款截图');
  console.log('   - 提交订单');
  console.log('');
  
  console.log('🔐 3. 管理员登录');
  console.log('   链接: http://localhost:3000/#/admin');
  console.log('   登录信息:');
  console.log('   - 用户名: 知行');
  console.log('   - 密码: Zhixing Universal Trading Signal');
  console.log('');
  
  console.log('📊 4. 管理员后台功能');
  console.log('   链接: http://localhost:3000/#/admin/dashboard');
  console.log('   功能模块:');
  console.log('   - 数据概览: 查看订单统计和金额');
  console.log('   - 订单管理: 查看、搜索、筛选、导出订单');
  console.log('   - 销售管理: 管理销售链接和客户');
  console.log('   - 收款配置: 配置支付宝和链上收款码');
  console.log('   - 永久授权限量: 管理永久授权数量限制');
  console.log('');
}

// 显示测试数据
function showTestData() {
  console.log('📋 测试数据');
  console.log('=====================================');
  console.log('');
  
  console.log('💰 价格配置:');
  console.log('   - 1个月: $188');
  console.log('   - 3个月: $488');
  console.log('   - 6个月: $888');
  console.log('   - 永久: $1588 (限量100个)');
  console.log('');
  
  console.log('📱 收款方式:');
  console.log('   - 支付宝: 752304285@qq.com (梁)');
  console.log('   - 链上地址: TDnNfU9GYcDbzFqf8LUNzBuTsaDbCh5LTo (TRC10/TRC20)');
  console.log('');
  
  console.log('🔧 系统配置:');
  console.log('   - 数据库: SQLite');
  console.log('   - 后端端口: 5000');
  console.log('   - 前端端口: 3000');
  console.log('   - 文件上传: 支持图片格式');
  console.log('');
}

// 显示完整测试流程
function showCompleteTestFlow() {
  console.log('🔄 完整测试流程');
  console.log('=====================================');
  console.log('');
  
  console.log('第1步: 销售页面测试');
  console.log('   1. 访问: http://localhost:3000/#/sales');
  console.log('   2. 输入微信名称: "测试销售"');
  console.log('   3. 选择收款方式: "支付宝"');
  console.log('   4. 点击"生成收款链接"');
  console.log('   5. 复制生成的链接代码 (例如: c97f8695988d4495)');
  console.log('');
  
  console.log('第2步: 用户购买页面测试');
  console.log('   1. 访问: http://localhost:3000/#/purchase/[链接代码]');
  console.log('   2. 选择时长: "1个月"');
  console.log('   3. 选择购买方式: "即时购买"');
  console.log('   4. 填写客户信息:');
  console.log('      - 客户微信: "测试客户"');
  console.log('      - TradingView用户: "testuser"');
  console.log('   5. 选择付款方式: "支付宝"');
  console.log('   6. 上传任意图片作为付款截图');
  console.log('   7. 点击"提交订单"');
  console.log('');
  
  console.log('第3步: 管理员后台测试');
  console.log('   1. 访问: http://localhost:3000/#/admin');
  console.log('   2. 登录: 知行 / Zhixing Universal Trading Signal');
  console.log('   3. 查看数据概览页面');
  console.log('   4. 进入订单管理，查看刚创建的订单');
  console.log('   5. 测试搜索和筛选功能');
  console.log('   6. 进入收款配置，上传收款码图片');
  console.log('   7. 查看永久授权限量管理');
  console.log('');
  
  console.log('第4步: 功能验证');
  console.log('   1. 验证订单状态更新');
  console.log('   2. 验证收款码图片显示');
  console.log('   3. 验证永久授权限量控制');
  console.log('   4. 验证购买方式选择');
  console.log('   5. 验证文件上传和显示');
  console.log('');
}

// 显示故障排除
function showTroubleshooting() {
  console.log('🔧 故障排除');
  console.log('=====================================');
  console.log('');
  
  console.log('❌ 如果页面显示错误:');
  console.log('   1. 清除浏览器缓存 (F12 → Application → Clear Storage)');
  console.log('   2. 重新访问页面');
  console.log('   3. 检查控制台错误信息');
  console.log('');
  
  console.log('❌ 如果登录失败:');
  console.log('   1. 确认用户名密码正确');
  console.log('   2. 清除浏览器缓存');
  console.log('   3. 重新登录');
  console.log('');
  
  console.log('❌ 如果API请求失败:');
  console.log('   1. 检查后端服务是否运行: curl http://localhost:5000/api/health');
  console.log('   2. 检查前端服务是否运行: curl http://localhost:3000');
  console.log('   3. 重启服务: npm start (在server目录)');
  console.log('');
  
  console.log('❌ 如果数据库问题:');
  console.log('   1. 检查SQLite数据库文件: server/database.sqlite');
  console.log('   2. 重启后端服务');
  console.log('   3. 检查数据库连接配置');
  console.log('');
}

// 主函数
function main() {
  checkServices();
  showTestLinks();
  showTestData();
  showCompleteTestFlow();
  showTroubleshooting();
  
  console.log('🎉 测试指南完成！');
  console.log('');
  console.log('💡 提示:');
  console.log('   - 所有功能都已开发完成并可以正常使用');
  console.log('   - 如果遇到问题，请参考故障排除部分');
  console.log('   - 建议按顺序进行测试，确保功能完整性');
  console.log('');
  console.log('📞 如需帮助，请检查开发文档或联系开发团队');
}

// 运行主函数
main(); 