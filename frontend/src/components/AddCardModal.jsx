import React, { useState } from 'react';
import Modal from './Modal';
import { useLanguage } from '../contexts/LanguageContext';

function AddCardModal({ isOpen, onClose, onAddCard }) {
  const { t } = useLanguage();

  const initialState = {
    title: t('addCard.defaultTitle'),
    vendor: 'syn',
    status: 'todo',
    lane: 'SoC',
    notes: ''
  };

  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { id, value } = e.target;
    const key = id.replace('f-', '');
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = () => {
    onAddCard(formData);
    onClose();
    setFormData(initialState);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('addCard.title')}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <label>
          {t('inspector.name')}
          <input id="f-title" value={formData.title} onChange={handleChange} />
        </label>
        <label>
          {t('inspector.vendor')}
          <select id="f-vendor" value={formData.vendor} onChange={handleChange}>
            <option value="syn">Synopsys</option>
            <option value="zuk">InPack.AI</option>
            <option value="ans">Ansys</option>
          </select>
        </label>
        <label>
          {t('inspector.status')}
          <select id="f-status" value={formData.status} onChange={handleChange}>
            <option value="todo">{t('inspector.statusOptions.todo')}</option>
            <option value="ok">{t('inspector.statusOptions.ok')}</option>
            <option value="risk">{t('inspector.statusOptions.risk')}</option>
          </select>
        </label>
        <label>
          {t('inspector.flowChannel')}
          <select id="f-lane" value={formData.lane} onChange={handleChange}>
            <option value="SoC">SoC</option>
            <option value="3DIC">3DIC</option>
            <option value="Package">Package</option>
            <option value="PCB">PCB</option>
            <option value="Thermal">Thermal</option>
          </select>
        </label>
        <textarea
          id="f-notes"
          placeholder={t('inspector.notesPlaceholder')}
          value={formData.notes}
          onChange={handleChange}
        ></textarea>
        <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn ghost" type="button" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn" type="submit">{t('common.create')}</button>
        </div>
      </form>
    </Modal>
  );
}

export default AddCardModal;
