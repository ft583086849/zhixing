const { Orders } = require('./server/models');

async function checkDatabase() {
  console.log('🔍 使用Sequelize检查数据库中的订单数据\n');
  
  try {
    // 1. 检查所有订单
    console.log('1️⃣ 检查所有订单...');
    const allOrders = await Orders.findAll();
    console.log(`✅ 找到 ${allOrders.length} 个订单`);
    
    if (allOrders.length > 0) {
      console.log('📋 订单详情:');
      allOrders.forEach((order, index) => {
        console.log(`\n订单 ${index + 1}:`);
        console.log(`- ID: ${order.id}`);
        console.log(`- 状态: ${order.status}`);
        console.log(`- 金额: $${order.amount}`);
        console.log(`- 时长: ${order.duration}`);
        console.log(`- 付款方式: ${order.payment_method}`);
        console.log(`- 提交时间: ${order.submit_time}`);
        console.log(`- 付款时间: ${order.payment_time}`);
      });
    }
    
    // 2. 按状态统计订单
    console.log('\n2️⃣ 按状态统计订单...');
    const statusStats = await Orders.findAll({
      attributes: [
        'status',
        [Orders.sequelize.fn('COUNT', Orders.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    console.log('📊 订单状态统计:');
    statusStats.forEach(stat => {
      console.log(`- ${stat.status}: ${stat.dataValues.count}个`);
    });
    
    // 3. 检查各状态的总收入
    console.log('\n3️⃣ 检查各状态的总收入...');
    const amountStats = await Orders.findAll({
      attributes: [
        'status',
        [Orders.sequelize.fn('SUM', Orders.sequelize.col('amount')), 'total']
      ],
      group: ['status']
    });
    
    console.log('📊 各状态订单总收入:');
    amountStats.forEach(stat => {
      console.log(`- ${stat.status}: $${stat.dataValues.total || 0}`);
    });
    
    // 4. 检查已配置确认订单的总收入
    console.log('\n4️⃣ 检查已配置确认订单的总收入...');
    const confirmedConfigAmount = await Orders.sum('amount', {
      where: { status: 'confirmed_configuration' }
    });
    console.log(`✅ 已配置确认订单总收入: $${confirmedConfigAmount || 0}`);
    
    // 5. 检查所有已确认订单的总收入
    console.log('\n5️⃣ 检查所有已确认订单的总收入...');
    const { Op } = require('sequelize');
    const allConfirmedAmount = await Orders.sum('amount', {
      where: {
        status: {
          [Op.in]: ['confirmed_payment', 'confirmed_configuration']
        }
      }
    });
    console.log(`✅ 所有已确认订单总收入: $${allConfirmedAmount || 0}`);
    
    // 6. 检查统计API应该返回的数据
    console.log('\n6️⃣ 统计API应该返回的数据...');
    const totalOrders = await Orders.count();
    const pendingPaymentOrders = await Orders.count({ where: { status: 'pending_payment_confirmation' } });
    const pendingConfigOrders = await Orders.count({ where: { status: 'pending_configuration_confirmation' } });
    const confirmedPaymentOrders = await Orders.count({ where: { status: 'confirmed_payment' } });
    const confirmedConfigOrders = await Orders.count({ where: { status: 'confirmed_configuration' } });
    const totalAmount = await Orders.sum('amount', { where: { status: 'confirmed_configuration' } });
    
    console.log('📊 统计API数据:');
    console.log(`- 总订单数: ${totalOrders}`);
    console.log(`- 待付款确认订单: ${pendingPaymentOrders}`);
    console.log(`- 待配置确认订单: ${pendingConfigOrders}`);
    console.log(`- 已付款确认订单: ${confirmedPaymentOrders}`);
    console.log(`- 已配置确认订单: ${confirmedConfigOrders}`);
    console.log(`- 总收入: $${totalAmount || 0}`);
    
    console.log('\n🎉 数据库检查完成！');
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error);
  }
}

checkDatabase(); 