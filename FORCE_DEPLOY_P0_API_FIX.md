# 强制部署P0 API修复

时间: 2025-01-05 18:30
修复内容: 添加primary-sales API的update-commission路径支持

## 修改文件
- `api/primary-sales.js`: 添加handleUpdateSecondarySalesCommission函数和路由

## 问题
- 一级销售设置二级销售佣金的API路径404
- 前端调用PUT /api/primary-sales?path=update-commission失败

## 解决方案
- 实现了完整的update-commission路径处理
- 添加了参数验证和错误处理
- 支持佣金比率更新到数据库

强制触发Vercel重新部署和清除缓存。