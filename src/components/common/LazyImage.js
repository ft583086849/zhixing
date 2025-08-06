
import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from 'antd';

const LazyImage = ({ 
  src, 
  alt, 
  width = '100%', 
  height = 'auto',
  placeholder = <Skeleton.Image active />,
  className = '',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error('图片加载失败:', src);
    setIsLoaded(true); // 即使失败也显示占位符
  };

  return (
    <div ref={imgRef} style={{ width, height }} className={`lazy-image-container ${className}`}>
      {!isLoaded && placeholder}
      {isInView && (
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: isLoaded ? 'block' : 'none'
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
