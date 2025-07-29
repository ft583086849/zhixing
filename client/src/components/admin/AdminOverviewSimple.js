import React from 'react';

const AdminOverviewSimple = () => {
  console.log('🔍 AdminOverviewSimple: 组件开始渲染');

  return (
    <div>
      <div style={{
        background: '#ff6b6b',
        color: 'white',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '8px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '18px'
      }}>
        🔥 简化测试组件 - 如果你看到这个，说明组件渲染正常！
      </div>

      <div style={{
        background: '#4CAF50',
        color: 'white',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        ✅ 组件渲染成功！
        <br />
        这说明基本的React渲染没有问题
      </div>

      <div style={{
        background: '#2196F3',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        📊 数据概览页面
        <br />
        简化版本 - 用于测试渲染
      </div>
    </div>
  );
};

export default AdminOverviewSimple; 