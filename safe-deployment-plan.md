# 🛡️ 安全部署方案

## 第一步：本地测试（不影响线上）

### 1. 创建本地测试环境
```bash
# 1. 复制环境变量文件
cp client/.env.example client/.env.local

# 2. 填入实际的Supabase密钥
# 编辑 client/.env.local 文件

# 3. 本地启动测试
cd client
npm start
```

### 2. 测试兼容性
- ✅ 测试现有功能是否正常
- ✅ 测试一级销售功能
- ✅ 测试API调用

## 第二步：灰度发布（最小风险）

### 方案A：使用环境变量（推荐）
1. **先在Vercel配置环境变量**（不影响现有代码）
   ```
   登录Vercel控制台
   Settings > Environment Variables
   添加：
   - REACT_APP_SUPABASE_URL
   - REACT_APP_SUPABASE_ANON_KEY
   ```

2. **修改一个测试文件验证**
   ```javascript
   // 先只修改一个不重要的文件测试
   import supabase from '../config/supabase-safe';
   ```

3. **确认无问题后批量替换**

### 方案B：功能开关方式
```javascript
// 添加功能开关
const USE_SAFE_CONFIG = process.env.REACT_APP_USE_SAFE_CONFIG === 'true';

// 根据开关选择配置
const supabase = USE_SAFE_CONFIG 
  ? require('./config/supabase-safe').default
  : require('./config/supabase').default;
```

## 第三步：逐步替换（分批上线）

### 批次1：修复最紧急的安全问题
1. 替换硬编码的API密钥
2. 测试2-3天

### 批次2：修复primary_sales表问题
1. 使用兼容层替换直接调用
2. 监控错误日志
3. 测试1周

### 批次3：其他优化
1. 清理console.log
2. 优化大文件
3. 性能改进

## 监控和回滚方案

### 监控指标
- ❗ 错误率变化
- ❗ API调用成功率
- ❗ 页面加载时间
- ❗ 用户反馈

### 快速回滚
```bash
# 如果出现问题，立即回滚
git revert HEAD
git push origin main

# 或在Vercel控制台
# Deployments > 选择上一个稳定版本 > Promote to Production
```

## 时间安排建议

| 阶段 | 时间 | 内容 | 风险等级 |
|-----|------|------|---------|
| Day 1 | 上午 | 撤销GitHub Token，创建兼容文件 | 零风险 |
| Day 1 | 下午 | 本地测试兼容性 | 零风险 |
| Day 2 | 上午 | Vercel配置环境变量 | 低风险 |
| Day 2 | 下午 | 部署supabase-safe.js | 低风险 |
| Day 3-5 | - | 监控观察 | - |
| Day 6 | - | 部署primary_sales兼容层 | 中风险 |
| Day 7-10 | - | 逐步替换其他问题 | 低风险 |

## 紧急联系和处理

### 如果出现问题：
1. **立即回滚**到上一个版本
2. **检查错误日志**
3. **通知相关人员**
4. **记录问题原因**

### 成功标志：
- ✅ 错误率不增加
- ✅ 所有功能正常
- ✅ 性能不下降
- ✅ 无用户投诉

## 测试检查清单

### 功能测试
- [ ] 登录功能
- [ ] 订单创建
- [ ] 销售管理
- [ ] 一级销售功能
- [ ] 二级销售功能
- [ ] 佣金计算
- [ ] 数据统计
- [ ] 支付功能

### 兼容性测试
- [ ] Chrome浏览器
- [ ] Safari浏览器
- [ ] 移动端
- [ ] 不同网络环境

### 性能测试
- [ ] 页面加载速度
- [ ] API响应时间
- [ ] 数据查询效率

---

**记住：宁可慢，不可错！每一步都要验证后再进行下一步。**