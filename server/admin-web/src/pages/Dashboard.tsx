import { useTranslation } from 'react-i18next';
import { useApiGet } from '../hooks/useApi';
import { useIsMobile } from '../hooks/useMediaQuery';
import StatsCard from '../components/StatsCard';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';
import type { Stats, Language } from '../types';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const fonts = getFonts(i18n.language);
  const isMobile = useIsMobile();
  const { data: stats, loading } = useApiGet<Stats>('/admin/stats');
  const lang = i18n.language as Language;

  if (loading) return <p style={{ padding: 20, color: colors.muted }}>{t('loading')}</p>;
  if (!stats) return <p style={{ padding: 20, color: colors.muted }}>{t('no_data')}</p>;

  return (
    <div>
      <h1 className="page-title" style={{ fontFamily: fonts.heading }}>{t('nav_dashboard')}</h1>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: isMobile ? 10 : 16,
        marginBottom: 24,
      }}>
        <StatsCard title={t('dashboard_total_devices')} value={stats.total_devices} />
        <StatsCard title={t('dashboard_active_7d')} value={stats.active_7d} />
        <StatsCard title={t('dashboard_active_30d')} value={stats.active_30d} />
        {stats.by_language.map((item) => (
          <StatsCard key={item.language} title={`${item.language.toUpperCase()}`} value={item.count}
            subtitle={t('dashboard_by_language')} />
        ))}
      </div>

      {/* Recent announcements */}
      <h2 style={{ fontFamily: fonts.heading, color: colors.primary, fontSize: 17, margin: '0 0 12px' }}>
        {t('dashboard_recent')}
      </h2>

      {isMobile ? (
        <div className="mobile-card-list">
          {stats.last_announcements.length === 0 && (
            <p style={{ textAlign: 'center', color: colors.muted, padding: 20 }}>{t('no_data')}</p>
          )}
          {stats.last_announcements.map((a) => {
            const title = lang === 'ru' ? (a.title_ru || a.title_ar) : lang === 'en' ? (a.title_en || a.title_ar) : a.title_ar;
            return (
              <div key={a.id} className="mobile-card">
                <div style={{ fontWeight: 600, color: colors.primary, marginBottom: 6, fontSize: 15 }}>{title}</div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('ann_category')}</span>
                  <span className="mobile-card-value">{t(`category_${a.category}`)}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('ann_priority')}</span>
                  <span className="mobile-card-value">{t(`priority_${a.priority}`)}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('ann_sent')}</span>
                  <span className="mobile-card-value">
                    {a.sent_at ? new Date(a.sent_at).toLocaleDateString() : '—'}
                  </span>
                </div>
                {a.sent_count !== undefined && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Sent/Failed</span>
                    <span className="mobile-card-value">{a.sent_count} / {a.failed_count ?? 0}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('ann_title_ar')}</th>
                <th>{t('ann_category')}</th>
                <th>{t('ann_priority')}</th>
                <th>{t('ann_sent')}</th>
                <th>#</th>
              </tr>
            </thead>
            <tbody>
              {stats.last_announcements.map((a) => {
                const title = lang === 'ru' ? (a.title_ru || a.title_ar) : lang === 'en' ? (a.title_en || a.title_ar) : a.title_ar;
                return (
                  <tr key={a.id}>
                    <td>{title}</td>
                    <td>{t(`category_${a.category}`)}</td>
                    <td>{t(`priority_${a.priority}`)}</td>
                    <td>{a.sent_at ? new Date(a.sent_at).toLocaleDateString() : '—'}</td>
                    <td>{a.sent_count ?? '—'} / {a.failed_count ?? 0}</td>
                  </tr>
                );
              })}
              {stats.last_announcements.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: colors.muted }}>{t('no_data')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
