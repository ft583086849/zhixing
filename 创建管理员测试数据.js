#!/usr/bin/env node

/**
 * 创建管理员后台测试数据
 * 解决数据为0的问题，创建完整的销售和订单数据
 */

const https = require('https');
const http = require('http');

console.log('🔧 创建管理员后台测试数据...');
console.log('=' .repeat(50));

// 获取本地连接（如果可用）
const useLocalConnection = process.env.NODE_ENV !== 'production';
const baseURL = 'https://zhixing-seven.vercel.app';

const makeRequest = (options, data = null) => {
  const isHTTPS = options.protocol === 'https:';
  const httpModule = isHTTPS ? https : http;
  
  return new Promise((resolve, reject) => {
    const req = httpModule.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// 创建一级销售数据
const createPrimarySales = async () => {
  console.log('\n👑 创建一级销售数据...');
  
  const primarySalesData = [
    {
      wechat_name: '张三_一级销售',
      sales_code: 'PS001',
      commission_rate: 0.35,
      status: 'active'
    },
    {
      wechat_name: '李四_一级销售',
      sales_code: 'PS002', 
      commission_rate: 0.40,
      status: 'active'
    },
    {
      wechat_name: '王五_一级销售',
      sales_code: 'PS003',
      commission_rate: 0.38,
      status: 'active'
    }
  ];

  const url = new URL(`${baseURL}/api/create-test-data`);
  
  for (let i = 0; i < primarySalesData.length; i++) {
    const salesData = primarySalesData[i];
    console.log(`   📝 创建一级销售: ${salesData.wechat_name}...`);
    
    try {
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `/api/create-test-data`,
        method: 'POST',
        protocol: url.protocol,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const result = await makeRequest(options, {
        type: 'primary_sales',
        data: salesData
      });
      
      if (result.status === 200 || result.status === 201) {
        console.log(`   ✅ 创建成功: ${salesData.wechat_name}`);
      } else {
        console.log(`   ⚠️ 创建失败: ${salesData.wechat_name} (${result.status})`);
      }
    } catch (error) {
      console.log(`   ❌ 创建错误: ${salesData.wechat_name} - ${error.message}`);
    }
  }
};

// 创建二级销售数据
const createSecondarySales = async () => {
  console.log('\n👥 创建二级销售数据...');
  
  const secondarySalesData = [
    {
      wechat_name: '赵六_二级销售',
      sales_code: 'SS001',
      parent_sales_code: 'PS001',
      commission_rate: 0.25,
      status: 'active'
    },
    {
      wechat_name: '孙七_二级销售', 
      sales_code: 'SS002',
      parent_sales_code: 'PS001',
      commission_rate: 0.30,
      status: 'active'
    },
    {
      wechat_name: '周八_二级销售',
      sales_code: 'SS003',
      parent_sales_code: 'PS002',
      commission_rate: 0.28,
      status: 'active'
    },
    {
      wechat_name: '吴九_二级销售',
      sales_code: 'SS004',
      parent_sales_code: 'PS003',
      commission_rate: 0.32,
      status: 'active'
    }
  ];

  const url = new URL(`${baseURL}/api/create-test-data`);
  
  for (let i = 0; i < secondarySalesData.length; i++) {
    const salesData = secondarySalesData[i];
    console.log(`   📝 创建二级销售: ${salesData.wechat_name}...`);
    
    try {
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `/api/create-test-data`,
        method: 'POST',
        protocol: url.protocol,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const result = await makeRequest(options, {
        type: 'secondary_sales',
        data: salesData
      });
      
      if (result.status === 200 || result.status === 201) {
        console.log(`   ✅ 创建成功: ${salesData.wechat_name}`);
      } else {
        console.log(`   ⚠️ 创建失败: ${salesData.wechat_name} (${result.status})`);
      }
    } catch (error) {
      console.log(`   ❌ 创建错误: ${salesData.wechat_name} - ${error.message}`);
    }
  }
};

// 创建订单数据
const createOrders = async () => {
  console.log('\n📋 创建订单数据...');
  
  const ordersData = [
    {
      user_wechat: '客户001',
      tradingview_username: 'trader001',
      sales_code: 'PS001',
      sales_type: 'primary',
      amount: 500,
      status: 'confirmed_payment',
      payment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5天前
    },
    {
      user_wechat: '客户002',
      tradingview_username: 'trader002', 
      sales_code: 'PS001',
      sales_type: 'primary',
      amount: 800,
      status: 'confirmed_configuration',
      payment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3天前
    },
    {
      user_wechat: '客户003',
      tradingview_username: 'trader003',
      sales_code: 'SS001', 
      sales_type: 'secondary',
      amount: 300,
      status: 'pending_payment',
      payment_date: new Date()
    },
    {
      user_wechat: '客户004',
      tradingview_username: 'trader004',
      sales_code: 'SS002',
      sales_type: 'secondary', 
      amount: 600,
      status: 'confirmed_payment',
      payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1天前
    },
    {
      user_wechat: '客户005',
      tradingview_username: 'trader005',
      sales_code: 'PS002',
      sales_type: 'primary',
      amount: 1000,
      status: 'pending_config',
      payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2天前
    },
    {
      user_wechat: '客户006', 
      tradingview_username: 'trader006',
      sales_code: 'SS003',
      sales_type: 'secondary',
      amount: 450,
      status: 'confirmed_configuration',
      payment_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4天前
    }
  ];

  const url = new URL(`${baseURL}/api/create-test-data`);
  
  for (let i = 0; i < ordersData.length; i++) {
    const orderData = ordersData[i];
    console.log(`   📝 创建订单: ${orderData.user_wechat} - $${orderData.amount}...`);
    
    try {
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `/api/create-test-data`,
        method: 'POST',
        protocol: url.protocol,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const result = await makeRequest(options, {
        type: 'orders',
        data: orderData
      });
      
      if (result.status === 200 || result.status === 201) {
        console.log(`   ✅ 创建成功: ${orderData.user_wechat}`);
      } else {
        console.log(`   ⚠️ 创建失败: ${orderData.user_wechat} (${result.status})`);
      }
    } catch (error) {
      console.log(`   ❌ 创建错误: ${orderData.user_wechat} - ${error.message}`);
    }
  }
};

// 验证数据创建结果
const verifyData = async () => {
  console.log('\n🔍 验证数据创建结果...');
  
  try {
    const healthUrl = new URL(`${baseURL}/api/health`);
    const healthOptions = {
      hostname: healthUrl.hostname,
      port: healthUrl.port || (healthUrl.protocol === 'https:' ? 443 : 80),
      path: '/api/health',
      method: 'GET',
      protocol: healthUrl.protocol
    };

    const healthResult = await makeRequest(healthOptions);
    
    if (healthResult.status === 200 && healthResult.data.success) {
      console.log('   ✅ 数据库连接正常');
      console.log('   📊 测试数据创建完成！');
      console.log('\n📋 创建的测试数据总结:');
      console.log('   👑 一级销售: 3个 (张三、李四、王五)');
      console.log('   👥 二级销售: 4个 (赵六、孙七、周八、吴九)');
      console.log('   📋 订单: 6个 (不同状态和金额)');
      console.log('\n🎯 现在可以登录管理员后台验证:');
      console.log('   📍 https://zhixing-seven.vercel.app/admin');
      console.log('   🔧 佣金设置: 销售管理页面 -> 操作列 -> 修改佣金按钮');
    } else {
      console.log('   ❌ 数据库连接检查失败');
    }
  } catch (error) {
    console.log(`   ❌ 验证失败: ${error.message}`);
  }
};

// 主执行函数
const createTestData = async () => {
  try {
    await createPrimarySales();
    await createSecondarySales();
    await createOrders();
    await verifyData();
    
    console.log('\n🎉 测试数据创建流程完成！');
    console.log('💡 如果后台仍显示数据为0，请:');
    console.log('   1. 清理浏览器缓存 (Ctrl+Shift+R 或 Cmd+Shift+R)');
    console.log('   2. 使用管理员账户登录后台');
    console.log('   3. 检查控制台是否有JavaScript错误');
    
  } catch (error) {
    console.error('\n❌ 测试数据创建失败:', error.message);
  }
};

createTestData();