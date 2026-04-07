import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiGet } from '../hooks/useApi';
import api from '../api/client';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';
import type { Template, Language } from '../types';

export default function Templates() {
  const { t, i18n } = useTranslation();
  const fonts = getFonts(i18n.language);
  const lang = i18n.language as Language;
  const { data: templates, loading, refetch } = useApiGet<Template[]>('/admin/templates');

  const [editing, setEditing] = useState<Partial<Template> | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        ...editing,
        placeholders: typeof editing.placeholders === 'string'
          ? JSON.parse(editing.placeholders)
          : editing.placeholders,
      };
      if (editing.id) {
        await api.put(`/admin/templates/${editing.id}`, payload);
      } else {
        await api.post('/admin/templates', payload);
      }
      setEditing(null);
      refetch();
    } catch {
      alert(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm') + '?')) return;
    try {
      await api.delete(`/admin/templates/${id}`);
      refetch();
    } catch {
      alert(t('error'));
    }
  };

  if (loading) return <p>{t('loading')}</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: fonts.heading, color: colors.primary, margin: 0 }}>{t('nav_templates')}</h1>
        <button
          onClick={() => setEditing({
            name_ar: '', name_ru: '', name_en: '', category: 'custom',
            body_ar_template: '', body_ru_template: '', body_en_template: '',
            placeholders: [],
          })}
          style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: colors.primary, color: colors.white, cursor: 'pointer' }}>
          +
        </button>
      </div>

      {editing && (
        <div style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label>
              <span style={labelStyle}>Name (AR)</span>
              <input value={editing.name_ar || ''} onChange={e => setEditing({ ...editing, name_ar: e.target.value })} dir="rtl" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>Name (RU)</span>
              <input value={editing.name_ru || ''} onChange={e => setEditing({ ...editing, name_ru: e.target.value })} dir="ltr" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>Name (EN)</span>
              <input value={editing.name_en || ''} onChange={e => setEditing({ ...editing, name_en: e.target.value })} dir="ltr" style={inputStyle} />
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={labelStyle}>Category</span>
            <select value={editing.category || 'custom'} onChange={e => setEditing({ ...editing, category: e.target.value })}
              style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: 6 }}>
              {['liturgy', 'vespers', 'feast', 'fast', 'meeting', 'custom'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label>
              <span style={labelStyle}>Body Template (AR)</span>
              <textarea value={editing.body_ar_template || ''} onChange={e => setEditing({ ...editing, body_ar_template: e.target.value })}
                dir="rtl" rows={8} style={{ ...inputStyle, resize: 'vertical' }} />
            </label>
            <label>
              <span style={labelStyle}>Body Template (RU)</span>
              <textarea value={editing.body_ru_template || ''} onChange={e => setEditing({ ...editing, body_ru_template: e.target.value })}
                dir="ltr" rows={8} style={{ ...inputStyle, resize: 'vertical' }} />
            </label>
            <label>
              <span style={labelStyle}>Body Template (EN)</span>
              <textarea value={editing.body_en_template || ''} onChange={e => setEditing({ ...editing, body_en_template: e.target.value })}
                dir="ltr" rows={8} style={{ ...inputStyle, resize: 'vertical' }} />
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={labelStyle}>Placeholders (JSON)</span>
            <textarea
              value={typeof editing.placeholders === 'string' ? editing.placeholders : JSON.stringify(editing.placeholders, null, 2)}
              onChange={e => setEditing({ ...editing, placeholders: e.target.value as unknown as Template['placeholders'] })}
              dir="ltr" rows={6} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '8px 24px', border: 'none', borderRadius: 6, background: colors.primary, color: colors.white, cursor: 'pointer' }}>
              {saving ? t('loading') : t('save')}
            </button>
            <button onClick={() => setEditing(null)}
              style={{ padding: '8px 24px', border: `1px solid ${colors.border}`, borderRadius: 6, background: 'transparent', cursor: 'pointer' }}>
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      <div style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: colors.parchmentDark }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Fields</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {templates?.map((tmpl) => {
              const name = lang === 'ru' ? (tmpl.name_ru || tmpl.name_ar) : lang === 'en' ? (tmpl.name_en || tmpl.name_ar) : tmpl.name_ar;
              const ph = typeof tmpl.placeholders === 'string' ? JSON.parse(tmpl.placeholders) : tmpl.placeholders;
              return (
                <tr key={tmpl.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={tdStyle}>{name}</td>
                  <td style={tdStyle}>{tmpl.category}</td>
                  <td style={tdStyle}>{ph.length}</td>
                  <td style={{ ...tdStyle, display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditing({ ...tmpl })}
                      style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(tmpl.id)}
                      style={{ color: colors.error, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, color: '#7A6E5C', display: 'block', marginBottom: 3 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #D4C5A9', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'start', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '10px 14px' };
