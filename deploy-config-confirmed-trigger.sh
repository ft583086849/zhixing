#!/bin/bash

# v2.11.0 - config_confirmed字段自动同步触发器部署脚本
# 确保orders表的config_confirmed字段与status字段保持同步

echo "=========================================="
echo "📋 v2.11.0 config_confirmed触发器部署"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📝 部署内容：${NC}"
echo "1. 同步现有数据的config_confirmed字段"
echo "2. 创建自动同步触发器"
echo "3. 验证数据一致性"
echo ""

echo -e "${GREEN}✅ 准备部署文件：${NC}"
echo "- 🔧创建config_confirmed自动同步触发器.sql"
echo ""

echo -e "${YELLOW}⚠️  注意事项：${NC}"
echo "1. 此操作会创建数据库触发器"
echo "2. 触发器会自动同步config_confirmed字段"
echo "3. 不需要修改任何前端代码"
echo ""

read -p "是否继续部署？(y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}❌ 部署已取消${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}📦 部署步骤：${NC}"
echo ""

echo "1️⃣  请在Supabase SQL编辑器中执行："
echo "   🔧创建config_confirmed自动同步触发器.sql"
echo ""

echo "2️⃣  验证数据一致性："
echo "   执行以下SQL确认："
cat << 'EOF'
   SELECT 
       CASE 
           WHEN COUNT(*) FILTER (WHERE 
               config_confirmed IS DISTINCT FROM (status IN ('confirmed', 'confirmed_configuration', 'confirmed_config', 'active'))
           ) = 0 
           THEN '✅ 所有数据一致性检查通过！'
           ELSE '❌ 发现不一致数据，请检查！'
       END as validation_result
   FROM orders;
EOF
echo ""

echo "3️⃣  验证触发器创建成功："
cat << 'EOF'
   SELECT tgname as trigger_name
   FROM pg_trigger 
   WHERE tgrelid = 'orders'::regclass
   AND tgname = 'sync_config_confirmed_trigger';
EOF
echo ""

echo -e "${GREEN}✅ 部署后效果：${NC}"
echo "• status改变时，config_confirmed自动同步"
echo "• 销售统计视图数据准确性提升"
echo "• 无需人工维护数据一致性"
echo ""

echo -e "${YELLOW}📊 验证清单：${NC}"
echo "□ SQL脚本执行成功"
echo "□ 数据一致性验证通过"
echo "□ 触发器创建成功"
echo "□ 测试订单状态更新正常"
echo ""

echo -e "${GREEN}🎉 部署准备完成！${NC}"
echo "请按照上述步骤在Supabase中执行SQL脚本。"
echo ""

# 记录部署
echo "部署记录：" >> deployment.log
echo "时间：$(date)" >> deployment.log
echo "版本：v2.11.0 - config_confirmed触发器" >> deployment.log
echo "---" >> deployment.log
