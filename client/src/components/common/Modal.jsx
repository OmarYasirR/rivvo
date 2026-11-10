import React from 'react';
import { IoClose } from 'react-icons/io5';

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--surface)', color: 'var(--text)', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: '90vw' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><IoClose size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
