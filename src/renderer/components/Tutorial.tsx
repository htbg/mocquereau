// src/renderer/components/Tutorial.tsx
// First-run tutorial overlay. Shown once; dismissal persisted to app state.

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const STEP_KEYS = [
  'welcome',
  'textProject',
  'sourcesImages',
  'sliceEditor',
  'tablePreview',
  'exportDocx',
] as const;

export function Tutorial({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const current = STEP_KEYS[step];
  const isFirst = step === 0;
  const isLast = step === STEP_KEYS.length - 1;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-center gap-2 pt-5">
          {STEP_KEYS.map((_, i) => (
            <span
              key={i}
              className={[
                'w-2 h-2 rounded-full transition-colors',
                i === step ? 'bg-blue-600 w-6' : i < step ? 'bg-blue-300' : 'bg-gray-300',
              ].join(' ')}
            />
          ))}
        </div>

        <div className="px-8 pt-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {t(`tutorial.${current}.title`)}
          </h2>
          <div className="text-sm text-gray-700 leading-relaxed">
            {current === 'welcome' && (
              <>
                <p>{t('tutorial.welcome.body1')}</p>
                <p className="mt-2 text-gray-600">{t('tutorial.welcome.body2')}</p>
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900">
                  <strong>{t('tutorial.welcome.warningTitle')}</strong><br />
                  {t('tutorial.welcome.warningBody')}
                </div>
              </>
            )}
            {current === 'textProject' && (
              <>
                <p>{t('tutorial.textProject.body1')}</p>
                <p className="mt-2 text-gray-600">{t('tutorial.textProject.body2')}</p>
              </>
            )}
            {current === 'sourcesImages' && (
              <>
                <p>{t('tutorial.sourcesImages.body1')}</p>
                <p className="mt-2 text-gray-600">{t('tutorial.sourcesImages.body2')}</p>
              </>
            )}
            {current === 'sliceEditor' && (
              <>
                <p>{t('tutorial.sliceEditor.body1')}</p>
                <p className="mt-2 text-gray-600">{t('tutorial.sliceEditor.body2')}</p>
              </>
            )}
            {current === 'tablePreview' && (
              <p>{t('tutorial.tablePreview.body1')}</p>
            )}
            {current === 'exportDocx' && (
              <>
                <p>{t('tutorial.exportDocx.body1')}</p>
                <p className="mt-3 text-sm text-blue-700">{t('tutorial.exportDocx.body2')}</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            {t('tutorial.skip')}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={isFirst}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              {t('tutorial.previous')}
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t('tutorial.start')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t('tutorial.next')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
