import type { FC, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/i18n/config';
import { Languages } from 'lucide-react';

export const LanguageSwitcher: FC = () => {
  const { i18n, t } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0] as SupportedLanguage;

  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as SupportedLanguage;
    i18n.changeLanguage(newLang);
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.65rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-light)',
      }}
    >
      <Languages size={18} style={{ color: 'var(--primary-700)', flexShrink: 0 }} aria-hidden="true" />
      <label htmlFor="language-select" className="visually-hidden" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {t('common.switchLanguage')}
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={handleLanguageChange}
        aria-label={t('common.switchLanguage')}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--primary-900)',
          cursor: 'pointer',
          outline: 'none',
          paddingRight: '0.25rem',
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};
