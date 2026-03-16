import React from 'react';
import Modal from './Modal';
import { useLanguage } from '../contexts/LanguageContext';

// A simple component to render key-value pairs for changes
const ChangeDetail = ({ field, from, to }) => (
  <div className="change-detail">
    <strong>{field}:</strong>
    <span className="change-from">{from}</span> &rarr; <span className="change-to">{to}</span>
  </div>
);

function ConfirmationDialog({ isOpen, onCancel, onConfirm, confirmationInfo }) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const { type, data } = confirmationInfo;
  let title, content;

  if (type === 'update') {
    title = t('confirmation.updateTitle');
    const changes = Object.keys(data.new)
      .filter(key => data.old[key] !== data.new[key])
      .map(key => (
        <ChangeDetail key={key} field={key} from={data.old[key]} to={data.new[key]} />
      ));
    content = (
      <div>
        <p>{t('confirmation.updateMessage')}</p>
        <div className="changes-container">{changes}</div>
      </div>
    );
  } else if (type === 'delete') {
    title = t('confirmation.deleteTitle');
    content = (
      <div>
        <p>{t('confirmation.deleteMessage')}</p>
        <div className="card" style={{ pointerEvents: 'none', background: 'var(--bg)' }}>
          <div className="title">{data.cardToDelete.title}</div>
        </div>
      </div>
    );
  } else {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      {content}
      <div className="dialog-actions">
        <button className="btn ghost" onClick={onCancel}>{t('common.cancel')}</button>
        <button className="btn" onClick={onConfirm} style={type === 'delete' ? { background: '#5a2a3f', borderColor: '#ff6b6b' } : {}}>
          {t('common.confirm')}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmationDialog;
