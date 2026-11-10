import React from 'react';

const Skeleton = ({ width = '100%', height = 16, radius = 6 }) => (
  <div
    className="skeleton"
    style={{
      width,
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg,var(--skeleton-a) 25%,var(--skeleton-b) 37%,var(--skeleton-a) 63%)',
      backgroundSize: '400% 100%',
      animation: 'shimmer 1.4s ease infinite',
    }}
  >
    <style>{`@keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }`}</style>
  </div>
);

export default Skeleton;
