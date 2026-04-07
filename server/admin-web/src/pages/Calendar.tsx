import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApiGet } from '../hooks/useApi';
import api from '../api/client';
import RRuleBuilder from '../components/RRuleBuilder';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';
import type { CalendarEvent, Language } from '../types';

const emptyEvent = {
  title_ar: '', title_ru: '', title_en: '',
  description_ar: '', description_ru: '', description_en: '',
  rrule: '', starts_at: '', duration_minutes: 60, reminder_minutes_before: 30, active: 1,
};

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const fonts = getFonts(i18n.language);
  const lang = i18n.language as Language;
  const { data: events, loading, refetch } = useApiGet<CalendarEvent[]>('/admin/calendar');

  const [editing, setEditing] = useState<Partial<CalendarEvent> | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await api.put(`/admin/calendar/${editing.id}`, editing);
      } else {
        await api.post('/admin/calendar', editing);
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
      await api.delete(`/admin/calendar/${id}`);
      refetch();
    } catch {
      alert(t('error'));
    }
  };

  if (loading) return <p>{t('loading')}</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: fonts.heading, color: colors.primary, margin: 0 }}>{t('nav_calendar')}</h1>
        <button onClick={() => setEditing({ ...emptyEvent })}
          style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: colors.primary, color: colors.white, cursor: 'pointer' }}>
          {t('cal_add_event')}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label>
              <span style={labelStyle}>{t('ann_title_ar')}</span>
              <input value={editing.title_ar || ''} onChange={e => setEditing({ ...editing, title_ar: e.target.value })} dir="rtl" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>{t('ann_title_ru')}</span>
              <input value={editing.title_ru || ''} onChange={e => setEditing({ ...editing, title_ru: e.target.value })} dir="ltr" style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>{t('ann_title_en')}</span>
              <input value={editing.title_en || ''} onChange={e => setEditing({ ...editing, title_en: e.target.value })} dir="ltr" style={inputStyle} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label>
              <span style={labelStyle}>{t('cal_starts_at')}</span>
              <input type="datetime-local" value={editing.starts_at || ''} onChange={e => setEditing({ ...editing, starts_at: e.target.value })} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>{t('cal_duration')}</span>
              <input type="number" value={editing.duration_minutes ?? 60} onChange={e => setEditing({ ...editing, duration_minutes: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label>
              <span style={labelStyle}>{t('cal_reminder')}</span>
              <input type="number" value={editing.reminder_minutes_before ?? 30} onChange={e => setEditing({ ...editing, reminder_minutes_before: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 20 }}>
              <input type="checkbox" checked={!!editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked ? 1 : 0 })}
                style={{ width: 18, height: 18, accentColor: colors.primary }} />
              <span>{t('cal_active')}</span>
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={labelStyle}>{t('cal_rrule')}</span>
            <RRuleBuilder value={editing.rrule || ''} onChange={(v) => setEditing({ ...editing, rrule: v || null })} />
          </div>
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

      {/* Events list */}
      <div style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: colors.parchmentDark }}>
              <th style={thStyle}>{t('cal_title')}</th>
              <th style={thStyle}>{t('cal_starts_at')}</th>
              <th style={thStyle}>{t('cal_rrule')}</th>
              <th style={thStyle}>{t('cal_active')}</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {events?.map((ev) => {
              const title = lang === 'ru' ? (ev.title_ru || ev.title_ar) : lang === 'en' ? (ev.title_en || ev.title_ar) : ev.title_ar;
              return (
                <tr key={ev.id} style={{ borderBottom: `1px solid ${colors.border}`, opacity: ev.active ? 1 : 0.5 }}>
                  <td style={tdStyle}>{title}</td>
                  <td style={tdStyle}>{ev.starts_at ? new Date(ev.starts_at).toLocaleString() : '—'}</td>
                  <td style={tdStyle}>{ev.rrule || '—'}</td>
                  <td style={tdStyle}>{ev.active ? '✓' : '✗'}</td>
                  <td style={{ ...tdStyle, display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditing({ ...ev })}
                      style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(ev.id)}
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
