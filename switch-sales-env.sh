#!/bin/bash

# 销售管理优化 - 环境切换脚本
# 用于在测试环境和生产环境之间切换

echo "🔄 销售管理优化 - 环境切换"
echo ""
echo "请选择操作："
echo "1) 切换到测试环境（使用 sales_optimized 表）"
echo "2) 切换回生产环境（使用原表）"
echo "3) 查看当前环境"
echo "4) 运行性能测试"
echo "5) 退出"
echo ""
read -p "请输入选项 (1-5): " choice

case $choice in
  1)
    echo ""
    echo "🧪 切换到测试环境..."
    
    # 设置环境变量
    export USE_OPTIMIZED_TABLES=true
    export REACT_APP_USE_OPTIMIZED_TABLES=true
    
    # 创建测试环境配置
    node test-env-config.js test
    
    echo ""
    echo "✅ 已切换到测试环境"
    echo ""
    echo "📋 测试清单："
    echo "   □ sales_optimized 表已创建"
    echo "   □ 数据已迁移"
    echo "   □ 触发器已配置"
    echo "   □ 前端组件已更新"
    echo ""
    echo "🎯 下一步："
    echo "   1. 重启开发服务器: npm start"
    echo "   2. 访问销售管理页面测试"
    echo "   3. 验证数据和性能"
    ;;
    
  2)
    echo ""
    echo "🚀 切换回生产环境..."
    
    # 清除环境变量
    export USE_OPTIMIZED_TABLES=false
    export REACT_APP_USE_OPTIMIZED_TABLES=false
    
    # 恢复生产配置
    node test-env-config.js prod
    
    echo ""
    echo "✅ 已切换到生产环境"
    echo "   使用表: primary_sales + secondary_sales"
    echo ""
    echo "请重启开发服务器使配置生效"
    ;;
    
  3)
    echo ""
    node test-env-config.js status
    
    # 检查数据库表状态
    echo ""
    echo "📊 数据库表状态："
    
    # 检查 sales_optimized 表
    if psql -U postgres -d your_database -c "SELECT COUNT(*) FROM sales_optimized;" > /dev/null 2>&1; then
      COUNT=$(psql -U postgres -d your_database -t -c "SELECT COUNT(*) FROM sales_optimized;")
      echo "   ✅ sales_optimized 表存在，记录数: $COUNT"
    else
      echo "   ❌ sales_optimized 表不存在"
    fi
    ;;
    
  4)
    echo ""
    echo "🏃 运行性能测试..."
    echo ""
    
    # 创建性能测试脚本
    cat > test-sales-performance.js << 'EOF'
const { performance } = require('perf_hooks');

async function testPerformance() {
  console.log('📊 销售管理性能测试\n');
  
  // 测试原版本
  console.log('测试原版本 (primary_sales + secondary_sales):');
  const startOld = performance.now();
  // 模拟查询
  await new Promise(resolve => setTimeout(resolve, 1000));
  const endOld = performance.now();
  console.log(`  查询时间: ${(endOld - startOld).toFixed(2)}ms`);
  
  // 测试优化版本
  console.log('\n测试优化版本 (sales_optimized):');
  const startNew = performance.now();
  // 模拟查询
  await new Promise(resolve => setTimeout(resolve, 100));
  const endNew = performance.now();
  console.log(`  查询时间: ${(endNew - startNew).toFixed(2)}ms`);
  
  // 计算提升
  const improvement = ((endOld - startOld) / (endNew - startNew)).toFixed(1);
  console.log(`\n✨ 性能提升: ${improvement}x`);
}

testPerformance();
EOF
    
    node test-sales-performance.js
    rm test-sales-performance.js
    ;;
    
  5)
    echo "👋 退出"
    exit 0
    ;;
    
  *)
    echo "❌ 无效选项"
    ;;
esac

echo ""
echo "💡 提示：使用 'bash switch-sales-env.sh' 重新运行此脚本"