// 通过API执行数据库Schema修复
const https = require('https');

console.log('🔧 执行数据库Schema修复：添加sales_code字段...\n');

// 需要执行的SQL语句数组
const sqlStatements = [
  "ALTER TABLE primary_sales ADD COLUMN sales_code VARCHAR(16) UNIQUE COMMENT '一级销售的用户购买代码'",
  "ALTER TABLE primary_sales ADD COLUMN secondary_registration_code VARCHAR(16) UNIQUE COMMENT '二级销售注册代码'"
];

// 通过健康检查API执行SQL（如果支持的话）
async function executeSQLStatement(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      action: 'execute_sql',
      sql: sql
    });

    const options = {
      hostname: 'zhixing-seven.vercel.app',
      port: 443,
      path: '/api/health',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          resolve({ success: false, error: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// 执行Schema修复
async function runSchemaFix() {
  console.log('1️⃣ 尝试添加sales_code字段...');
  
  try {
    const result1 = await executeSQLStatement(sqlStatements[0]);
    console.log('sales_code字段结果:', JSON.stringify(result1, null, 2));
    
    console.log('\n2️⃣ 尝试添加secondary_registration_code字段...');
    const result2 = await executeSQLStatement(sqlStatements[1]);
    console.log('secondary_registration_code字段结果:', JSON.stringify(result2, null, 2));
    
    if (result1.success && result2.success) {
      console.log('\n✅ Schema修复成功！');
      console.log('📋 已添加字段:');
      console.log('   - sales_code VARCHAR(16) UNIQUE');
      console.log('   - secondary_registration_code VARCHAR(16) UNIQUE');
      console.log('\n🚀 现在可以重新测试一级销售创建功能了！');
    } else {
      console.log('\n⚠️ Schema修复可能不支持或失败');
      console.log('💡 建议：直接通过PlanetScale控制台执行SQL语句');
    }
    
  } catch (error) {
    console.error('❌ Schema修复失败:', error);
    console.log('\n💡 手动修复方案:');
    console.log('1. 登录PlanetScale控制台');
    console.log('2. 选择zhixing数据库');
    console.log('3. 在Console中执行以下SQL:');
    console.log('\n   ALTER TABLE primary_sales ADD COLUMN sales_code VARCHAR(16) UNIQUE;');
    console.log('   ALTER TABLE primary_sales ADD COLUMN secondary_registration_code VARCHAR(16) UNIQUE;');
  }
}

runSchemaFix();