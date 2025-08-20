#!/bin/bash
# 使用psql执行数据库更改
# 仅在测试环境执行

DATABASE_URL="undefined"

if [ -z "$DATABASE_URL" ]; then
    echo "❌ 未找到数据库连接信息"
    echo "请设置 DATABASE_URL 环境变量"
    exit 1
fi

echo "🚀 开始执行数据库更改..."
echo "⚠️  确认这是测试环境！"
read -p "输入 'yes' 继续: " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 1
fi

psql "$DATABASE_URL" < database/add-fields-indexes-generated.sql

echo "✅ 数据库更改执行完成"
