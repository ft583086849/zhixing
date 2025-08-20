// 测试新的时区范围
const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 16, 0, 0);
const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 59, 59);

console.log('新的时间范围:');
console.log('开始时间(UTC):', todayStart.toISOString());
console.log('结束时间(UTC):', todayEnd.toISOString());
console.log('开始时间(北京):', new Date(todayStart.getTime() + 8*3600000).toLocaleString('zh-CN'));
console.log('结束时间(北京):', new Date(todayEnd.getTime() + 8*3600000).toLocaleString('zh-CN'));

// 检查$188订单是否在范围内
const orderTime = new Date('2025-08-19T17:38:35+00:00');
console.log('\n$188订单时间:');
console.log('UTC时间:', orderTime.toISOString());
console.log('北京时间:', new Date(orderTime.getTime() + 8*3600000).toLocaleString('zh-CN'));

const inRange = orderTime >= todayStart && orderTime <= todayEnd;
console.log('是否在范围内:', inRange ? '✅ 是' : '❌ 否');
