#!/bin/bash
# 🔄 回滚脚本 - 恢复到原始orders表

echo "🔄 开始回滚到原始orders表..."

# 恢复所有文件
cp "/Users/zzj/Documents/w/client/src/services/api.js.pre-optimized-backup" "/Users/zzj/Documents/w/client/src/services/api.js" 2>/dev/null && echo "✅ 恢复 api.js"
cp "/Users/zzj/Documents/w/client/src/services/supabase.js.pre-optimized-backup" "/Users/zzj/Documents/w/client/src/services/supabase.js" 2>/dev/null && echo "✅ 恢复 supabase.js"
cp "/Users/zzj/Documents/w/client/src/services/statsUpdater.js.pre-optimized-backup" "/Users/zzj/Documents/w/client/src/services/statsUpdater.js" 2>/dev/null && echo "✅ 恢复 statsUpdater.js"
cp "/Users/zzj/Documents/w/client/src/pages/PurchasePage.js.pre-optimized-backup" "/Users/zzj/Documents/w/client/src/pages/PurchasePage.js" 2>/dev/null && echo "✅ 恢复 PurchasePage.js"

echo ""
echo "🎯 回滚完成！现在使用原始orders表"
echo "📋 下一步："
echo "   1. 重启开发服务器"
echo "   2. 验证功能正常"
