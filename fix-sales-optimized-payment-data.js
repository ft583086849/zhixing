require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function fixPaymentData() {
  console.log('修复 sales_optimized 表的收款信息和链名...\n');
  
  try {
    // 1. 获取所有 sales_optimized 记录
    const { data: salesOptimized, error: fetchError } = await supabase
      .from('sales_optimized')
      .select('*');
    
    if (fetchError) {
      console.error('获取数据失败:', fetchError);
      return;
    }
    
    console.log(`找到 ${salesOptimized.length} 条记录\n`);
    
    let updateCount = 0;
    
    for (const sale of salesOptimized) {
      let updates = {};
      
      // 根据销售类型查询原表数据
      if (sale.sales_type === 'primary') {
        const { data: primaryData } = await supabase
          .from('primary_sales')
          .select('*')
          .eq('sales_code', sale.sales_code)
          .single();
        
        if (primaryData) {
          // 使用原表的数据更新
          updates = {
            real_name: primaryData.real_name || primaryData.name || null,
            chain_name: primaryData.chain_name || null,
            payment_account: primaryData.payment_address || null,
            payment_method: primaryData.payment_method || null,
            alipay_account: primaryData.alipay_account || null,
            bank_account: primaryData.bank_account || null,
            bank_name: primaryData.bank_name || null
          };
          
          // 如果 payment_info 为空，用 payment_address 填充
          if (!sale.payment_info && primaryData.payment_address) {
            updates.payment_info = primaryData.payment_address;
          }
        }
      } else {
        const { data: secondaryData } = await supabase
          .from('secondary_sales')
          .select('*')
          .eq('sales_code', sale.sales_code)
          .single();
        
        if (secondaryData) {
          updates = {
            real_name: secondaryData.real_name || secondaryData.name || null,
            chain_name: secondaryData.chain_name || null,
            payment_account: secondaryData.payment_address || null,
            payment_method: secondaryData.payment_method || null,
            alipay_account: secondaryData.alipay_account || null,
            bank_account: secondaryData.bank_account || null,
            bank_name: secondaryData.bank_name || null
          };
          
          // 如果 payment_info 为空，用 payment_address 填充
          if (!sale.payment_info && secondaryData.payment_address) {
            updates.payment_info = secondaryData.payment_address;
          }
        }
      }
      
      // 如果有需要更新的数据
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('sales_optimized')
          .update(updates)
          .eq('id', sale.id);
        
        if (updateError) {
          console.error(`更新 ${sale.sales_code} 失败:`, updateError);
        } else {
          updateCount++;
          console.log(`✓ 更新 ${sale.sales_code}:`);
          console.log(`  - 真实姓名: ${updates.real_name || '无'}`);
          console.log(`  - 链名: ${updates.chain_name || '无'}`);
          console.log(`  - 收款地址: ${updates.payment_account || updates.payment_info || '无'}`);
        }
      }
    }
    
    console.log(`\n✅ 更新完成！共更新 ${updateCount} 条记录`);
    
    // 验证更新结果
    console.log('\n验证更新结果...');
    const { data: verifyData } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, real_name, chain_name, payment_account, payment_info')
      .not('chain_name', 'is', null)
      .limit(5);
    
    if (verifyData && verifyData.length > 0) {
      console.log('\n已更新的记录示例:');
      verifyData.forEach(record => {
        console.log(`\n${record.sales_code}:`);
        console.log(`  微信名: ${record.wechat_name}`);
        console.log(`  真实姓名: ${record.real_name || '未设置'}`);
        console.log(`  链名: ${record.chain_name}`);
        console.log(`  收款地址: ${record.payment_account || record.payment_info || '未设置'}`);
      });
    }
    
  } catch (err) {
    console.error('执行失败:', err);
  }
}

fixPaymentData();