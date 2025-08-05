#!/usr/bin/env node

/**
 * 使用正确的管理员凭据测试系统
 */

const fetch = require('node-fetch');

async function testCorrectAdminCredentials() {
  console.log('🔍 使用正确管理员凭据测试系统...\n');

  const baseUrl = 'https://zhixing-seven.vercel.app';
  const adminCredentials = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  // 1. 测试管理员登录
  console.log('1. 测试管理员登录...');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'login',
        ...adminCredentials
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`   状态码: ${loginResponse.status}`);
    console.log(`   成功: ${loginData.success}`);
    
    if (loginData.success && loginData.data?.token) {
      console.log('   ✅ 管理员登录成功！');
      console.log(`   管理员信息: ${JSON.stringify(loginData.data.admin, null, 2)}`);
      
      const token = loginData.data.token;
      
      // 2. 测试所有管理员API
      console.log('\n2. 测试管理员API功能...');
      
      const endpoints = [
        { name: 'stats', path: 'stats', description: '数据概览' },
        { name: 'orders', path: 'orders', description: '订单管理' },
        { name: 'sales', path: 'sales', description: '销售管理' },
        { name: 'customers', path: 'customers', description: '客户管理' }
      ];
      
      for (const endpoint of endpoints) {
        console.log(`\n   📊 测试 ${endpoint.description} API:`);
        try {
          const apiResponse = await fetch(`${baseUrl}/api/admin?path=${endpoint.path}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const apiData = await apiResponse.json();
          console.log(`     状态码: ${apiResponse.status}`);
          console.log(`     成功: ${apiData.success}`);
          
          if (apiData.success && apiData.data) {
            // 详细分析每个API的数据
            if (endpoint.name === 'stats') {
              const stats = apiData.data;
              console.log(`     📈 总订单数: ${stats.total_orders || 0}`);
              console.log(`     💰 总金额: $${stats.total_amount || 0}`);
              console.log(`     👥 一级销售: ${stats.primary_sales_count || 0}`);
              console.log(`     👥 二级销售: ${stats.secondary_sales_count || 0}`);
              console.log(`     📅 时间范围: ${stats.timeRange || '今天'}`);
            }
            
            if (endpoint.name === 'orders') {
              const orders = apiData.data.orders || [];
              console.log(`     📋 订单数量: ${orders.length}`);
              if (orders.length > 0) {
                const sample = orders[0];
                console.log(`     🔍 样本订单:`);
                console.log(`       - ID: ${sample.id}`);
                console.log(`       - 销售微信: ${sample.sales_wechat_name || '未设置'}`);
                console.log(`       - TradingView: ${sample.tradingview_username || '未设置'}`);
                console.log(`       - 状态: ${sample.status}`);
                console.log(`       - 金额: $${sample.amount || 0}`);
                console.log(`       - 佣金: $${sample.commission_amount || 0}`);
              }
              
              // 检查销售微信号为空的问题
              const emptyWechatOrders = orders.filter(order => !order.sales_wechat_name || order.sales_wechat_name === '-');
              if (emptyWechatOrders.length > 0) {
                console.log(`     ⚠️  ${emptyWechatOrders.length} 个订单销售微信号为空`);
              }
              
              // 检查订单状态分布
              const statusCount = orders.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
              }, {});
              console.log(`     📊 状态分布: ${JSON.stringify(statusCount)}`);
            }
            
            if (endpoint.name === 'sales') {
              const sales = apiData.data.sales || [];
              console.log(`     👨‍💼 销售数量: ${sales.length}`);
              if (sales.length > 0) {
                const primarySales = sales.filter(s => s.sales?.sales_type === 'primary');
                const secondarySales = sales.filter(s => s.sales?.sales_type === 'secondary');
                console.log(`       - 一级销售: ${primarySales.length}`);
                console.log(`       - 二级销售: ${secondarySales.length}`);
                
                const sample = sales[0];
                if (sample.sales) {
                  console.log(`     🔍 样本销售:`);
                  console.log(`       - 微信号: ${sample.sales.wechat_name || '未设置'}`);
                  console.log(`       - 类型: ${sample.sales.sales_type || '未知'}`);
                  console.log(`       - 佣金率: ${sample.sales.commission_rate || 0}%`);
                  console.log(`       - 订单数: ${sample.total_orders || 0}`);
                }
              }
            }
            
            if (endpoint.name === 'customers') {
              const customers = apiData.data.customers || [];
              console.log(`     👤 客户数量: ${customers.length}`);
              if (customers.length > 0) {
                const sample = customers[0];
                console.log(`     🔍 样本客户:`);
                console.log(`       - TradingView: ${sample.tradingview_username || '未设置'}`);
                console.log(`       - 销售微信: ${sample.sales_wechat || '未设置'}`);
                console.log(`       - 催单状态: ${sample.is_reminded ? '已催单' : '未催单'}`);
              }
            }
            
          } else {
            console.log(`     ❌ API错误: ${apiData.message || '未知错误'}`);
          }
          
        } catch (error) {
          console.log(`     ❌ ${endpoint.description} API调用失败: ${error.message}`);
        }
      }
      
      // 3. 测试收款配置API
      console.log('\n3. 测试收款配置API...');
      try {
        const configResponse = await fetch(`${baseUrl}/api/payment-config?path=get`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const configData = await configResponse.json();
        console.log(`   状态码: ${configResponse.status}`);
        console.log(`   成功: ${configData.success}`);
        
        if (configData.success && configData.data) {
          console.log('   💳 收款配置:');
          console.log(`     支付宝账号: ${configData.data.alipay_account || '未设置'}`);
          console.log(`     收款人姓氏: ${configData.data.alipay_surname || '未设置'}`);
          console.log(`     链名: ${configData.data.crypto_chain_name || '未设置'}`);
          console.log(`     收款地址: ${configData.data.crypto_address || '未设置'}`);
        }
        
      } catch (error) {
        console.log(`   ❌ 收款配置API调用失败: ${error.message}`);
      }
      
    } else {
      console.log('   ❌ 管理员登录失败');
      console.log(`   错误: ${loginData.message || '未知错误'}`);
    }
    
  } catch (error) {
    console.log(`   ❌ 登录API调用失败: ${error.message}`);
  }

  console.log('\n🎯 测试总结:');
  console.log('==========================================');
}

// 运行测试
testCorrectAdminCredentials().catch(console.error);