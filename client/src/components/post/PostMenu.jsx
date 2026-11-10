import React, { useEffect, useRef, useState } from 'react';
import { IoEllipsisHorizontal, IoPencilOutline, IoTrashOutline } from 'react-icons/io5';
import { useLanguage } from '../../context/LanguageContext';

// Three-dots menu shown to the post's owner: Edit / Delete
const PostMenu = ({ onEdit, onDelete }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (fn) => () => { setOpen(false); fn(); };

  return (
    <div className="post-menu" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-label={t('postOptions')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <IoEllipsisHorizontal size={20} />
      </button>
      {open && (
        <ul className="menu-list" role="menu">
          <li>
            <button type="button" role="menuitem" onClick={pick(onEdit)}>
              <IoPencilOutline size={18} /> {t('edit')}
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" className="danger" onClick={pick(onDelete)}>
              <IoTrashOutline size={18} /> {t('delete')}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default PostMenu;
