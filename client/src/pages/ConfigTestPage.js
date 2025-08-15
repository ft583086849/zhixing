import React, { useState } from 'react';
import { Card, Button, Alert, Descriptions, Tag, Space, message, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SafetyOutlined } from '@ant-design/icons';

const { Text } = Typography;

// 使用新的安全配置（有环境变量回退机制）
import supabase from '../config/supabase-safe';

/**
 * 配置测试页面 - 零风险测试
 * 这个页面专门用来验证 supabase-safe.js 配置是否正常工作
 */
const ConfigTestPage = () => {
  const [testResults, setTestResults] = useState({
    connection: null,
    query: null,
    auth: null
  });
  const [loading, setLoading] = useState(false);

  // 测试1：基础连接
  const testConnection = async () => {
    try {
      const { error } = await supabase
        .from('admins')
        .select('count', { count: 'exact', head: true });
      
      return { 
        success: !error, 
        message: error ? error.message : '连接成功',
        detail: '测试表：admins'
      };
    } catch (err) {
      return { 
        success: false, 
        message: err.message,
        detail: '连接失败'
      };
    }
  };

  // 测试2：查询功能
  const testQuery = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_config')
        .select('*')
        .limit(1);
      
      return { 
        success: !error && data !== null, 
        message: error ? error.message : `查询成功，返回${data?.length || 0}条数据`,
        detail: '测试表：payment_config'
      };
    } catch (err) {
      return { 
        success: false, 
        message: err.message,
        detail: '查询失败'
      };
    }
  };

  // 测试3：认证相关
  const testAuth = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('username')
        .eq('username', '知行')
        .single();
      
      return { 
        success: !error, 
        message: error ? error.message : '认证表访问正常',
        detail: data ? `找到管理员：${data.username}` : '查询成功'
      };
    } catch (err) {
      return { 
        success: false, 
        message: err.message,
        detail: '认证测试失败'
      };
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setLoading(true);
    message.loading('正在运行测试...', 0);

    try {
      const [connectionResult, queryResult, authResult] = await Promise.all([
        testConnection(),
        testQuery(),
        testAuth()
      ]);

      setTestResults({
        connection: connectionResult,
        query: queryResult,
        auth: authResult
      });

      message.destroy();
      
      // 判断整体结果
      if (connectionResult.success && queryResult.success && authResult.success) {
        message.success('🎉 所有测试通过！配置正常工作');
      } else {
        message.warning('部分测试未通过，请检查详情');
      }
    } catch (error) {
      message.destroy();
      message.error('测试过程出错：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 计算通过的测试数
  const passedTests = Object.values(testResults).filter(r => r?.success).length;
  const totalTests = Object.keys(testResults).filter(k => testResults[k] !== null).length;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card 
        title={
          <Space>
            <SafetyOutlined />
            <span>安全配置测试（使用 supabase-safe.js）</span>
          </Space>
        }
        extra={
          <Space>
            {totalTests > 0 && (
              <Tag color={passedTests === totalTests ? 'success' : 'warning'}>
                {passedTests}/{totalTests} 测试通过
              </Tag>
            )}
            <Button type="primary" onClick={runAllTests} loading={loading}>
              运行测试
            </Button>
          </Space>
        }
      >
        <Alert
          message="零风险测试"
          description={
            <>
              此页面使用 <code>supabase-safe.js</code> 配置（支持环境变量和硬编码回退）。
              如果测试全部通过，说明可以安全地在其他地方使用这个配置。
            </>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Descriptions bordered column={1}>
          <Descriptions.Item label="1. 数据库连接测试">
            {testResults.connection ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  {testResults.connection.success ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  )}
                  <span>{testResults.connection.message}</span>
                </Space>
                <Text type="secondary">{testResults.connection.detail}</Text>
              </Space>
            ) : (
              <span style={{ color: '#999' }}>待测试...</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="2. 查询功能测试">
            {testResults.query ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  {testResults.query.success ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  )}
                  <span>{testResults.query.message}</span>
                </Space>
                <Text type="secondary">{testResults.query.detail}</Text>
              </Space>
            ) : (
              <span style={{ color: '#999' }}>待测试...</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="3. 认证相关测试">
            {testResults.auth ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  {testResults.auth.success ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#f5222d' }} />
                  )}
                  <span>{testResults.auth.message}</span>
                </Space>
                <Text type="secondary">{testResults.auth.detail}</Text>
              </Space>
            ) : (
              <span style={{ color: '#999' }}>待测试...</span>
            )}
          </Descriptions.Item>
        </Descriptions>

        {passedTests === totalTests && totalTests > 0 && (
          <Alert
            message="✅ 配置验证通过"
            description={
              <div>
                <p><strong>下一步操作：</strong></p>
                <ol style={{ marginBottom: 0 }}>
                  <li>这个页面已经在使用 <code>supabase-safe.js</code></li>
                  <li>所有功能正常，说明配置切换是安全的</li>
                  <li>可以开始逐步替换其他文件中的配置引用</li>
                  <li>建议从低流量页面开始，逐步扩展到核心功能</li>
                </ol>
              </div>
            }
            type="success"
            showIcon
            style={{ marginTop: 24 }}
          />
        )}

        <Alert
          message="配置说明"
          description={
            <div>
              <p><strong>supabase-safe.js 的工作原理：</strong></p>
              <ul style={{ marginBottom: 0 }}>
                <li>优先使用环境变量（REACT_APP_SUPABASE_URL 和 REACT_APP_SUPABASE_ANON_KEY）</li>
                <li>如果环境变量不存在，自动回退到硬编码值</li>
                <li>保证了向后兼容，不会破坏现有功能</li>
                <li>你已经在Vercel配置了正确的环境变量，所以会使用环境变量</li>
              </ul>
            </div>
          }
          type="info"
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );
};

export default ConfigTestPage;