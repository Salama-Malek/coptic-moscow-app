import { useTranslation } from 'react-i18next';
import { useApiGet } from '../hooks/useApi';
import api from '../api/client';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';
import type { Announcement, Language } from '../types';

export default function AnnouncementHistory() {
  const { t, i18n } = useTranslation();
  const fonts = getFonts(i18n.language);
  const lang = i18n.language as Language;
  const { data: announcements, loading, refetch } = useApiGet<Announcement[]>('/admin/announcements?limit=100');

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm') + '?')) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      refetch();
    } catch {
      alert(t('error'));
    }
  };

  if (loading) return <p>{t('loading')}</p>;

  return (
    <div>
      <h1 style={{ fontFamily: fonts.heading, color: colors.primary, margin: '0 0 20px' }}>
        {t('nav_announcements')}
      </h1>
      <div style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: colors.parchmentDark }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>{t('ann_title_ar')}</th>
              <th style={thStyle}>{t('ann_category')}</th>
              <th style={thStyle}>{t('ann_priority')}</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>{t('ann_sent')}</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {announcements?.map((a) => {
              const title = lang === 'ru' ? (a.title_ru || a.title_ar) : lang === 'en' ? (a.title_en || a.title_ar) : a.title_ar;
              return (
                <tr key={a.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={tdStyle}>{a.id}</td>
                  <td style={tdStyle}>{title}</td>
                  <td style={tdStyle}>{t(`category_${a.category}`)}</td>
                  <td style={tdStyle}>{t(`priority_${a.priority}`)}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 12,
                      background: a.status === 'sent' ? '#E8F5E9' : a.status === 'draft' ? '#FFF3E0' : a.status === 'scheduled' ? '#E3F2FD' : '#FFEBEE',
                      color: a.status === 'sent' ? colors.success : a.status === 'draft' ? colors.warning : a.status === 'scheduled' ? '#1565C0' : colors.error,
                    }}>
                      {t(`ann_${a.status}`)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {a.sent_at ? new Date(a.sent_at).toLocaleString() : '—'}
                    {a.sent_count !== undefined && ` (${a.sent_count}/${a.failed_count ?? 0})`}
                  </td>
                  <td style={tdStyle}>
                    {!a.sent_at && (
                      <button onClick={() => handleDelete(a.id)}
                        style={{ color: colors.error, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                        {t('delete')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {(!announcements || announcements.length === 0) && (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: colors.muted }}>{t('no_data')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'start', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '10px 14px' };
