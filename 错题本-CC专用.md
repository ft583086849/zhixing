# 错题本 - Claude Code专用

## 2025-08-15 - Supabase配置导入错误

### 问题描述
Vercel部署失败，报错：
```
Attempted import error: '../config/supabase' does not contain a default export (imported as 'supabaseOld').
```

### 根本原因
- `client/src/config/supabase.js`使用的是命名导出：`export const supabase`
- `TestSafeConfigPage.js`错误地使用了默认导入：`import supabaseOld from '../config/supabase'`

### 解决方案
修改导入语句为命名导入：
```javascript
// 错误的写法
import supabaseOld from '../config/supabase';

// 正确的写法
import { supabase as supabaseOld } from '../config/supabase';
```

### 影响文件
- `/Users/zzj/Documents/w/client/src/pages/TestSafeConfigPage.js`

### 经验教训
1. 在导入模块前，先检查导出方式（默认导出 vs 命名导出）
2. TypeScript能避免这类错误
3. 本地测试时应该运行`npm run build`确保编译通过

### 预防措施
- 统一项目中的导出风格
- 添加ESLint规则检查导入/导出
- 部署前本地构建测试

---

## 导入导出速查表

### 默认导出/导入
```javascript
// 导出
export default supabase;
// 或
const supabase = ...;
export default supabase;

// 导入
import supabase from './config/supabase';
```

### 命名导出/导入
```javascript
// 导出
export const supabase = ...;
// 或
const supabase = ...;
export { supabase };

// 导入
import { supabase } from './config/supabase';
// 或重命名
import { supabase as mySupabase } from './config/supabase';
```

### 混合导出/导入
```javascript
// 导出
export default mainThing;
export const otherThing = ...;

// 导入
import mainThing, { otherThing } from './module';
```