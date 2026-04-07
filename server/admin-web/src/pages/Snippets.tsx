import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiGet } from '../hooks/useApi';
import api from '../api/client';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';
import type { Snippet } from '../types';

export default function Snippets() {
  const { t, i18n } = useTranslation();
  const fonts = getFonts(i18n.language);
  const { data: snippets, loading, refetch } = useApiGet<Snippet[]>('/admin/snippets');

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ value_ar: '', value_ru: '', value_en: '' });
  const [saving, setSaving] = useState(false);

  const startEdit = (s: Snippet) => {
    setEditingKey(s.key);
    setEditValues({ value_ar: s.value_ar, value_ru: s.value_ru || '', value_en: s.value_en || '' });
  };

  const handleSave = async () => {
    if (!editingKey) return;
    setSaving(true);
    try {
      await api.put(`/admin/snippets/${editingKey}`, editValues);
      setEditingKey(null);
      refetch();
    } catch {
      alert(t('error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>{t('loading')}</p>;

  return (
    <div>
      <h1 style={{ fontFamily: fonts.heading, color: colors.primary, margin: '0 0 20px' }}>{t('nav_snippets')}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {snippets?.map((s) => (
          <div key={s.key} style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, color: colors.primary, marginBottom: 8, fontFamily: 'monospace' }}>
              {s.key}
            </div>

            {editingKey === s.key ? (
              <>
                <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                  <label>
                    <span style={labelStyle}>{t('snippets_value_ar')}</span>
                    <textarea value={editValues.value_ar} onChange={e => setEditValues({ ...editValues, value_ar: e.target.value })}
                      dir="rtl" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </label>
                  <label>
                    <span style={labelStyle}>{t('snippets_value_ru')}</span>
                    <textarea value={editValues.value_ru} onChange={e => setEditValues({ ...editValues, value_ru: e.target.value })}
                      dir="ltr" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </label>
                  <label>
                    <span style={labelStyle}>{t('snippets_value_en')}</span>
                    <textarea value={editValues.value_en} onChange={e => setEditValues({ ...editValues, value_en: e.target.value })}
                      dir="ltr" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ padding: '6px 20px', border: 'none', borderRadius: 6, background: colors.primary, color: colors.white, cursor: 'pointer', fontSize: 13 }}>
                    {saving ? t('loading') : t('save')}
                  </button>
                  <button onClick={() => setEditingKey(null)}
                    style={{ padding: '6px 20px', border: `1px solid ${colors.border}`, borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 13 }}>
                    {t('cancel')}
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div style={{ marginBottom: 4, direction: 'rtl' }}><strong>AR:</strong> {s.value_ar}</div>
                <div style={{ marginBottom: 4 }}><strong>RU:</strong> {s.value_ru || '—'}</div>
                <div style={{ marginBottom: 8 }}><strong>EN:</strong> {s.value_en || '—'}</div>
                <button onClick={() => startEdit(s)}
                  style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, color: '#7A6E5C', display: 'block', marginBottom: 3 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #D4C5A9', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
