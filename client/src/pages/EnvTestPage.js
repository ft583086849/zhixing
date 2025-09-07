import React from 'react';
import { Card, Descriptions, Tag, Alert, Button, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

/**
 * 环境变量测试页面
 * 用于验证Vercel上的环境变量是否正确配置
 */
const EnvTestPage = () => {
  // 检查环境变量
  const envVars = {
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    REACT_APP_ENV: process.env.REACT_APP_ENV,
    NODE_ENV: process.env.NODE_ENV,
  };

  // 检查硬编码值（用于对比）
  const hardcodedValues = {
    supabaseUrl: 'https://mbqjkpqnjnrwzuafgqed.supabase.co',
    // 只显示密钥前缀，避免完整暴露
    supabaseKeyPrefix: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  };

  // 检查环境变量状态
  const getStatus = (value) => {
    if (!value) return { status: 'error', text: '未配置', color: 'error' };
    if (value === 'undefined') return { status: 'error', text: '未定义', color: 'error' };
    return { status: 'success', text: '已配置', color: 'success' };
  };

  // 测试Supabase连接
  const testSupabaseConnection = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const url = envVars.REACT_APP_SUPABASE_URL || hardcodedValues.supabaseUrl;
      const key = envVars.REACT_APP_SUPABASE_ANON_KEY || 'test-key';
      
      if (!url || !key || key === 'test-key') {
        alert('环境变量未正确配置，无法测试连接');
        return;
      }

      const supabase = createClient(url, key);
      const { data, error } = await supabase.from('admins').select('count', { count: 'exact', head: true });
      
      if (error) {
        alert(`连接失败: ${error.message}`);
      } else {
        alert('✅ Supabase连接成功！');
      }
    } catch (error) {
      alert(`测试失败: ${error.message}`);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card title="🔧 环境变量配置检查" extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refreshPage}>刷新</Button>
          <Tag color={process.env.NODE_ENV === 'production' ? 'green' : 'blue'}>
            {process.env.NODE_ENV || 'development'}
          </Tag>
        </Space>
      }>
        <Alert
          message="环境变量测试页面"
          description="此页面用于验证Vercel环境变量是否正确配置。部署后访问此页面查看配置状态。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Descriptions bordered column={1}>
          <Descriptions.Item label="REACT_APP_SUPABASE_URL">
            <Space>
              {envVars.REACT_APP_SUPABASE_URL ? (
                <>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>{envVars.REACT_APP_SUPABASE_URL}</span>
                  {envVars.REACT_APP_SUPABASE_URL === hardcodedValues.supabaseUrl && (
                    <Tag color="warning">与硬编码值相同</Tag>
                  )}
                </>
              ) : (
                <>
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  <span style={{ color: '#999' }}>未配置</span>
                  <Tag color="error">需要配置</Tag>
                </>
              )}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="REACT_APP_SUPABASE_ANON_KEY">
            <Space>
              {envVars.REACT_APP_SUPABASE_ANON_KEY ? (
                <>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>
                    {envVars.REACT_APP_SUPABASE_ANON_KEY.substring(0, 20)}...
                    {envVars.REACT_APP_SUPABASE_ANON_KEY.substring(envVars.REACT_APP_SUPABASE_ANON_KEY.length - 10)}
                  </span>
                  <Tag color="success">已配置</Tag>
                  {envVars.REACT_APP_SUPABASE_ANON_KEY.startsWith(hardcodedValues.supabaseKeyPrefix) && (
                    <Tag color="warning">JWT格式正确</Tag>
                  )}
                </>
              ) : (
                <>
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  <span style={{ color: '#999' }}>未配置</span>
                  <Tag color="error">需要配置</Tag>
                </>
              )}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="REACT_APP_API_URL">
            <Space>
              {envVars.REACT_APP_API_URL ? (
                <>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>{envVars.REACT_APP_API_URL}</span>
                </>
              ) : (
                <>
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  <span style={{ color: '#999' }}>未配置（可选）</span>
                </>
              )}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="REACT_APP_ENV">
            <Space>
              {envVars.REACT_APP_ENV ? (
                <>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Tag color={envVars.REACT_APP_ENV === 'production' ? 'green' : 'blue'}>
                    {envVars.REACT_APP_ENV}
                  </Tag>
                </>
              ) : (
                <>
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  <span style={{ color: '#999' }}>未配置（可选）</span>
                </>
              )}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="NODE_ENV">
            <Tag color={envVars.NODE_ENV === 'production' ? 'green' : 'blue'}>
              {envVars.NODE_ENV || 'development'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" onClick={testSupabaseConnection}>
              测试Supabase连接
            </Button>
          </Space>
        </div>

        <Alert
          message="配置说明"
          description={
            <ul>
              <li>在Vercel Dashboard &gt; Settings &gt; Environment Variables 中配置</li>
              <li>配置后需要重新部署才能生效</li>
              <li>REACT_APP_ 前缀是必须的</li>
              <li>配置完成后，可以开始使用 supabase-safe.js 替换原有配置</li>
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginTop: 24 }}
        />

        {(!envVars.REACT_APP_SUPABASE_URL || !envVars.REACT_APP_SUPABASE_ANON_KEY) && (
          <Alert
            message="下一步操作"
            description={
              <div>
                <p>检测到环境变量未完全配置，请按以下步骤操作：</p>
                <ol>
                  <li>登录 Vercel Dashboard</li>
                  <li>进入项目设置 Settings → Environment Variables</li>
                  <li>添加以下变量：
                    <ul>
                      <li>REACT_APP_SUPABASE_URL = https://mbqjkpqnjnrwzuafgqed.supabase.co</li>
                      <li>REACT_APP_SUPABASE_ANON_KEY = [你的Supabase Anon Key]</li>
                    </ul>
                  </li>
                  <li>重新部署项目</li>
                  <li>刷新此页面验证配置</li>
                </ol>
              </div>
            }
            type="error"
            showIcon
            style={{ marginTop: 24 }}
          />
        )}

        {envVars.REACT_APP_SUPABASE_URL && envVars.REACT_APP_SUPABASE_ANON_KEY && (
          <Alert
            message="✅ 环境变量配置完成"
            description="现在可以安全地开始使用 supabase-safe.js 替换原有的硬编码配置了。建议先在一个测试页面验证，确认无误后再批量替换。"
            type="success"
            showIcon
            style={{ marginTop: 24 }}
          />
        )}
      </Card>
    </div>
  );
};

export default EnvTestPage;