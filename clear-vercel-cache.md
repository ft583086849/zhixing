# 清空 Vercel 缓存的方法

## 方法1：通过Vercel Dashboard（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `zhixing-seven`
3. 进入 Settings → Functions
4. 点击 "Purge All" 清空缓存
5. 或进入 Settings → Data Cache
6. 点击 "Purge Everything"

## 方法2：触发强制重新部署

在 Vercel Dashboard 中：
1. 进入 Deployments 页面
2. 点击最新部署右侧的三个点 "..."
3. 选择 "Redeploy"
4. 勾选 "Use existing Build Cache" 为 **不勾选**
5. 点击 "Redeploy"

## 方法3：通过空提交触发

```bash
git commit --allow-empty -m "chore: 清空Vercel缓存"
git push origin main
```

## 方法4：通过环境变量

1. 在 Vercel Dashboard → Settings → Environment Variables
2. 添加或修改任意变量（如 `CACHE_VERSION`）
3. 修改值会触发完全重新部署

## 🔧 本次部署说明

- 部署版本：v2.10.3
- 修复问题：
  - ✅ Top5销售排行榜显示
  - ✅ 佣金计算准确性
  - ✅ 待配置订单筛选
  - ✅ 销售创建时间显示
  - ✅ 客户管理排序

## ⏱️ 预计部署时间

- 构建时间：2-3分钟
- 生效时间：部署成功后立即生效
- CDN缓存：可能需要额外1-2分钟完全清除

## 🔍 验证部署

部署完成后，请验证：
1. Dashboard的Top5销售排行榜有数据显示
2. 点击待配置确认订单能看到相应订单
3. 销售管理页面创建时间正确显示
4. 客户管理按最新订单时间排序
5. WML792355703的应返佣金额正确计算
