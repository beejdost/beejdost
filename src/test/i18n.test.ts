import { describe, it, expect, beforeEach } from 'vitest';
import i18n, { getLanguageDirection, applyDocumentLanguageDirection } from '@/i18n/config';

describe('Language Direction and i18n System', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    document.documentElement.className = '';
  });

  it('correctly maps English to LTR', () => {
    expect(getLanguageDirection('en')).toBe('ltr');
    expect(getLanguageDirection('en-US')).toBe('ltr');
  });

  it('correctly maps Urdu to RTL', () => {
    expect(getLanguageDirection('ur')).toBe('rtl');
    expect(getLanguageDirection('ur-PK')).toBe('rtl');
  });

  it('correctly maps Punjabi Shahmukhi to RTL', () => {
    expect(getLanguageDirection('pa')).toBe('rtl');
    expect(getLanguageDirection('pa-Arab')).toBe('rtl');
  });

  it('updates document html attributes when language direction is applied', () => {
    applyDocumentLanguageDirection('ur');
    expect(document.documentElement.lang).toBe('ur');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.body.dir).toBe('rtl');
    expect(document.documentElement.classList.contains('rtl')).toBe(true);

    applyDocumentLanguageDirection('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.body.dir).toBe('ltr');
    expect(document.documentElement.classList.contains('ltr')).toBe(true);

    applyDocumentLanguageDirection('pa');
    expect(document.documentElement.lang).toBe('pa');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.classList.contains('rtl')).toBe(true);
  });

  it('translates core navigation keys across all three supported languages', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('nav.search')).toBe('Find Seeds');
    expect(i18n.t('app.name')).toBe('Beej Dost');

    await i18n.changeLanguage('ur');
    expect(i18n.t('nav.search')).toBe('بیج تلاش کریں');
    expect(i18n.t('app.name')).toBe('بیج دوست');

    await i18n.changeLanguage('pa');
    expect(i18n.t('nav.search')).toBe('بیج لبھو');
    expect(i18n.t('app.name')).toBe('بیج دوست');
  });
});
