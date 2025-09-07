// 安全的Supabase配置（兼容环境变量和硬编码）
import { createClient } from '@supabase/supabase-js';

// 优先使用环境变量，如果没有则使用现有的硬编码（保证线上不断）
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://mbqjkpqnjnrwzuafgqed.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icWprcHFuam5yd3p1YWZncWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwNTg0NTgsImV4cCI6MjA0ODYzNDQ1OH0.d5xoIDAJx0TR4KnBiFiWSRGDZqCPcVdZBe0G2x2hVlE';

// 开发环境提示
if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn('⚠️ 使用硬编码的Supabase密钥，建议配置环境变量');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
export { supabaseUrl, supabaseAnonKey };