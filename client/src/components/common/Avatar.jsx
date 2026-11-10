import React from 'react';

// Inline placeholder (no external file needed)
const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#6366F1"/><circle cx="50" cy="38" r="18" fill="#fff" fill-opacity=".85"/><path d="M14 92c4-22 20-32 36-32s32 10 36 32z" fill="#fff" fill-opacity=".85"/></svg>'
  );

const Avatar = ({ src, alt = '', size = 40, online = false }) => (
  <span className="avatar" style={{ width: size, height: size, position: 'relative', display: 'inline-block' }}>
    <img
      src={src || DEFAULT_AVATAR}
      alt={alt}
      width={size}
      height={size}
      style={{ borderRadius: '50%', objectFit: 'cover' }}
    />
    {online && (
      <span
        className="avatar-status"
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: '50%',
          background: '#10B981',
          border: '2px solid var(--surface)',
        }}
      />
    )}
  </span>
);

export default Avatar;
