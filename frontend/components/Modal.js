'use client';
import { useEffect, useRef } from 'react';

/** Dialog modal: tutup dengan Esc atau klik di luar; fokus otomatis ke input/tombol pertama. */
export default function Modal({ onClose, children }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    const first = ref.current && ref.current.querySelector('input, button.btn-primary, button');
    if (first) first.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" ref={ref}>
        {children}
      </div>
    </div>
  );
}
