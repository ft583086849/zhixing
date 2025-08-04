// 添加sales_code字段到数据库表
const https = require('https');

function addFieldsToDatabase() {
  return new Promise((resolve) => {
    console.log('🔧 添加sales_code字段到数据库...');
    
    const sqlQueries = [
      // 1. 为primary_sales表添加字段
      `ALTER TABLE primary_sales 
       ADD COLUMN sales_code VARCHAR(50) UNIQUE NULL COMMENT '用户购买时使用的销售代码',
       ADD COLUMN secondary_registration_code VARCHAR(50) UNIQUE NULL COMMENT '二级销售注册时使用的代码'`,
      
      // 2. 添加索引
      `CREATE INDEX idx_primary_sales_sales_code ON primary_sales (sales_code)`,
      `CREATE INDEX idx_primary_sales_secondary_registration_code ON primary_sales (secondary_registration_code)`,
      
      // 3. 为orders表添加字段  
      `ALTER TABLE orders 
       ADD COLUMN sales_code VARCHAR(50) NULL COMMENT '购买时使用的销售代码',
       ADD COLUMN sales_type ENUM('primary', 'secondary', 'legacy') NULL COMMENT '销售类型',
       ADD COLUMN primary_sales_id INT NULL COMMENT '一级销售ID',
       ADD COLUMN secondary_sales_id INT NULL COMMENT '二级销售ID'`,
       
      // 4. 添加外键约束
      `ALTER TABLE orders ADD CONSTRAINT fk_orders_primary_sales FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id)`,
      
      // 5. 创建secondary_sales表（如果不存在）
      `CREATE TABLE IF NOT EXISTS secondary_sales (
         id INT PRIMARY KEY AUTO_INCREMENT,
         wechat_name VARCHAR(100) NOT NULL UNIQUE,
         sales_code VARCHAR(50) UNIQUE NOT NULL COMMENT '用户购买时使用的销售代码',
         primary_sales_id INT NOT NULL COMMENT '关联的一级销售ID',
         primary_registration_code VARCHAR(50) NOT NULL COMMENT '注册时使用的一级销售注册代码',
         payment_method ENUM('alipay', 'crypto') NOT NULL,
         payment_address TEXT NOT NULL,
         alipay_surname VARCHAR(50),
         chain_name VARCHAR(50),
         commission_rate DECIMAL(5,2) DEFAULT 30.00 COMMENT '佣金比率',
         status ENUM('active', 'removed') DEFAULT 'active',
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         FOREIGN KEY (primary_sales_id) REFERENCES primary_sales(id),
         KEY idx_sales_code (sales_code),
         KEY idx_primary_registration_code (primary_registration_code)
       )`
    ];
    
    console.log('执行SQL脚本...');
    sqlQueries.forEach((sql, index) => {
      console.log(`${index + 1}. ${sql.substring(0, 80)}...`);
    });
    
    console.log('\n⚠️ 注意：这需要在数据库中手动执行，或通过管理面板执行');
    console.log('因为Vercel Serverless Functions无法执行ALTER TABLE操作');
    
    resolve();
  });
}

addFieldsToDatabase();