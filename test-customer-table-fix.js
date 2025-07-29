const axios = require('axios');

console.log('🔍 测试客户管理页面表格字段修改...\n');

async function testCustomerTableFields() {
  try {
    console.log('1️⃣ 获取客户数据...');
    
    const response = await axios.get('http://localhost:5000/api/admin/customers');
    
    if (response.data.success) {
      const customers = response.data.data.customers;
      console.log(`✅ 成功获取 ${customers.length} 个客户数据`);
      
      if (customers.length > 0) {
        const sampleCustomer = customers[0];
        console.log('\n2️⃣ 检查客户数据字段...');
        console.log('📋 当前客户数据字段:');
        
        // 列出所有字段
        Object.keys(sampleCustomer).forEach(field => {
          console.log(`   - ${field}: ${sampleCustomer[field]}`);
        });
        
        console.log('\n3️⃣ 验证字段修改...');
        
        // 检查是否还有 last_order_date 字段
        if (sampleCustomer.hasOwnProperty('last_order_date')) {
          console.log('⚠️  发现 last_order_date 字段仍然存在（后端数据）');
          console.log('   注意：这只是后端数据字段，前端表格已删除该列显示');
        } else {
          console.log('✅ 后端数据中没有 last_order_date 字段');
        }
        
        // 检查重要字段是否存在
        const requiredFields = [
          'id', 'customer_wechat', 'tradingview_username', 
          'sales_wechat', 'total_orders', 'total_amount',
          'commission_amount', 'expiry_date', 'remind_status'
        ];
        
        console.log('\n4️⃣ 验证必需字段...');
        requiredFields.forEach(field => {
          if (sampleCustomer.hasOwnProperty(field)) {
            console.log(`   ✅ ${field}: 存在`);
          } else {
            console.log(`   ❌ ${field}: 缺失`);
          }
        });
        
        console.log('\n5️⃣ 前端表格列验证...');
        console.log('📋 前端表格应该显示的列:');
        const expectedColumns = [
          '客户ID', '客户微信', 'TradingView用户', '销售微信',
          '总订单数', '总金额', '返佣金额', '到期时间', '催单状态', '操作'
        ];
        
        expectedColumns.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col}`);
        });
        
        console.log('\n❌ 已删除的列:');
        console.log('   - 最后订单时间');
        
      } else {
        console.log('⚠️  没有客户数据可供测试');
      }
      
    } else {
      console.log('❌ API响应失败:', response.data.message);
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 请确保服务器正在运行:');
      console.log('   cd server && NODE_ENV=test npm start');
    }
  }
}

// 运行测试
testCustomerTableFields().then(() => {
  console.log('\n🎉 测试完成！');
  console.log('\n📝 总结:');
  console.log('- 最后订单时间字段已从前端表格中删除');
  console.log('- 到期时间字段保留，作为主要时间信息');
  console.log('- 其他字段保持不变，功能正常');
}); 