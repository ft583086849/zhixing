const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 正在连接到Supabase数据库...');

async function createOptimizedTable() {
  try {
    console.log('📊 步骤1: 创建orders_optimized表...');
    
    // 基础表创建SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS orders_optimized (
        -- 基础信息字段
        id BIGSERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        
        -- 客户信息字段
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20),
        customer_email VARCHAR(100),
        customer_wechat VARCHAR(50),
        tradingview_username VARCHAR(50),
        
        -- 金额和支付字段
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        actual_payment_amount DECIMAL(10,2),
        alipay_amount DECIMAL(10,2),
        crypto_amount DECIMAL(10,2),
        payment_method VARCHAR(20),
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payment_time TIMESTAMPTZ,
        
        -- 产品和订单字段
        duration VARCHAR(20) NOT NULL,
        purchase_type VARCHAR(20) DEFAULT 'immediate',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        config_confirmed BOOLEAN DEFAULT FALSE,
        effective_time TIMESTAMPTZ,
        expiry_time TIMESTAMPTZ,
        submit_time TIMESTAMPTZ,
        
        -- 销售关联字段
        sales_code VARCHAR(50),
        sales_type VARCHAR(20),
        primary_sales_id BIGINT,
        secondary_sales_id BIGINT,
        commission_amount DECIMAL(10,2) DEFAULT 0,
        commission_rate DECIMAL(5,4) DEFAULT 0,
        link_code VARCHAR(50),
        
        -- 附件和截图字段
        screenshot_path VARCHAR(255),
        screenshot_data TEXT,
        
        -- 性能优化字段
        search_keywords TEXT,
        data_version INTEGER DEFAULT 1,
        is_deleted BOOLEAN DEFAULT FALSE,
        
        -- 未来扩展字段
        customer_id BIGINT,
        source_channel VARCHAR(50),
        referrer_code VARCHAR(50),
        campaign_id VARCHAR(50),
        device_info JSONB,
        geo_location JSONB,
        risk_score INTEGER DEFAULT 0,
        tags JSONB DEFAULT '[]'::jsonb,
        
        -- 检查约束
        CONSTRAINT chk_payment_status 
            CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled', 'pending_payment')),
            
        CONSTRAINT chk_sales_type 
            CHECK (sales_type IN ('primary', 'secondary', 'independent') OR sales_type IS NULL),
            
        CONSTRAINT chk_status 
            CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired', 'confirmed_config', 'pending_payment', 'pending_config')),
            
        CONSTRAINT chk_amount_positive 
            CHECK (amount >= 0),
            
        CONSTRAINT chk_commission_rate 
            CHECK (commission_rate >= 0 AND commission_rate <= 1),
            
        CONSTRAINT chk_risk_score 
            CHECK (risk_score >= 0 AND risk_score <= 100)
      );
    `;
    
    console.log('🚀 执行创建表SQL...');
    
    // 尝试执行SQL
    const { data, error } = await supabase.rpc('execute_sql', { 
      query: createTableSQL 
    });
    
    if (error) {
      console.error('❌ 创建表失败:', error.message);
      console.log('🔄 尝试使用PostgreSQL REST API...');
      
      // 备用方法：尝试通过查询创建
      const { data: checkData, error: checkError } = await supabase
        .from('orders_optimized')
        .select('count(*)')
        .limit(1);
        
      if (checkError && checkError.code === 'PGRST116') {
        console.log('✅ 表不存在，这是预期的');
        console.log('❗ 需要在Supabase控制台手动创建表');
        return false;
      } else if (checkError) {
        console.error('❌ 检查表失败:', checkError);
        return false;
      } else {
        console.log('✅ 表已存在');
        return true;
      }
    }
    
    console.log('✅ 表创建成功:', data);
    return true;
    
  } catch (err) {
    console.error('❌ 执行异常:', err.message);
    return false;
  }
}

async function main() {
  console.log('🎯 开始创建orders_optimized表...');
  
  const success = await createOptimizedTable();
  
  if (success) {
    console.log('🎉 任务完成：orders_optimized表创建成功');
  } else {
    console.log('⚠️ 无法通过代码创建表');
    console.log('📋 建议：');
    console.log('1. 登录到 https://supabase.com/dashboard');
    console.log('2. 选择项目 itvmeamoqthfqtkpubdv');
    console.log('3. 进入 SQL Editor');
    console.log('4. 执行 create-orders-optimized-table.sql 文件中的SQL');
  }
  
  process.exit(success ? 0 : 1);
}

main();