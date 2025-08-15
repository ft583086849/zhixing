// 安全的Supabase配置（兼容环境变量和硬编码）
import { createClient } from '@supabase/supabase-js';

// 优先使用环境变量，如果没有则使用现有的硬编码（保证线上不断）
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://itvmeamoqthfqtkpubdv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dm1lYW1vcXRoZnF0a3B1YmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODEyMzUsImV4cCI6MjA3MDA1NzIzNX0.ypBF3lJJTJtSPLEu1zWXqPorS-FDSZzRUy_0ge_Y-r0';

// 开发环境提示
if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn('⚠️ 使用硬编码的Supabase密钥，建议配置环境变量');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
export { supabaseUrl, supabaseAnonKey };