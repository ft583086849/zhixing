require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function updateChainName() {
  console.log('更新 sales_optimized 表的链名数据...\n');
  
  try {
    // 1. 获取所有有链名的一级销售
    const { data: primarySales } = await supabase
      .from('primary_sales')
      .select('sales_code, chain_name, payment_address')
      .not('chain_name', 'is', null);
    
    console.log(`找到 ${primarySales?.length || 0} 个一级销售有链名`);
    
    // 2. 获取所有有链名的二级销售
    const { data: secondarySales } = await supabase
      .from('secondary_sales')
      .select('sales_code, chain_name, payment_address')
      .not('chain_name', 'is', null);
    
    console.log(`找到 ${secondarySales?.length || 0} 个二级销售有链名\n`);
    
    // 3. 更新一级销售的链名
    let updateCount = 0;
    
    if (primarySales) {
      for (const sale of primarySales) {
        const { error } = await supabase
          .from('sales_optimized')
          .update({ 
            chain_name: sale.chain_name,
            payment_account: sale.payment_address
          })
          .eq('sales_code', sale.sales_code);
        
        if (!error) {
          updateCount++;
          console.log(`✓ 更新 ${sale.sales_code}: 链名=${sale.chain_name}`);
        } else {
          console.error(`✗ 更新 ${sale.sales_code} 失败:`, error.message);
        }
      }
    }
    
    // 4. 更新二级销售的链名
    if (secondarySales) {
      for (const sale of secondarySales) {
        const { error } = await supabase
          .from('sales_optimized')
          .update({ 
            chain_name: sale.chain_name,
            payment_account: sale.payment_address
          })
          .eq('sales_code', sale.sales_code);
        
        if (!error) {
          updateCount++;
          console.log(`✓ 更新 ${sale.sales_code}: 链名=${sale.chain_name}`);
        } else {
          console.error(`✗ 更新 ${sale.sales_code} 失败:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ 更新完成！共更新 ${updateCount} 条记录`);
    
    // 5. 验证更新结果
    console.log('\n验证更新结果...');
    const { data: verifyData } = await supabase
      .from('sales_optimized')
      .select('sales_code, wechat_name, chain_name, payment_account, payment_info')
      .not('chain_name', 'is', null)
      .limit(5);
    
    if (verifyData && verifyData.length > 0) {
      console.log('\n已更新的记录示例:');
      verifyData.forEach(record => {
        console.log(`\n${record.sales_code}:`);
        console.log(`  微信名: ${record.wechat_name}`);
        console.log(`  链名: ${record.chain_name}`);
        console.log(`  收款地址: ${record.payment_account || record.payment_info || '未设置'}`);
      });
    }
    
  } catch (err) {
    console.error('执行失败:', err);
  }
}

updateChainName();