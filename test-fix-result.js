#!/usr/bin/env node

/**
 * 验证一级销售对账页面修复效果
 */

console.log('🧪 测试一级销售对账页面...');
console.log('');
console.log('请按以下步骤验证修复效果:');
console.log('');
console.log('1. 打开浏览器，访问: http://localhost:3001/primary-sales-settlement');
console.log('');
console.log('2. 在查询框中输入:');
console.log('   销售代码: PRI17547241780648255');
console.log('');
console.log('3. 点击查询按钮');
console.log('');
console.log('4. 检查结果:');
console.log('   ✅ 应该显示 WML792355703 的销售数据');
console.log('   ✅ 总佣金应该显示: 1882.4');
console.log('   ✅ 订单数应该显示: 40');
console.log('   ✅ 不应该出现403错误');
console.log('');
console.log('5. 如果还有问题，请检查:');
console.log('   • 浏览器开发工具的Network标签');
console.log('   • 确认没有到localhost:3001/api的请求');
console.log('   • 所有请求都应该直接到Supabase');
console.log('');
console.log('预期测试地址: http://localhost:3001/primary-sales-settlement?sales_code=PRI17547241780648255');
