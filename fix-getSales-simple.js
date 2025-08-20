// 简化getSales函数
const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'client/src/services/api.js');
let content = fs.readFileSync(apiPath, 'utf8');

// 找到getSales函数的位置
const startPattern = /  async getSales\(params = \{\}\) \{/;
const startMatch = content.match(startPattern);

if (!startMatch) {
  console.error('找不到getSales函数');
  process.exit(1);
}

// 新的简化版getSales函数
const newGetSales = `  async getSales(params = {}) {
    try {
      console.log('📊 AdminAPI.getSales 开始获取销售数据');
      
      // 构建查询条件
      const supabaseClient = SupabaseService.supabase || window.supabaseClient;
      
      // 从 sales_optimized 表获取数据
      let query = supabaseClient
        .from('sales_optimized')
        .select('*');
      
      // 根据销售类型过滤
      if (params.sales_type === 'primary') {
        query = query.eq('sales_type', 'primary');
      } else if (params.sales_type === 'secondary') {
        query = query.eq('sales_type', 'secondary').not('parent_sales_id', 'is', null);
      } else if (params.sales_type === 'independent') {
        query = query.or('sales_type.eq.independent,and(sales_type.eq.secondary,parent_sales_id.is.null)');
      }
      
      // 微信号搜索
      if (params.wechat_name) {
        query = query.ilike('wechat_name', \`%\${params.wechat_name}%\`);
      }
      
      // 手机号搜索
      if (params.phone) {
        query = query.ilike('phone', \`%\${params.phone}%\`);
      }
      
      // 按销售额排序
      query = query.order('total_amount', { ascending: false });
      
      const { data: salesData, error } = await query;
      
      if (error) {
        console.error('获取销售数据失败:', error);
        throw error;
      }
      
      console.log(\`✅ 获取到 \${salesData?.length || 0} 个销售数据\`);
      
      // 直接返回sales_optimized表的数据，不需要额外处理
      return salesData || [];
      
    } catch (error) {
      console.error('❌ AdminAPI.getSales 失败:', error);
      return [];
    }
  }`;

// 找到函数结束位置
const startIndex = content.indexOf(startMatch[0]);
let braceCount = 0;
let inFunction = false;
let endIndex = startIndex;

for (let i = startIndex; i < content.length; i++) {
  if (content[i] === '{') {
    braceCount++;
    inFunction = true;
  } else if (content[i] === '}') {
    braceCount--;
    if (inFunction && braceCount === 0) {
      endIndex = i + 1;
      break;
    }
  }
}

// 替换函数
const before = content.substring(0, startIndex);
const after = content.substring(endIndex);
content = before + newGetSales + after;

// 写回文件
fs.writeFileSync(apiPath, content, 'utf8');
console.log('✅ getSales函数已简化');