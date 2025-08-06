const https = require('https');

// 管理员登录获取token
async function getAdminToken() {
  const loginData = {
    username: '知行',
    password: 'Zhixing Universal Trading Signal'
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(loginData);
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/auth?path=login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.data.token) {
            resolve(response.data.token);
          } else {
            reject(new Error(`登录失败: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`登录响应解析失败: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 直接修改admin API来添加字段
async function addPaymentAddressField() {
  console.log('🔧 开始添加标准收款地址字段...\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 管理员登录...');
    const token = await getAdminToken();
    console.log('✅ 登录成功\n');

    // 2. 修改admin API添加字段的逻辑
    console.log('2. 准备修改admin API...');
    console.log('需要在admin.js的handleUpdateSchema函数中添加：');
    console.log('');
    console.log('ALTER TABLE secondary_sales ADD COLUMN payment_address VARCHAR(255) NOT NULL COMMENT "收款地址";');
    console.log('ALTER TABLE secondary_sales ADD COLUMN alipay_surname VARCHAR(50) COMMENT "支付宝收款人姓氏";'); 
    console.log('ALTER TABLE secondary_sales ADD COLUMN chain_name VARCHAR(50) COMMENT "链名称";');
    console.log('ALTER TABLE secondary_sales ADD COLUMN sales_code VARCHAR(32) COMMENT "销售代码";');
    console.log('');
    console.log('⚠️  注意：这些字段是核心业务字段，必须正确添加！');
    
    console.log('\n📋 建议的完整修复方案：');
    console.log('1. 修改api/admin.js中的secondary_sales表创建语句');
    console.log('2. 添加标准的业务字段');
    console.log('3. 确保字段类型和约束正确');
    console.log('4. 重新执行数据库更新');
    console.log('5. 验证API功能');
    
  } catch (error) {
    console.error('❌ 处理失败:', error.message);
  }
}

// 执行
addPaymentAddressField();