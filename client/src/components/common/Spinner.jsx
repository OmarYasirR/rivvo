import React from 'react';

const Spinner = ({ size = 24, centered = false, className = '', borderTopColor= '#6366F1' }) => {
  const el = (
    <div
      className="spinner"
      style={{
        width: size,
        height: size,
        border: '3px solid var(--border)',
        borderTopColor: borderTopColor,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!centered) return el;

  return (
    <div className={`spinner-centered ${className}`.trim()}>
      {el}
    </div>
  );
};

export default Spinner;