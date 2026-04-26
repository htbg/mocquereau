// src/renderer/components/slice-editor/ImageMetadataModal.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ImageMetadataModalProps {
  /** When non-null, modal is open and editing this line */
  line: { id: string; folio?: string; label?: string } | null;
  onSave: (lineId: string, folio: string | undefined, label: string | undefined) => void;
  onClose: () => void;
}

export function ImageMetadataModal({ line, onSave, onClose }: ImageMetadataModalProps) {
  const { t } = useTranslation();
  const [folio, setFolio] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (line) {
      setFolio(line.folio ?? '');
      setLabel(line.label ?? '');
    }
  }, [line]);

  if (!line) return null;

  const handleSave = () => {
    const nextFolio = folio.trim() === '' ? undefined : folio.trim();
    const nextLabel = label.trim() === '' ? undefined : label.trim();
    onSave(line.id, nextFolio, nextLabel);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
        <h2 className="text-base font-semibold mb-3 text-gray-800">{t('imageMetadataModal.title')}</h2>

        <label className="block text-xs font-medium text-gray-600 mb-1">{t('imageMetadataModal.folio')}</label>
        <input
          type="text"
          value={folio}
          onChange={(e) => setFolio(e.target.value)}
          placeholder={t('imageMetadataModal.folioPlaceholder')}
          className="w-full px-2 py-1 mb-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />

        <label className="block text-xs font-medium text-gray-600 mb-1">{t('imageMetadataModal.label')}</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('imageMetadataModal.labelPlaceholder')}
          className="w-full px-2 py-1 mb-4 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            onClick={onClose}
          >
            {t('imageMetadataModal.cancel')}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            {t('imageMetadataModal.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
