/**
 * 身份验证服务
 * 统一管理用户登录、登出、权限验证
 */

import { SupabaseService } from './supabase';

export class AuthService {
  
  /**
   * 管理员登录
   */
  static async login(username, password) {
    try {
      // 查询管理员用户
      const admin = await SupabaseService.getAdminByUsername(username);
      
      if (!admin) {
        throw new Error('用户名或密码错误');
      }
      
      // 简化密码验证（实际项目中应使用bcrypt等加密库）
      if (admin.password_hash !== password) {
        throw new Error('用户名或密码错误');
      }
      
      // 生成简单token（实际项目中使用JWT）
      const token = btoa(JSON.stringify({
        id: admin.id,
        username: admin.username,
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24小时
      }));
      
      // 保存到本地存储
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify({
        id: admin.id,
        username: admin.username
      }));
      
      return {
        success: true,
        token,
        user: {
          id: admin.id,
          username: admin.username
        }
      };
    } catch (error) {
      throw new Error(error.message || '登录失败');
    }
  }
  
  /**
   * 登出
   */
  static logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/#/admin';
  }
  
  /**
   * 验证token有效性
   */
  static verifyToken() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        return { valid: false, reason: 'No token' };
      }
      
      const decoded = JSON.parse(atob(token));
      const now = Date.now();
      
      // 检查是否过期
      if (decoded.expires && decoded.expires < now) {
        this.logout();
        return { valid: false, reason: 'Token expired' };
      }
      
      // 检查token是否在24小时内
      if (now - decoded.timestamp > (24 * 60 * 60 * 1000)) {
        this.logout();
        return { valid: false, reason: 'Token too old' };
      }
      
      return { 
        valid: true, 
        user: {
          id: decoded.id,
          username: decoded.username
        }
      };
    } catch (error) {
      this.logout();
      return { valid: false, reason: 'Invalid token' };
    }
  }
  
  /**
   * 获取当前用户
   */
  static getCurrentUser() {
    try {
      const userStr = localStorage.getItem('admin_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * 检查是否已登录
   */
  static isAuthenticated() {
    const verification = this.verifyToken();
    return verification.valid;
  }
  
  /**
   * 获取认证头（如果需要）
   */
  static getAuthHeader() {
    const token = localStorage.getItem('admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  
  /**
   * 注册新管理员（仅限开发环境）
   */
  static async register(username, password) {
    try {
      const adminData = {
        username,
        password_hash: password, // 实际项目中应加密
        created_at: new Date().toISOString()
      };
      
      const newAdmin = await SupabaseService.createAdmin(adminData);
      
      return {
        success: true,
        admin: {
          id: newAdmin.id,
          username: newAdmin.username
        }
      };
    } catch (error) {
      if (error.code === '23505') { // unique_violation
        throw new Error('用户名已存在');
      }
      throw new Error(error.message || '注册失败');
    }
  }
}

console.log('🔐 身份验证服务初始化完成');