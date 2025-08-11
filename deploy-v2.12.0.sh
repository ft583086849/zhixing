#!/bin/bash

# v2.12.0 佣金系统改进部署脚本
# 日期：2025-01-07

echo "======================================"
echo "  v2.12.0 佣金系统改进部署"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误：请在项目根目录执行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 部署内容：${NC}"
echo "1. 后端API - 添加佣金拆分计算"
echo "2. 一级销售对账页面 - 添加佣金明细"
echo "3. 销售管理页面 - 拆分订单和佣金显示"
echo "4. 订单管理页面 - 区分直销和分销佣金"
echo ""

# 确认部署
read -p "确认开始部署？(y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}部署已取消${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[1/5] 检查代码状态...${NC}"
git status --short

echo ""
echo -e "${GREEN}[2/5] 添加所有修改...${NC}"
git add .

echo ""
echo -e "${GREEN}[3/5] 提交代码...${NC}"
git commit -m "feat: v2.12.0 佣金系统改进 - 区分直销和分销

- 后端API添加佣金拆分计算
- 一级销售对账页面添加佣金明细
- 销售管理页面拆分订单金额和佣金显示
- 订单管理页面区分一级直销和二级分销佣金
- 实现字段对齐逻辑，让收益构成一目了然"

echo ""
echo -e "${GREEN}[4/5] 推送到远程仓库...${NC}"
git push

echo ""
echo -e "${GREEN}[5/5] 等待Vercel自动部署...${NC}"
echo "请访问 Vercel 控制台查看部署进度"
echo "部署完成后，请执行以下操作："
echo ""
echo -e "${YELLOW}📌 部署后检查清单：${NC}"
echo "1. 清除Vercel缓存"
echo "2. 清除浏览器缓存"
echo "3. 检查一级销售对账页面佣金明细"
echo "4. 检查销售管理页面字段显示"
echo "5. 检查订单管理页面佣金拆分"
echo "6. 验证佣金计算逻辑"
echo ""
echo -e "${GREEN}✅ 部署脚本执行完成！${NC}"
echo ""
echo "如需回滚，请执行："
echo "git revert HEAD && git push"
