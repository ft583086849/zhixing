const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkDatabase() {
  console.log('🔍 检查数据库中的订单数据\n');
  
  const dbPath = path.join(__dirname, 'server', 'database.sqlite');
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    // 1. 检查订单表结构
    console.log('1️⃣ 检查订单表结构...');
    db.all("PRAGMA table_info(orders)", (err, rows) => {
      if (err) {
        console.error('❌ 检查表结构失败:', err);
        reject(err);
        return;
      }
      console.log('✅ 订单表结构:');
      rows.forEach(row => {
        console.log(`- ${row.name}: ${row.type} (${row.notnull ? 'NOT NULL' : 'NULL'})`);
      });
      
      // 2. 检查所有订单数据
      console.log('\n2️⃣ 检查所有订单数据...');
      db.all("SELECT * FROM orders", (err, rows) => {
        if (err) {
          console.error('❌ 查询订单失败:', err);
          reject(err);
          return;
        }
        
        console.log(`✅ 找到 ${rows.length} 个订单`);
        
        if (rows.length > 0) {
          console.log('📋 订单详情:');
          rows.forEach((order, index) => {
            console.log(`\n订单 ${index + 1}:`);
            console.log(`- ID: ${order.id}`);
            console.log(`- 状态: ${order.status}`);
            console.log(`- 金额: $${order.amount}`);
            console.log(`- 时长: ${order.duration}`);
            console.log(`- 付款方式: ${order.payment_method}`);
            console.log(`- 提交时间: ${order.submit_time}`);
            console.log(`- 付款时间: ${order.payment_time}`);
          });
        }
        
        // 3. 按状态统计订单
        console.log('\n3️⃣ 按状态统计订单...');
        db.all("SELECT status, COUNT(*) as count FROM orders GROUP BY status", (err, rows) => {
          if (err) {
            console.error('❌ 统计订单失败:', err);
            reject(err);
            return;
          }
          
          console.log('📊 订单状态统计:');
          rows.forEach(row => {
            console.log(`- ${row.status}: ${row.count}个`);
          });
          
          // 4. 检查总收入
          console.log('\n4️⃣ 检查总收入...');
          db.get("SELECT SUM(amount) as total FROM orders WHERE status = 'confirmed_configuration'", (err, row) => {
            if (err) {
              console.error('❌ 计算总收入失败:', err);
              reject(err);
              return;
            }
            
            console.log(`✅ 已配置确认订单总收入: $${row.total || 0}`);
            
            // 5. 检查所有状态的总收入
            db.all("SELECT status, SUM(amount) as total FROM orders GROUP BY status", (err, rows) => {
              if (err) {
                console.error('❌ 计算各状态总收入失败:', err);
                reject(err);
                return;
              }
              
              console.log('\n📊 各状态订单总收入:');
              rows.forEach(row => {
                console.log(`- ${row.status}: $${row.total || 0}`);
              });
              
              db.close();
              resolve();
            });
          });
        });
      });
    });
  });
}

checkDatabase().then(() => {
  console.log('\n🎉 数据库检查完成！');
}).catch(error => {
  console.error('❌ 数据库检查失败:', error);
}); 