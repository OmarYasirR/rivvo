import React from 'react';

const Spinner = ({ size = 24, borderTopColor= '#6366F1' }) => (
  <div
    className="spinner"
    style={{
      width: size,
      height: size,
      border: '3px solid var(--border)',
      borderTopColor,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default Spinner;
