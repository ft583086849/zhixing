// 这个脚本用来更新API，临时绕过序列问题
const fs = require('fs');
const path = require('path');

const apiFilePath = '/Users/zzj/Documents/w/client/src/services/api.js';

console.log('====== 更新API以处理序列问题 ======\n');

try {
  // 读取API文件
  let apiContent = fs.readFileSync(apiFilePath, 'utf8');
  
  // 查找订单创建的部分
  const createOrderPattern = /order_number: orderData\.order_number \|\| `ORD\${Date\.now\(\)}`/;
  
  if (apiContent.match(createOrderPattern)) {
    console.log('找到订单创建逻辑，准备添加序列处理...');
    
    // 在订单创建逻辑中添加ID处理
    const newCreateLogic = `// 生成安全的订单ID，避免序列冲突
        let safeId = null;
        try {
          // 查询当前最大ID
          const { data: maxIdData } = await SupabaseService.supabase
            .from('orders_optimized')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .single();
          
          if (maxIdData) {
            safeId = maxIdData.id + Math.floor(Math.random() * 100) + 10; // 随机增量避免冲突
          }
        } catch (e) {
          // 如果查询失败，使用时间戳作为fallback
          safeId = Date.now();
        }

        order_number: orderData.order_number || \`ORD\${Date.now()}\`,
        ...(safeId && { id: safeId }), // 只在有安全ID时才设置`;
    
    // 替换订单创建逻辑
    apiContent = apiContent.replace(
      /order_number: orderData\.order_number \|\| `ORD\${Date\.now\(\)}`/,
      newCreateLogic
    );
    
    console.log('已添加序列处理逻辑');
    
    // 写回文件
    fs.writeFileSync(apiFilePath + '.sequence-fix', apiContent);
    console.log('✅ 修改后的API已保存到 api.js.sequence-fix');
    console.log('⚠️  需要手动检查并应用修改');
    
  } else {
    console.log('❌ 未找到预期的订单创建模式');
  }
  
} catch (error) {
  console.error('更新API失败:', error);
}