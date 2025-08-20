// 检查数据库数据的脚本
console.log('🔍 开始检查一级销售对账页面的数据库数据...');
console.log('目标销售代码: PRI17547241780648255');
console.log('期望销售员微信: WML792355703');

// 直接告知用户手动测试页面
console.log('\n📋 测试步骤:');
console.log('1. 打开浏览器访问: http://localhost:3000/primary-sales-settlement');
console.log('2. 在销售代码输入框输入: PRI17547241780648255');
console.log('3. 点击查询按钮');
console.log('4. 检查以下内容:');
console.log('   ✅ 销售员微信是否显示: WML792355703');
console.log('   ✅ 总佣金是否不再显示 $0.00');
console.log('   ✅ 总订单数是否不再显示 0 单');
console.log('   ✅ 当日佣金是否正常计算');
console.log('   ✅ 浏览器控制台是否没有 403 错误');

console.log('\n🔧 如果页面仍有问题:');
console.log('1. 按 F12 打开开发者工具');
console.log('2. 查看 Console 选项卡的错误信息');
console.log('3. 查看 Network 选项卡的API请求状态');
console.log('4. 检查是否有 403 Forbidden 错误');

console.log('\n🌐 或者试试线上版本:');
console.log('访问: https://zhixing-seven.vercel.app/primary-sales-settlement');

console.log('\n📊 预期结果:');
console.log('- 如果修复成功，应该看到非零的佣金数据');
console.log('- 如果仍有问题，会看到全零数据或403错误');

process.exit(0);