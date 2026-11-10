import React from 'react';
import Modal from './Modal';
import { useLanguage } from '../../context/LanguageContext';

// Generic "are you sure?" dialog. `danger` paints the confirm button red.
const ConfirmModal = ({ open, title, message, confirmLabel, busy = false, error = '', danger = true, onConfirm, onClose }) => {
  const { t } = useLanguage();
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={title}>
      <p className="confirm-text">{message}</p>
      {error && <p className="error">{error}</p>}
      <div className="confirm-actions">
        <button type="button" className="confirm-btn" onClick={onClose} disabled={busy}>{t('cancel')}</button>
        <button type="button" className={`confirm-btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
