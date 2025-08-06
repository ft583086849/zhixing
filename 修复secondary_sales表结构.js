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

// 执行SQL命令
async function executeSQL(sql, token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      action: 'execute_raw_sql',
      sql: sql
    });
    
    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/database-schema',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`响应解析失败: ${error.message}, 响应: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 修复secondary_sales表结构
async function fixSecondarySalesTable() {
  console.log('🔧 开始修复secondary_sales表结构...\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 管理员登录...');
    const token = await getAdminToken();
    console.log('✅ 登录成功\n');

    // 2. 查看当前表结构
    console.log('2. 检查当前表结构...');
    const showResult = await executeSQL('SHOW COLUMNS FROM secondary_sales', token);
    console.log('📋 当前表结构查询结果:');
    console.log(JSON.stringify(showResult, null, 2));
    console.log('');

    // 3. 添加缺失的字段
    console.log('3. 添加缺失的字段...');
    
    const addFieldsSQL = [
      "ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS payment_address VARCHAR(255) COMMENT '收款地址'",
      "ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS alipay_surname VARCHAR(50) COMMENT '支付宝收款人姓氏'", 
      "ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS chain_name VARCHAR(50) COMMENT '链名称'",
      "ALTER TABLE secondary_sales ADD COLUMN IF NOT EXISTS sales_code VARCHAR(32) COMMENT '销售代码'",
      "ALTER TABLE secondary_sales MODIFY COLUMN primary_sales_id INT NULL COMMENT '一级销售ID，独立注册时为NULL'",
      "ALTER TABLE secondary_sales MODIFY COLUMN payment_method ENUM('alipay', 'crypto', 'wechat', 'bank') DEFAULT 'alipay' COMMENT '收款方式'"
    ];

    for (let i = 0; i < addFieldsSQL.length; i++) {
      const sql = addFieldsSQL[i];
      console.log(`执行: ${sql.substring(0, 80)}...`);
      
      try {
        const result = await executeSQL(sql, token);
        if (result.success) {
          console.log(`✅ 第${i+1}条SQL执行成功`);
        } else {
          console.log(`⚠️  第${i+1}条SQL执行失败: ${result.message}`);
        }
      } catch (error) {
        console.log(`❌ 第${i+1}条SQL执行错误: ${error.message}`);
      }
    }
    console.log('');

    // 4. 再次检查表结构
    console.log('4. 验证表结构更新...');
    const showResult2 = await executeSQL('SHOW COLUMNS FROM secondary_sales', token);
    console.log('📋 更新后的表结构:');
    console.log(JSON.stringify(showResult2, null, 2));
    console.log('');

    // 5. 测试独立销售注册
    console.log('5. 测试独立销售注册...');
    const timestamp = Date.now();
    const testData = {
      wechat_name: `test_fix_table_${timestamp}`,
      payment_method: 'alipay',
      payment_address: `testfix${timestamp}@qq.com`,
      alipay_surname: '测试修复',
      independent: true
    };
    
    const postData = JSON.stringify(testData);
    
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'zhixing-seven.vercel.app',
        port: 443,
        path: '/api/secondary-sales?path=register-independent',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              status: res.statusCode,
              success: response.success,
              message: response.message,
              data: response.data
            });
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('📋 独立销售注册测试结果:');
    console.log(`状态码: ${result.status}`);
    console.log(`成功: ${result.success}`);
    console.log(`消息: ${result.message}`);
    if (result.data) {
      console.log(`销售代码: ${result.data.sales_code}`);
    }

    if (result.success) {
      console.log('\n🎉 secondary_sales表结构修复成功！独立销售注册功能已恢复！');
    } else {
      console.log('\n❌ 表结构修复完成，但独立销售注册仍有问题，需要进一步调试');
    }
    
  } catch (error) {
    console.error('❌ 修复过程失败:', error.message);
  }
}

// 执行修复
fixSecondarySalesTable();