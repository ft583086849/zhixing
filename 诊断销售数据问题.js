// 🔍 诊断销售数据问题
// 在 https://zhixing-seven.vercel.app/admin/sales 控制台运行

console.log('🔍 开始诊断销售数据问题...\n');
console.log('='.repeat(50));

// 1. 检查Redux中的销售数据
const state = store.getState();
const sales = state.admin?.sales || [];

console.log('\n📊 销售数据统计:');
console.log(`总记录数: ${sales.length}`);

// 2. 分析重复记录
const nameCount = {};
sales.forEach((sale, index) => {
  const name = sale.sales?.wechat_name || sale.sales?.name || '未知';
  const type = sale.sales_type || sale.sales?.sales_type || '未知';
  const id = sale.sales?.id || sale.id;
  const rate = sale.commission_rate || sale.sales?.commission_rate;
  
  if (!nameCount[name]) {
    nameCount[name] = [];
  }
  
  nameCount[name].push({
    index,
    id,
    type,
    rate,
    sales_type: sale.sales_type,
    table: sale.sales_type === 'primary' ? 'primary_sales' : 'secondary_sales',
    full_data: sale
  });
});

console.log('\n🔴 重复记录分析:');
Object.entries(nameCount).forEach(([name, records]) => {
  if (records.length > 1) {
    console.log(`\n${name}: ${records.length}条记录`);
    records.forEach((record, i) => {
      console.log(`  记录${i + 1}:`);
      console.log(`    - ID: ${record.id}`);
      console.log(`    - 类型: ${record.type}`);
      console.log(`    - 表: ${record.table}`);
      console.log(`    - 佣金率: ${record.rate}`);
    });
  }
});

// 3. 检查佣金率格式
console.log('\n💰 佣金率格式分析:');
const rates = new Set();
sales.forEach(sale => {
  const rate = sale.commission_rate || sale.sales?.commission_rate;
  if (rate !== null && rate !== undefined) {
    rates.add(rate);
  }
});

console.log('所有佣金率值:', Array.from(rates).sort((a, b) => a - b));

// 4. 直接查询数据库（如果可以）
console.log('\n📦 尝试直接查询数据库...');
if (window.SupabaseService?.supabase) {
  const supabase = window.SupabaseService.supabase;
  
  // 查询primary_sales
  supabase.from('primary_sales')
    .select('*')
    .then(({ data: primaryData, error: primaryError }) => {
      if (primaryError) {
        console.error('查询primary_sales失败:', primaryError);
      } else {
        console.log('\n📋 primary_sales表:');
        console.log(`记录数: ${primaryData.length}`);
        primaryData.forEach(p => {
          console.log(`  - ${p.wechat_name || p.name}: ID=${p.id}, rate=${p.commission_rate}`);
        });
      }
    });
  
  // 查询secondary_sales
  supabase.from('secondary_sales')
    .select('*')
    .then(({ data: secondaryData, error: secondaryError }) => {
      if (secondaryError) {
        console.error('查询secondary_sales失败:', secondaryError);
      } else {
        console.log('\n📋 secondary_sales表:');
        console.log(`记录数: ${secondaryData.length}`);
        secondaryData.forEach(s => {
          console.log(`  - ${s.wechat_name || s.name}: ID=${s.id}, rate=${s.commission_rate}, primary_id=${s.primary_sales_id}`);
        });
      }
    });
}

// 5. 检查计算逻辑
console.log('\n🔧 检查佣金计算逻辑:');
sales.forEach((sale, index) => {
  const name = sale.sales?.wechat_name || '未知';
  const displayRate = sale.commission_rate;
  const storedRate = sale.sales?.commission_rate;
  
  if (displayRate !== storedRate) {
    console.log(`\n⚠️ 数据不一致 - ${name}:`);
    console.log(`  显示的佣金率: ${displayRate}`);
    console.log(`  存储的佣金率: ${storedRate}`);
    console.log(`  完整数据:`, sale);
  }
});

console.log('\n' + '='.repeat(50));
console.log('✅ 诊断完成！');
console.log('\n💡 建议:');
console.log('1. 检查是否在两个表中都有记录');
console.log('2. 确认佣金率更新是否正确保存到数据库');
console.log('3. 检查动态计算逻辑是否影响显示');
