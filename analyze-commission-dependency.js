/**
 * 分析 commission_amount 字段的依赖情况
 * 确定是否可以停用旧字段
 */

const fs = require('fs');
const path = require('path');

function analyzeCommissionDependency() {
  console.log('分析 commission_amount 字段依赖情况');
  console.log('=====================================\n');

  const results = {
    critical_dependencies: [],    // 关键依赖，不能移除
    minor_dependencies: [],       // 次要依赖，可以替换
    already_migrated: [],         // 已迁移到新字段
    stats_impact: []             // 统计功能影响
  };

  // 需要检查的关键文件和功能
  const criticalFiles = [
    'client/src/services/supabase.js',          // 核心数据服务
    'client/src/services/api.js',               // API服务
    'client/src/components/admin/AdminFinance.js',      // 财务管理
    'client/src/components/admin/AdminOverview.js',     // 概览页面
    'client/src/components/admin/AdminSalesOptimized.js' // 新版销售
  ];

  criticalFiles.forEach(filePath => {
    try {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // 查找 commission_amount 使用情况
        const commissionAmountUsage = [];
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes('commission_amount') && 
              !line.includes('primary_commission_amount') && 
              !line.includes('secondary_commission_amount')) {
            commissionAmountUsage.push({
              line: index + 1,
              content: line.trim(),
              context: getContext(lines, index)
            });
          }
        });

        if (commissionAmountUsage.length > 0) {
          console.log(`\n📁 ${filePath}:`);
          console.log(`   发现 ${commissionAmountUsage.length} 处使用 commission_amount\n`);
          
          commissionAmountUsage.forEach(usage => {
            console.log(`   第${usage.line}行: ${usage.content}`);
            
            // 分析使用场景
            if (usage.content.includes('getOrderStats') || 
                usage.content.includes('totalCommission') ||
                usage.content.includes('reduce')) {
              results.stats_impact.push({
                file: filePath,
                line: usage.line,
                usage: usage.content,
                impact: '统计计算'
              });
            } else if (usage.content.includes('dataIndex') || 
                       usage.content.includes('render')) {
              results.minor_dependencies.push({
                file: filePath,
                line: usage.line,
                usage: usage.content,
                impact: '界面显示'
              });
            } else {
              results.critical_dependencies.push({
                file: filePath,
                line: usage.line,
                usage: usage.content,
                impact: '核心逻辑'
              });
            }
          });
        } else {
          results.already_migrated.push(filePath);
        }
      }
    } catch (error) {
      console.log(`   ❌ 无法读取文件: ${error.message}`);
    }
  });

  // 生成分析报告
  console.log('\n📊 依赖分析报告');
  console.log('==================\n');

  console.log('🔴 关键依赖 (不能立即移除):');
  if (results.critical_dependencies.length > 0) {
    results.critical_dependencies.forEach(dep => {
      console.log(`   ${dep.file}:${dep.line} - ${dep.impact}`);
    });
  } else {
    console.log('   无关键依赖');
  }

  console.log('\n🟡 次要依赖 (可以替换):');
  if (results.minor_dependencies.length > 0) {
    results.minor_dependencies.forEach(dep => {
      console.log(`   ${dep.file}:${dep.line} - ${dep.impact}`);
    });
  } else {
    console.log('   无次要依赖');
  }

  console.log('\n🟠 统计功能影响:');
  if (results.stats_impact.length > 0) {
    results.stats_impact.forEach(impact => {
      console.log(`   ${impact.file}:${impact.line} - ${impact.impact}`);
    });
  } else {
    console.log('   统计功能未使用旧字段');
  }

  console.log('\n✅ 已迁移文件:');
  if (results.already_migrated.length > 0) {
    results.already_migrated.forEach(file => {
      console.log(`   ${file}`);
    });
  }

  // 迁移建议
  console.log('\n📋 迁移建议');
  console.log('============\n');

  const totalDeps = results.critical_dependencies.length + 
                   results.minor_dependencies.length + 
                   results.stats_impact.length;

  if (totalDeps === 0) {
    console.log('🎉 可以立即停用 commission_amount 字段！');
    console.log('   所有功能已迁移到新字段系统');
  } else if (results.critical_dependencies.length === 0) {
    console.log('⚡ 可以计划停用 commission_amount 字段');
    console.log(`   需要先处理 ${results.minor_dependencies.length + results.stats_impact.length} 个非关键依赖`);
  } else {
    console.log('⚠️  暂不可停用 commission_amount 字段');
    console.log(`   存在 ${results.critical_dependencies.length} 个关键依赖需要先迁移`);
  }
}

// 获取代码上下文
function getContext(lines, index) {
  const start = Math.max(0, index - 2);
  const end = Math.min(lines.length, index + 3);
  return lines.slice(start, end).join('\n');
}

// 执行分析
analyzeCommissionDependency();