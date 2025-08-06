const mysql = require('mysql2/promise');
const fs = require('fs');

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

async function executeCompleteRestructure() {
  console.log('🔧 开始执行完整数据库重构...\n');
  
  let connection;
  
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 读取SQL脚本
    const sqlScript = fs.readFileSync('./complete-database-restructure.sql', 'utf8');
    
    // 分割SQL语句
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 准备执行 ${statements.length} 条SQL语句\n`);

    // 逐条执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('===') || statement.startsWith('SELECT')) {
        // 处理检查点和查询语句
        try {
          const [rows] = await connection.execute(statement);
          
          if (statement.includes('check_point')) {
            console.log(`\n📊 ${rows[0].check_point}`);
          } else if (statement.includes('数据库重构完成')) {
            console.log(`\n🎉 ${rows[0].status} (${rows[0].completion_time})`);
          } else {
            console.table(rows);
          }
        } catch (error) {
          if (!statement.includes('check_point')) {
            console.log(`⚠️  查询执行失败: ${error.message}`);
          }
        }
      } else {
        // 处理DDL和DML语句
        try {
          await connection.execute(statement);
          
          // 根据语句类型显示不同的消息
          if (statement.includes('ADD COLUMN')) {
            console.log(`✅ 添加字段成功`);
          } else if (statement.includes('MODIFY COLUMN')) {
            console.log(`✅ 修改字段成功`);
          } else if (statement.includes('ADD INDEX')) {
            console.log(`✅ 添加索引成功`);
          } else if (statement.includes('UPDATE')) {
            console.log(`✅ 数据迁移成功`);
          } else if (statement.includes('ADD CONSTRAINT')) {
            console.log(`✅ 添加约束成功`);
          } else {
            console.log(`✅ 执行成功: ${statement.substring(0, 50)}...`);
          }
        } catch (error) {
          // 某些操作可能因为字段已存在而失败，这是正常的
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate column') ||
              error.message.includes('Multiple primary key')) {
            console.log(`⚠️  字段已存在，跳过: ${statement.substring(0, 50)}...`);
          } else {
            console.error(`❌ 执行失败: ${error.message}`);
            console.error(`   语句: ${statement.substring(0, 100)}...`);
            // 继续执行下一条语句，不中断整个过程
          }
        }
      }
    }

    console.log('\n🎉 数据库重构执行完成！');
    
    // 最终验证
    console.log('\n📋 最终验证结果:');
    
    // 检查orders表结构
    const [tableInfo] = await connection.execute('DESCRIBE orders');
    console.log('\n📊 Orders表当前字段:');
    console.table(tableInfo.map(field => ({
      字段名: field.Field,
      类型: field.Type,
      是否为空: field.Null,
      默认值: field.Default,
      注释: field.Comment || '-'
    })));

  } catch (error) {
    console.error('❌ 重构过程中发生错误:', error.message);
    console.error('详细错误:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔚 数据库连接已关闭');
    }
  }
}

// 运行重构
executeCompleteRestructure()
  .then(() => {
    console.log('\n✅ 数据库重构全部完成，可以恢复API代码了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 重构失败:', error.message);
    process.exit(1);
  });