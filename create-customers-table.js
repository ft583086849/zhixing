const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ulhkstbblwbshzxmiwtf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsaGtzdGJibHdic2h6eG1pd3RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjA5NTY2MywiZXhwIjoyMDQ3NjcxNjYzfQ.MxHY--qpW6AmaI5-6cLsh5lwvwHo3G0Tt2RJ4IjS5c4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCustomersOptimizedTable() {
  console.log('🚀 开始创建customers_optimized表...\n');

  try {
    // 步骤1: 先检查并删除已存在的表
    console.log('📋 步骤1: 检查并删除已存在的表...');
    const dropTableSQL = `DROP TABLE IF EXISTS customers_optimized CASCADE;`;
    
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: dropTableSQL
    }).single();
    
    if (dropError && !dropError.message.includes('does not exist')) {
      console.log('⚠️ 删除表时出现警告（可忽略）:', dropError.message);
    }

    // 步骤2: 创建表结构
    console.log('📋 步骤2: 创建customers_optimized表...');
    const createTableSQL = `
      -- 创建必要的扩展
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      
      -- 创建表
      CREATE TABLE customers_optimized (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_wechat VARCHAR(100) UNIQUE NOT NULL,
          customer_name VARCHAR(200),
          tradingview_username VARCHAR(100),
          sales_code VARCHAR(50),
          sales_wechat_name VARCHAR(100),
          sales_type VARCHAR(20),
          primary_sales_id UUID,
          primary_sales_wechat VARCHAR(100),
          secondary_sales_id UUID,
          secondary_sales_wechat VARCHAR(100),
          total_orders INTEGER DEFAULT 0,
          active_orders INTEGER DEFAULT 0,
          pending_orders INTEGER DEFAULT 0,
          total_amount DECIMAL(10,2) DEFAULT 0,
          total_paid_amount DECIMAL(10,2) DEFAULT 0,
          total_commission DECIMAL(10,2) DEFAULT 0,
          first_order_date TIMESTAMP WITH TIME ZONE,
          last_order_date TIMESTAMP WITH TIME ZONE,
          last_order_status VARCHAR(50),
          last_order_amount DECIMAL(10,2),
          days_since_last_order INTEGER,
          avg_order_amount DECIMAL(10,2) DEFAULT 0,
          max_order_amount DECIMAL(10,2) DEFAULT 0,
          min_order_amount DECIMAL(10,2) DEFAULT 0,
          search_text TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    }).single();

    if (createError) {
      // 如果rpc不存在，尝试直接创建
      console.log('⚠️ RPC方法不可用，尝试其他方法...');
      
      // 直接通过API创建一个空记录来初始化表
      const { error: testError } = await supabase
        .from('customers_optimized')
        .select('id')
        .limit(1);
      
      if (testError && testError.message.includes('does not exist')) {
        console.log('❌ 无法通过API创建表，请在Supabase Dashboard手动执行SQL');
        console.log('\n请复制以下SQL到Supabase Dashboard执行:');
        console.log('=====================================');
        console.log(createTableSQL);
        console.log('=====================================');
        return false;
      }
    }

    // 步骤3: 从orders_optimized导入数据
    console.log('📋 步骤3: 从orders_optimized表导入客户数据...');
    
    // 先获取所有订单数据
    const { data: orders, error: ordersError } = await supabase
      .from('orders_optimized')
      .select('*')
      .not('customer_wechat', 'is', null)
      .neq('customer_wechat', '')
      .neq('customer_wechat', '1');

    if (ordersError) {
      console.error('❌ 获取订单数据失败:', ordersError);
      return false;
    }

    console.log(`  找到 ${orders.length} 条订单数据`);

    // 按客户分组
    const customerMap = new Map();
    
    orders.forEach(order => {
      const wechat = order.customer_wechat;
      if (!customerMap.has(wechat)) {
        customerMap.set(wechat, []);
      }
      customerMap.get(wechat).push(order);
    });

    console.log(`  找到 ${customerMap.size} 个唯一客户`);

    // 构建客户数据
    const customersData = [];
    
    for (const [wechat, customerOrders] of customerMap) {
      // 按时间排序
      customerOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const latestOrder = customerOrders[0];
      const firstOrder = customerOrders[customerOrders.length - 1];
      
      // 计算统计数据
      const activeOrders = customerOrders.filter(o => 
        ['active', 'confirmed_config', 'confirmed_payment'].includes(o.status)
      ).length;
      
      const pendingOrders = customerOrders.filter(o => 
        ['pending_payment', 'pending_config'].includes(o.status)
      ).length;
      
      const totalAmount = customerOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const totalPaid = customerOrders.reduce((sum, o) => 
        sum + (o.alipay_amount || 0) + (o.crypto_amount || 0), 0
      );
      const totalCommission = customerOrders.reduce((sum, o) => 
        sum + (o.commission_amount || 0), 0
      );
      
      const amounts = customerOrders.map(o => o.amount || 0).filter(a => a > 0);
      const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
      const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
      const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
      
      const daysSinceLastOrder = latestOrder.created_at 
        ? Math.floor((Date.now() - new Date(latestOrder.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      customersData.push({
        customer_wechat: wechat,
        customer_name: latestOrder.customer_name || null,
        tradingview_username: latestOrder.tradingview_username || null,
        sales_code: latestOrder.sales_code || null,
        sales_wechat_name: latestOrder.sales_wechat_name || null,
        sales_type: latestOrder.sales_type || null,
        primary_sales_wechat: latestOrder.primary_sales_wechat || null,
        secondary_sales_wechat: latestOrder.secondary_sales_wechat || null,
        total_orders: customerOrders.length,
        active_orders: activeOrders,
        pending_orders: pendingOrders,
        total_amount: totalAmount,
        total_paid_amount: totalPaid,
        total_commission: totalCommission,
        first_order_date: firstOrder.created_at,
        last_order_date: latestOrder.created_at,
        last_order_status: latestOrder.status,
        last_order_amount: latestOrder.amount || 0,
        days_since_last_order: daysSinceLastOrder,
        avg_order_amount: avgAmount,
        max_order_amount: maxAmount,
        min_order_amount: minAmount,
        search_text: `${wechat} ${latestOrder.customer_name || ''} ${latestOrder.tradingview_username || ''}`.toLowerCase(),
        created_at: firstOrder.created_at
      });
    }

    // 批量插入数据
    console.log('📋 步骤4: 插入客户数据到customers_optimized表...');
    
    // 分批插入，每批50条
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < customersData.length; i += batchSize) {
      const batch = customersData.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('customers_optimized')
        .insert(batch);
      
      if (insertError) {
        console.error(`❌ 插入第 ${i/batchSize + 1} 批数据失败:`, insertError);
        // 继续尝试其他批次
      } else {
        insertedCount += batch.length;
        console.log(`  ✅ 已插入 ${insertedCount}/${customersData.length} 条记录`);
      }
    }

    // 步骤5: 创建索引
    console.log('\n📋 步骤5: 创建索引...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_customers_opt_wechat ON customers_optimized(customer_wechat);
      CREATE INDEX IF NOT EXISTS idx_customers_opt_tv_username ON customers_optimized(tradingview_username);
      CREATE INDEX IF NOT EXISTS idx_customers_opt_sales_wechat ON customers_optimized(sales_wechat_name);
      CREATE INDEX IF NOT EXISTS idx_customers_opt_created_at ON customers_optimized(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_customers_opt_last_order ON customers_optimized(last_order_date DESC);
      CREATE INDEX IF NOT EXISTS idx_customers_opt_total_amount ON customers_optimized(total_amount DESC);
      CREATE INDEX IF NOT EXISTS idx_customers_opt_total_orders ON customers_optimized(total_orders DESC);
    `;

    // 尝试创建索引（可能需要在Dashboard中执行）
    console.log('  索引创建可能需要在Supabase Dashboard中执行');

    // 步骤6: 验证结果
    console.log('\n📋 步骤6: 验证数据...');
    const { data: stats, count, error: statsError } = await supabase
      .from('customers_optimized')
      .select('*', { count: 'exact', head: false })
      .limit(5)
      .order('total_amount', { ascending: false });

    if (!statsError) {
      console.log(`\n✅ 成功创建customers_optimized表！`);
      console.log(`  总客户数: ${count}`);
      
      if (stats && stats.length > 0) {
        console.log('\n  高价值客户Top 5:');
        stats.forEach((c, i) => {
          console.log(`    ${i+1}. ${c.customer_wechat}: $${c.total_amount} (${c.total_orders}单)`);
        });
      }
    } else {
      console.error('❌ 验证失败:', statsError);
    }

    return true;

  } catch (error) {
    console.error('❌ 执行失败:', error);
    return false;
  }
}

// 执行
createCustomersOptimizedTable().then(success => {
  if (success) {
    console.log('\n🎉 customers_optimized表创建成功！');
    console.log('📌 现在可以访问: http://localhost:3001/admin/customers-optimized');
  } else {
    console.log('\n⚠️ 请在Supabase Dashboard中手动执行SQL脚本');
    console.log('文件: create-customers-optimized-complete.sql');
  }
});