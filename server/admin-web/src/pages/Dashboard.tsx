import { useTranslation } from 'react-i18next';
import { useApiGet } from '../hooks/useApi';
import StatsCard from '../components/StatsCard';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';
import type { Stats, Language } from '../types';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const fonts = getFonts(i18n.language);
  const { data: stats, loading } = useApiGet<Stats>('/admin/stats');
  const lang = i18n.language as Language;

  if (loading) return <p>{t('loading')}</p>;
  if (!stats) return <p>{t('no_data')}</p>;

  return (
    <div>
      <h1 style={{ fontFamily: fonts.heading, color: colors.primary, margin: '0 0 20px' }}>
        {t('nav_dashboard')}
      </h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatsCard title={t('dashboard_total_devices')} value={stats.total_devices} />
        <StatsCard title={t('dashboard_active_7d')} value={stats.active_7d} />
        <StatsCard title={t('dashboard_active_30d')} value={stats.active_30d} />
        {stats.by_language.map((item) => (
          <StatsCard
            key={item.language}
            title={`${t('dashboard_by_language')}: ${item.language.toUpperCase()}`}
            value={item.count}
          />
        ))}
      </div>

      <h2 style={{ fontFamily: fonts.heading, color: colors.primary, fontSize: 18, margin: '0 0 12px' }}>
        {t('dashboard_recent')}
      </h2>
      <div style={{ background: colors.white, border: `1px solid ${colors.gold}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: colors.parchmentDark }}>
              <th style={thStyle}>{t('ann_title_ar')}</th>
              <th style={thStyle}>{t('ann_category')}</th>
              <th style={thStyle}>{t('ann_priority')}</th>
              <th style={thStyle}>{t('ann_sent')}</th>
              <th style={thStyle}>#</th>
            </tr>
          </thead>
          <tbody>
            {stats.last_announcements.map((a) => {
              const title = lang === 'ru' ? (a.title_ru || a.title_ar) : lang === 'en' ? (a.title_en || a.title_ar) : a.title_ar;
              return (
                <tr key={a.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={tdStyle}>{title}</td>
                  <td style={tdStyle}>{t(`category_${a.category}`)}</td>
                  <td style={tdStyle}>{t(`priority_${a.priority}`)}</td>
                  <td style={tdStyle}>{a.sent_at ? new Date(a.sent_at).toLocaleDateString() : '—'}</td>
                  <td style={tdStyle}>{a.sent_count ?? '—'} / {a.failed_count ?? 0}</td>
                </tr>
              );
            })}
            {stats.last_announcements.length === 0 && (
              <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: colors.muted }}>{t('no_data')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'start', fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '10px 14px' };
