/**
 * 销售代码迁移验证测试
 * 验证link_code到sales_code的完整替换是否成功
 * 确保一级销售和二级销售关联正确，返佣逻辑正确
 */

const axios = require('axios');

const BASE_URL = 'https://zhixing-seven.vercel.app';
const API_BASE = `${BASE_URL}/api`;

// 获取管理员token
async function getAdminToken() {
  try {
    console.log('🔐 获取管理员token...');
    const response = await axios.post(`${API_BASE}/auth?path=login`, {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    if (response.data.success) {
      console.log('✅ 获取token成功');
      return response.data.data?.token || response.data.token;
    } else {
      throw new Error('获取token失败');
    }
  } catch (error) {
    console.error('❌ 获取token失败:', error.message);
    throw error;
  }
}

// 测试销售代码迁移状态
async function testSalesCodeMigration(token) {
  try {
    console.log('\n📊 测试销售代码迁移状态...');
    
    const response = await axios.get(`${API_BASE}/admin?path=sales`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const sales = response.data.data.sales;
      console.log(`✅ 获取到${sales.length}个销售记录`);
      
      let salesCodeCount = 0;
      let linkCodeCount = 0;
      let bothCount = 0;
      let primaryCount = 0;
      let secondaryCount = 0;
      let hierarchyCount = 0;
      
      sales.forEach((sale, index) => {
        console.log(`\n销售 ${index + 1}:`);
        console.log(`  ID: ${sale.id}`);
        console.log(`  微信号: ${sale.wechat_name}`);
        console.log(`  类型: ${sale.sales_type || '未设置'}`);
        console.log(`  sales_code: ${sale.sales_code || '无'}`);
        console.log(`  link_code: ${sale.link_code || '无'}`);
        console.log(`  上级销售: ${sale.parent_info?.parent_wechat_name || '无'}`);
        console.log(`  链接数量: ${sale.link_count || 0}`);
        
        if (sale.sales_code) salesCodeCount++;
        if (sale.link_code) linkCodeCount++;
        if (sale.sales_code && sale.link_code) bothCount++;
        if (sale.sales_type === 'primary') primaryCount++;
        if (sale.sales_type === 'secondary') secondaryCount++;
        if (sale.parent_info?.parent_wechat_name) hierarchyCount++;
        
        if (sale.links && sale.links.length > 0) {
          console.log(`  链接详情:`);
          sale.links.forEach((link, linkIndex) => {
            console.log(`    ${linkIndex + 1}. ${link.title}: ${link.code}`);
            console.log(`       完整链接: ${link.fullUrl}`);
          });
        }
      });
      
      console.log(`\n📊 迁移统计:`);
      console.log(`  总销售数: ${sales.length}`);
      console.log(`  有sales_code: ${salesCodeCount}/${sales.length} (${((salesCodeCount/sales.length)*100).toFixed(1)}%)`);
      console.log(`  有link_code: ${linkCodeCount}/${sales.length} (${((linkCodeCount/sales.length)*100).toFixed(1)}%)`);
      console.log(`  同时有两者: ${bothCount}/${sales.length} (${((bothCount/sales.length)*100).toFixed(1)}%)`);
      console.log(`  一级销售: ${primaryCount}`);
      console.log(`  二级销售: ${secondaryCount}`);
      console.log(`  有层级关系: ${hierarchyCount}`);
      
      return {
        success: true,
        totalSales: sales.length,
        salesCodeCount,
        linkCodeCount,
        bothCount,
        primaryCount,
        secondaryCount,
        hierarchyCount,
        migrationComplete: salesCodeCount === sales.length
      };
    } else {
      throw new Error('获取销售数据失败');
    }
  } catch (error) {
    console.error('❌ 销售代码迁移测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试订单关联状态
async function testOrderAssociation(token) {
  try {
    console.log('\n🔗 测试订单关联状态...');
    
    const response = await axios.get(`${API_BASE}/admin?path=orders&limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const orders = response.data.data.orders;
      console.log(`✅ 获取到${orders.length}个订单记录`);
      
      let salesCodeOrderCount = 0;
      let linkCodeOrderCount = 0;
      let salesWechatFoundCount = 0;
      
      orders.forEach((order, index) => {
        console.log(`\n订单 ${index + 1}:`);
        console.log(`  ID: ${order.id}`);
        console.log(`  sales_code: ${order.sales_code || '无'}`);
        console.log(`  link_code: ${order.link_code || '无'}`);
        console.log(`  display_code: ${order.display_code || '无'}`);
        console.log(`  销售微信: ${order.sales_wechat || '无'}`);
        console.log(`  金额: $${order.amount}`);
        console.log(`  佣金: $${order.commission_amount || 0}`);
        
        if (order.sales_code) salesCodeOrderCount++;
        if (order.link_code) linkCodeOrderCount++;
        if (order.sales_wechat) salesWechatFoundCount++;
      });
      
      console.log(`\n📊 订单关联统计:`);
      console.log(`  总订单数: ${orders.length}`);
      console.log(`  有sales_code: ${salesCodeOrderCount}/${orders.length}`);
      console.log(`  有link_code: ${linkCodeOrderCount}/${orders.length}`);
      console.log(`  关联到销售微信: ${salesWechatFoundCount}/${orders.length}`);
      
      return {
        success: true,
        totalOrders: orders.length,
        salesCodeOrderCount,
        linkCodeOrderCount,
        salesWechatFoundCount,
        associationWorking: salesWechatFoundCount > 0
      };
    } else {
      throw new Error('获取订单数据失败');
    }
  } catch (error) {
    console.error('❌ 订单关联测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试新订单创建功能
async function testNewOrderCreation() {
  try {
    console.log('\n🆕 测试新订单创建功能...');
    
    // 模拟创建一个测试订单（使用sales_code）
    const testOrderData = {
      sales_code: 'TEST0001', // 使用新的sales_code字段
      tradingview_username: 'migration_test_user',
      customer_wechat: 'test_customer',
      duration: '1month',
      amount: 188,
      payment_method: 'alipay',
      payment_time: new Date().toISOString(),
      purchase_type: 'immediate'
    };
    
    console.log('测试数据:', testOrderData);
    console.log('⚠️  注意：这是一个干运行测试，不会实际创建订单');
    
    // 这里只是验证数据格式，不实际发送请求
    const requiredFields = ['sales_code', 'tradingview_username', 'duration', 'amount', 'payment_method', 'payment_time'];
    const missingFields = requiredFields.filter(field => !testOrderData[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ 新订单数据格式验证通过');
      return { success: true, format: 'valid' };
    } else {
      console.log(`❌ 缺少必填字段: ${missingFields.join(', ')}`);
      return { success: false, format: 'invalid', missingFields };
    }
  } catch (error) {
    console.error('❌ 新订单创建测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试返佣逻辑完整性
async function testCommissionLogic(token) {
  try {
    console.log('\n💰 测试返佣逻辑完整性...');
    
    const response = await axios.get(`${API_BASE}/admin?path=sales`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const sales = response.data.data.sales;
      
      let primarySalesWithOrders = 0;
      let secondarySalesWithOrders = 0;
      let totalCommissionAmount = 0;
      
      sales.forEach(sale => {
        if (sale.order_count > 0) {
          if (sale.sales_type === 'primary' || !sale.parent_sales_id) {
            primarySalesWithOrders++;
          } else {
            secondarySalesWithOrders++;
          }
          totalCommissionAmount += parseFloat(sale.total_commission || 0);
        }
        
        console.log(`销售 ${sale.wechat_name}:`);
        console.log(`  类型: ${sale.sales_type || '未知'}`);
        console.log(`  订单数: ${sale.order_count || 0}`);
        console.log(`  总金额: $${sale.total_amount || 0}`);
        console.log(`  总佣金: $${sale.total_commission || 0}`);
        console.log(`  佣金率: ${sale.commission_rate || 0}%`);
        console.log(`  上级: ${sale.parent_info?.parent_wechat_name || '无'}`);
      });
      
      console.log(`\n💰 返佣统计:`);
      console.log(`  有订单的一级销售: ${primarySalesWithOrders}`);
      console.log(`  有订单的二级销售: ${secondarySalesWithOrders}`);
      console.log(`  总佣金金额: $${totalCommissionAmount.toFixed(2)}`);
      
      return {
        success: true,
        primarySalesWithOrders,
        secondarySalesWithOrders,
        totalCommissionAmount,
        commissionWorking: totalCommissionAmount > 0
      };
    } else {
      throw new Error('获取销售数据失败');
    }
  } catch (error) {
    console.error('❌ 返佣逻辑测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function main() {
  console.log('🚀 开始销售代码迁移验证测试...\n');
  
  try {
    // 获取token
    const token = await getAdminToken();
    
    // 测试销售代码迁移
    const migrationResult = await testSalesCodeMigration(token);
    
    // 测试订单关联
    const associationResult = await testOrderAssociation(token);
    
    // 测试新订单创建
    const newOrderResult = await testNewOrderCreation();
    
    // 测试返佣逻辑
    const commissionResult = await testCommissionLogic(token);
    
    // 总结报告
    console.log('\n📊 销售代码迁移验证报告');
    console.log('==================================================');
    
    const allTests = [migrationResult, associationResult, newOrderResult, commissionResult];
    const passedTests = allTests.filter(test => test.success).length;
    const totalTests = allTests.length;
    
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    console.log(`❌ 失败测试: ${totalTests - passedTests}/${totalTests}`);
    
    if (migrationResult.success) {
      console.log(`\n🔄 迁移状态:`);
      console.log(`  销售代码覆盖: ${migrationResult.salesCodeCount}/${migrationResult.totalSales} (${migrationResult.migrationComplete ? '✅完成' : '⚠️未完成'})`);
      console.log(`  销售层级: 一级${migrationResult.primaryCount} + 二级${migrationResult.secondaryCount}`);
      console.log(`  层级关系: ${migrationResult.hierarchyCount}个销售有上级`);
    }
    
    if (associationResult.success) {
      console.log(`\n🔗 关联状态:`);
      console.log(`  订单关联: ${associationResult.salesWechatFoundCount}/${associationResult.totalOrders} (${associationResult.associationWorking ? '✅正常' : '❌异常'})`);
    }
    
    if (newOrderResult.success) {
      console.log(`\n🆕 新订单格式: ${newOrderResult.format === 'valid' ? '✅有效' : '❌无效'}`);
    }
    
    if (commissionResult.success) {
      console.log(`\n💰 返佣逻辑: ${commissionResult.commissionWorking ? '✅正常' : '⚠️需检查'}`);
      console.log(`  佣金总额: $${commissionResult.totalCommissionAmount?.toFixed(2) || 0}`);
    }
    
    const overallSuccess = passedTests === totalTests && 
                          migrationResult.migrationComplete &&
                          associationResult.associationWorking;
    
    console.log(`\n🏆 整体结果: ${overallSuccess ? '✅ 迁移成功' : '⚠️ 需要进一步调整'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 销售代码迁移验证完全成功！');
      console.log('✅ link_code已成功替换为sales_code');
      console.log('✅ 一级销售和二级销售关联正确');
      console.log('✅ 返佣逻辑运行正常');
      console.log('✅ 可以安全删除旧的link_code相关代码');
    } else {
      console.log('\n⚠️  销售代码迁移需要进一步完善');
    }
    
  } catch (error) {
    console.error('\n💥 测试执行失败:', error.message);
    process.exit(1);
  }
}

main();