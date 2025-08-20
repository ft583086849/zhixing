require('dotenv').config({ path: './client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function updateZhangZijun() {
  console.log('更新张子俊的销售数据...\n');
  
  try {
    // 1. 查找所有可能是张子俊的记录
    const { data: allSales, error: searchError } = await supabase
      .from('sales_optimized')
      .select('*')
      .eq('sales_type', 'primary');
    
    if (searchError) {
      console.error('查询失败:', searchError);
      return;
    }
    
    // 查找张子俊（可能在wechat_name或chain_name字段）
    let zjData = null;
    
    if (allSales) {
      zjData = allSales.find(s => 
        s.wechat_name === '张子俊' || 
        s.real_name === '张子俊' || 
        s.chain_name === '张子俊'
      );
      
      if (!zjData) {
        // 尝试模糊匹配
        zjData = allSales.find(s => 
          (s.wechat_name && s.wechat_name.includes('张')) ||
          (s.real_name && s.real_name.includes('张'))
        );
      }
    }
    
    if (zjData) {
      console.log('找到张子俊的记录:');
      console.log('  ID:', zjData.id);
      console.log('  销售代码:', zjData.sales_code);
      console.log('  微信名:', zjData.wechat_name);
      console.log('  类型:', zjData.sales_type);
      console.log('  当前直销佣金: $' + (zjData.primary_commission_amount || 0));
      console.log('  当前团队分成: $' + (zjData.secondary_commission_amount || 0));
      console.log('  当前链名:', zjData.chain_name);
      console.log('  当前地址:', zjData.payment_account || zjData.payment_info);
      
      // 2. 更新数据
      const updateData = {
        primary_commission_amount: 0,  // 直销佣金改为0
        chain_name: 'BSC',  // 设置为BSC链
        payment_account: '0x37c4234106e1b3eab87c429e8cb922fc0238b557',  // 新的收款地址
        payment_info: '0x37c4234106e1b3eab87c429e8cb922fc0238b557',  // 同时更新payment_info
        commission_rate: 0.4,  // 确保佣金率是40%（一级销售）
        total_commission: zjData.secondary_commission_amount || 0,  // 总佣金=团队分成（因为直销佣金为0）
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('sales_optimized')
        .update(updateData)
        .eq('id', zjData.id);
      
      if (updateError) {
        console.error('\n更新失败:', updateError);
      } else {
        console.log('\n✅ 更新成功！');
        console.log('更新后的数据:');
        console.log('  直销佣金: $0');
        console.log('  团队分成: $' + (zjData.secondary_commission_amount || 0));
        console.log('  总佣金: $' + (zjData.secondary_commission_amount || 0));
        console.log('  链名: BSC');
        console.log('  收款地址: 0x37c4234106e1b3eab87c429e8cb922fc0238b557');
        
        // 3. 计算并显示平均二级佣金率
        if (zjData.total_team_amount > 0) {
          const avgRate = (zjData.secondary_commission_amount / zjData.total_team_amount) * 100;
          console.log('  平均二级佣金率: ' + avgRate.toFixed(1) + '% (应该接近15%)');
        } else {
          console.log('  平均二级佣金率: 暂无团队销售数据');
        }
      }
    } else {
      console.log('未找到张子俊的记录');
      console.log('\n所有一级销售列表:');
      if (allSales) {
        allSales.forEach(s => {
          console.log(`  - ${s.sales_code}: ${s.wechat_name || s.real_name || '未知'}`);
        });
      }
    }
    
  } catch (err) {
    console.error('执行失败:', err);
  }
}

updateZhangZijun();