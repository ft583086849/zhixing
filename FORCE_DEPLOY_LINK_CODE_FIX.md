# 🚀 强制部署link_code修复

**时间**: 2025年8月4日 19:20  
**Commit**: 5f11c7b  
**问题**: Vercel未部署link_code字段修复  

## 修复内容
- 添加link_code字段到orders INSERT语句
- 使用sales_code作为link_code兼容值
- 解决"Field 'link_code' doesn't have a default value"错误

**强制触发Vercel部署**