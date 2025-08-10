# 🔄 强制清除 Vercel 缓存方法

## 方法1：通过Vercel Dashboard（推荐）
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `zhixing-seven`
3. 进入 Settings → Functions
4. 找到 "Purge Cache" 或 "Clear Cache" 按钮
5. 点击清除所有缓存

## 方法2：重新部署并跳过缓存
```bash
# 添加空commit强制重新部署
git commit --allow-empty -m "chore: force vercel rebuild and clear cache"
git push origin main
```

## 方法3：通过环境变量强制重建
1. Vercel Dashboard → Settings → Environment Variables
2. 添加或修改任意环境变量（如 `CACHE_VERSION=v2`)
3. 触发重新部署

## 方法4：使用Vercel CLI（需要安装）
```bash
# 安装Vercel CLI（如果没有）
npm i -g vercel

# 登录
vercel login

# 强制重新部署
vercel --force

# 或指定项目
vercel --force --prod
```

## 方法5：URL参数清除浏览器缓存
访问时添加时间戳参数：
```
https://zhixing-seven.vercel.app/sales-reconciliation?v=1234567890
```

## 方法6：浏览器端强制刷新
- Windows/Linux: `Ctrl + Shift + R` 或 `Ctrl + F5`
- Mac: `Cmd + Shift + R`
- 或打开开发者工具，右键刷新按钮选择"硬性重新加载"

## 🎯 最有效的组合方案
1. 先在Vercel Dashboard清除服务端缓存
2. 然后用方法2创建空commit触发完全重建
3. 最后用浏览器硬刷新确保客户端也更新

## ⚠️ 注意事项
- Vercel Edge Network缓存可能需要几分钟才能完全清除
- CDN节点可能有延迟，不同地区清除时间不同
- 建议等待5分钟后再验证
