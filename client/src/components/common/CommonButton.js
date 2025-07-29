
import React from 'react';
import { Button } from 'antd';

const CommonButton = ({ 
  type = 'primary', 
  size = 'middle', 
  loading = false, 
  disabled = false,
  icon,
  children,
  onClick,
  style = {},
  className = '',
  ...props 
}) => {
  return (
    <Button
      type={type}
      size={size}
      loading={loading}
      disabled={disabled}
      icon={icon}
      onClick={onClick}
      style={style}
      className={`common-button ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
};

export default CommonButton;
