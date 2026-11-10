import React from 'react';

const VARIANTS = {
  primary: { background: 'linear-gradient(90deg,#6366F1,#EC4899)', color: '#fff', border: 'none' },
  secondary: { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' },
  ghost: { background: 'transparent', color: 'var(--color-secondary)', border: 'none' },
};

const Button = ({ children, variant = 'primary', onClick, type = 'button', disabled, ...rest }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      ...VARIANTS[variant],
      padding: '10px 18px',
      borderRadius: 8,
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    }}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
