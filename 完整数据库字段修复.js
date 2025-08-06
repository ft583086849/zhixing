// 完整数据库字段修复脚本
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'zhixing',
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

async function fixDatabaseFields() {
  let connection;
  
  try {
    console.log('🔗 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    console.log('\n📋 执行数据库字段修复...');

    // 需要添加的字段配置
    const fieldsToAdd = [
      // primary_sales 表需要的字段
      {
        table: 'primary_sales',
        fields: [
          { name: 'phone', type: 'VARCHAR(20)', nullable: true, comment: '联系电话' },
          { name: 'email', type: 'VARCHAR(100)', nullable: true, comment: '邮箱地址' },
          { name: 'sales_code', type: 'VARCHAR(32) UNIQUE', nullable: true, comment: '用户购买时使用的销售代码' },
          { name: 'secondary_registration_code', type: 'VARCHAR(32) UNIQUE', nullable: true, comment: '二级销售注册时使用的代码' }
        ]
      },
      // secondary_sales 表需要的字段
      {
        table: 'secondary_sales',
        fields: [
          { name: 'sales_code', type: 'VARCHAR(32) UNIQUE', nullable: true, comment: '用户购买时使用的销售代码' },
          { name: 'payment_address', type: 'TEXT', nullable: true, comment: '收款地址' }
        ]
      }
    ];

    // 执行字段添加
    for (const tableConfig of fieldsToAdd) {
      console.log(`\n🔧 处理表: ${tableConfig.table}`);
      
      for (const field of tableConfig.fields) {
        try {
          const nullClause = field.nullable ? 'NULL' : 'NOT NULL';
          const sql = `ALTER TABLE ${tableConfig.table} ADD COLUMN ${field.name} ${field.type} ${nullClause} COMMENT '${field.comment}'`;
          
          console.log(`   添加字段: ${field.name}...`);
          await connection.execute(sql);
          console.log(`   ✅ ${field.name} 字段添加成功`);
          
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`   ℹ️  ${field.name} 字段已存在，跳过`);
          } else {
            console.log(`   ❌ ${field.name} 字段添加失败: ${error.message}`);
          }
        }
      }
    }

    // 验证字段添加结果
    console.log('\n🔍 验证字段添加结果...');
    
    for (const tableConfig of fieldsToAdd) {
      console.log(`\n📊 检查表: ${tableConfig.table}`);
      
      const fieldNames = tableConfig.fields.map(f => `'${f.name}'`).join(',');
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
        AND COLUMN_NAME IN (${fieldNames})
        ORDER BY COLUMN_NAME
      `, [process.env.DB_NAME || 'zhixing', tableConfig.table]);

      console.log(`   找到 ${columns.length}/${tableConfig.fields.length} 个字段:`);
      columns.forEach(col => {
        console.log(`   ✅ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (${col.COLUMN_COMMENT})`);
      });
      
      // 检查是否有缺失的字段
      const foundFields = columns.map(c => c.COLUMN_NAME);
      const missingFields = tableConfig.fields.filter(f => !foundFields.includes(f.name));
      if (missingFields.length > 0) {
        console.log(`   ⚠️  缺失字段: ${missingFields.map(f => f.name).join(', ')}`);
      }
    }

    // 检查现有数据
    console.log('\n📊 检查现有数据...');
    const [primaryCount] = await connection.execute('SELECT COUNT(*) as total FROM primary_sales');
    const [secondaryCount] = await connection.execute('SELECT COUNT(*) as total FROM secondary_sales');
    
    console.log(`   primary_sales 记录数: ${primaryCount[0].total}`);
    console.log(`   secondary_sales 记录数: ${secondaryCount[0].total}`);

    console.log('\n🎉 数据库字段修复完成！');
    console.log('📝 修复总结:');
    console.log('   ✅ primary_sales表: phone, email, sales_code, secondary_registration_code 字段');
    console.log('   ✅ secondary_sales表: sales_code, payment_address 字段');
    console.log('   🚀 销售注册功能现在应该可以正常工作了！');

  } catch (error) {
    console.error('❌ 数据库字段修复失败:', error.message);
    console.error('📋 错误详情:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔐 数据库连接已关闭');
    }
  }
}

// 执行脚本
console.log('🚀 开始完整数据库字段修复...\n');
fixDatabaseFields()
  .then(() => {
    console.log('\n✨ 修复脚本执行完成！');
    console.log('🔄 现在可以重新测试销售注册功能了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 修复脚本执行失败:', error.message);
    process.exit(1);
  });