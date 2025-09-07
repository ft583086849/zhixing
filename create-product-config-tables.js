// 创建完整的产品配置数据库架构
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gvlwjgbbffxgrcxqprdc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bHdqZ2JiZmZ4Z3JjeHFwcmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ4NDgxNzEsImV4cCI6MjA0MDQyNDE3MX0.MV5o9iOE3rXfCz3t7kQJBKLtLPW_xYvf_K_cVEkQ2OI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProductConfigTables() {
  console.log('🏗️ 开始创建产品配置表架构...');

  try {
    // 1. 创建产品配置表的SQL（需要在Supabase控制台手动执行）
    const createTableSQL = `
-- 创建产品配置表
CREATE TABLE IF NOT EXISTS product_config (
    id SERIAL PRIMARY KEY,
    product_type VARCHAR(20) NOT NULL,
    duration_months INTEGER NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    trial_days INTEGER DEFAULT 0,
    is_trial BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_type, duration_months, effective_date, is_trial)
);

-- 创建产品特性表
CREATE TABLE IF NOT EXISTS product_features (
    id SERIAL PRIMARY KEY,
    product_type VARCHAR(20) NOT NULL,
    feature_name VARCHAR(50) NOT NULL,
    feature_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_product_config_type_status ON product_config(product_type, status);
CREATE INDEX IF NOT EXISTS idx_product_config_trial ON product_config(is_trial, status);
CREATE INDEX IF NOT EXISTS idx_product_features_type ON product_features(product_type, is_active);
`;

    console.log('📋 需要在Supabase控制台执行的SQL:');
    console.log(createTableSQL);
    
    // 2. 检查表是否已存在
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['product_config', 'product_features']);
    
    if (checkError) {
      console.log('⚠️ 无法检查表存在性，可能需要手动创建表');
    } else {
      console.log('✅ 当前存在的表:', existingTables?.map(t => t.table_name) || []);
    }

    return { sql: createTableSQL, existingTables };
  } catch (error) {
    console.error('❌ 创建表架构失败:', error);
    throw error;
  }
}

async function insertProductConfigData() {
  console.log('📝 插入产品配置数据...');

  try {
    // 3天免费试用配置
    const trialConfigs = [
      {
        product_type: '信号策略',
        duration_months: 0,
        price_usd: 0.00,
        trial_days: 3,
        is_trial: true,
        status: 'active',
        effective_date: '2024-09-06'
      },
      {
        product_type: '推币系统',
        duration_months: 0,
        price_usd: 0.00,
        trial_days: 3,
        is_trial: true,
        status: 'coming_soon',
        effective_date: '2024-09-06'
      },
      {
        product_type: '套餐组合',
        duration_months: 0,
        price_usd: 0.00,
        trial_days: 3,
        is_trial: true,
        status: 'coming_soon',
        effective_date: '2024-09-06'
      }
    ];

    // 付费套餐配置
    const paidConfigs = [
      // 信号策略
      { product_type: '信号策略', duration_months: 1, price_usd: 288.00, status: 'active' },
      { product_type: '信号策略', duration_months: 3, price_usd: 588.00, status: 'active' },
      { product_type: '信号策略', duration_months: 6, price_usd: 1088.00, status: 'active' },
      { product_type: '信号策略', duration_months: 12, price_usd: 1888.00, status: 'active' },
      
      // 推币系统
      { product_type: '推币系统', duration_months: 1, price_usd: 588.00, status: 'coming_soon' },
      { product_type: '推币系统', duration_months: 3, price_usd: 1588.00, status: 'coming_soon' },
      { product_type: '推币系统', duration_months: 6, price_usd: 2588.00, status: 'coming_soon' },
      { product_type: '推币系统', duration_months: 12, price_usd: 3999.00, status: 'coming_soon' },
      
      // 套餐组合
      { product_type: '套餐组合', duration_months: 1, price_usd: 688.00, status: 'coming_soon' },
      { product_type: '套餐组合', duration_months: 3, price_usd: 1888.00, status: 'coming_soon' },
      { product_type: '套餐组合', duration_months: 6, price_usd: 3188.00, status: 'coming_soon' },
      { product_type: '套餐组合', duration_months: 12, price_usd: 4688.00, status: 'coming_soon' }
    ].map(config => ({
      ...config,
      trial_days: 0,
      is_trial: false,
      effective_date: '2024-09-06'
    }));

    const allConfigs = [...trialConfigs, ...paidConfigs];

    console.log('🔄 尝试插入产品配置数据...');
    
    const { data, error } = await supabase
      .from('product_config')
      .upsert(allConfigs, { onConflict: 'product_type,duration_months,effective_date,is_trial' })
      .select();

    if (error) {
      console.log('⚠️ 插入失败，可能表不存在:', error.message);
      console.log('📋 需要插入的数据:');
      console.log(JSON.stringify(allConfigs, null, 2));
      return { data: allConfigs, inserted: false };
    }

    console.log('✅ 成功插入产品配置:', data?.length, '条记录');
    return { data, inserted: true };

  } catch (error) {
    console.error('❌ 插入产品配置失败:', error);
    throw error;
  }
}

async function insertProductFeatures() {
  console.log('🎯 插入产品特性数据...');

  const features = [
    // 信号策略特性
    { product_type: '信号策略', feature_name: '信号策略分析', feature_description: '专业的市场分析和交易策略' },
    { product_type: '信号策略', feature_name: 'TradingView信号', feature_description: '实时TradingView信号推送' },
    { product_type: '信号策略', feature_name: '24小时客服', feature_description: '全天候专业客服支持' },
    
    // 推币系统特性
    { product_type: '推币系统', feature_name: 'Discord专属频道', feature_description: 'Discord平台独家交易频道' },
    { product_type: '推币系统', feature_name: '实时推币信号', feature_description: '即时推送高质量交易信号' },
    { product_type: '推币系统', feature_name: '3天免费试用', feature_description: '新用户享受3天完整功能体验' },
    { product_type: '推币系统', feature_name: '高级分析工具', feature_description: '专业的技术分析工具集' },
    
    // 套餐组合特性
    { product_type: '套餐组合', feature_name: '包含信号策略', feature_description: '完整的信号策略功能' },
    { product_type: '套餐组合', feature_name: '包含推币系统', feature_description: '完整的推币系统功能' },
    { product_type: '套餐组合', feature_name: '最优价格组合', feature_description: '相比单独购买节省更多费用' }
  ];

  try {
    const { data, error } = await supabase
      .from('product_features')
      .upsert(features, { onConflict: 'product_type,feature_name' })
      .select();

    if (error) {
      console.log('⚠️ 插入特性失败，可能表不存在:', error.message);
      console.log('📋 需要插入的特性数据:');
      console.log(JSON.stringify(features, null, 2));
      return { data: features, inserted: false };
    }

    console.log('✅ 成功插入产品特性:', data?.length, '条记录');
    return { data, inserted: true };

  } catch (error) {
    console.error('❌ 插入产品特性失败:', error);
    throw error;
  }
}

// 主函数
async function main() {
  console.log('🚀 开始创建完整产品配置架构...\n');

  try {
    // Step 1: 创建表结构
    const tableResult = await createProductConfigTables();
    
    // Step 2: 插入产品配置数据
    const configResult = await insertProductConfigData();
    
    // Step 3: 插入产品特性数据
    const featuresResult = await insertProductFeatures();
    
    console.log('\n📊 架构创建完成汇总:');
    console.log('- 表结构SQL:', tableResult.sql ? '已生成' : '失败');
    console.log('- 产品配置:', configResult.inserted ? '已插入' : '需手动');
    console.log('- 产品特性:', featuresResult.inserted ? '已插入' : '需手动');
    
    if (!configResult.inserted || !featuresResult.inserted) {
      console.log('\n⚠️ 部分数据需要在Supabase控制台手动处理');
      console.log('1. 执行表创建SQL');
      console.log('2. 手动插入配置和特性数据');
    }
    
    return {
      success: true,
      tableSQL: tableResult.sql,
      configData: configResult.data,
      featuresData: featuresResult.data
    };

  } catch (error) {
    console.error('❌ 架构创建失败:', error);
    return { success: false, error };
  }
}

// 执行
main();