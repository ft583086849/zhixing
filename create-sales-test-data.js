const axios = require('axios');

async function createSalesTestData() {
  console.log('🔧 开始创建销售测试数据...');
  
  try {
    // 1. 获取认证token
    console.log('\n🔐 获取认证token...');
    const authResponse = await axios.post('https://zhixing-seven.vercel.app/api/auth?path=login', {
      username: '知行',
      password: 'Zhixing Universal Trading Signal'
    });
    
    if (!authResponse.data.success) {
      throw new Error('认证失败');
    }
    
    const token = authResponse.data.data?.token || authResponse.data.token;
    console.log('✅ 获取token成功');
    
    // 2. 创建测试销售数据
    console.log('\n👥 创建测试销售数据...');
    const salesData = [
      { 
        wechat_name: '销售张三', 
        payment_method: 'alipay', 
        payment_address: 'zhangsan@alipay.com',
        alipay_surname: '张',
        link_code: 'SALES001',
        sales_type: 'primary', 
        commission_rate: 30 
      },
      { 
        wechat_name: '销售李四', 
        payment_method: 'crypto', 
        payment_address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        chain_name: 'BTC',
        link_code: 'SALES002',
        sales_type: 'secondary', 
        commission_rate: 25 
      },
      { 
        wechat_name: '销售王五', 
        payment_method: 'alipay', 
        payment_address: 'wangwu@alipay.com',
        alipay_surname: '王',
        link_code: 'SALES003',
        sales_type: 'primary', 
        commission_rate: 35 
      },
      { 
        wechat_name: '销售赵六', 
        payment_method: 'crypto', 
        payment_address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        chain_name: 'ETH',
        link_code: 'SALES004',
        sales_type: 'secondary', 
        commission_rate: 20 
      },
      { 
        wechat_name: '销售钱七', 
        payment_method: 'alipay', 
        payment_address: 'qianqi@alipay.com',
        alipay_surname: '钱',
        link_code: 'SALES005',
        sales_type: 'primary', 
        commission_rate: 40 
      }
    ];
    
    for (const sale of salesData) {
      try {
        const response = await axios.post('https://zhixing-seven.vercel.app/api/sales?path=create', sale, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`✅ 创建销售: ${sale.wechat_name} - ${sale.sales_type} - ${sale.commission_rate}%`);
      } catch (error) {
        console.log(`⚠️ 销售 ${sale.wechat_name} 可能已存在`);
      }
    }
    
    console.log('\n🎉 销售测试数据创建完成！');
    console.log('\n📊 销售数据概览:');
    console.log('  - 一级销售: 3个 (张三、王五、钱七)');
    console.log('  - 二级销售: 2个 (李四、赵六)');
    console.log('  - 佣金比率: 20%-40%');
    console.log('  - 支付方式: 支付宝3个，加密货币2个');
    
  } catch (error) {
    console.error('❌ 创建销售测试数据失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📊 错误响应:', error.response.data);
    }
  }
}

// 运行测试
createSalesTestData()
  .then(() => {
    console.log('\n✅ 销售测试数据创建完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 销售测试数据创建失败');
    process.exit(1);
  });