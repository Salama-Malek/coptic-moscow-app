import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { getFonts } from '../theme/fonts';
import LanguageSwitcher from './LanguageSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const fonts = getFonts(i18n.language);

  const adminStr = localStorage.getItem('admin_user');
  const admin = adminStr ? JSON.parse(adminStr) : null;
  const isSuperAdmin = admin?.role === 'super_admin';

  const navItems = [
    { path: '/admin', label: t('nav_dashboard'), exact: true },
    { path: '/admin/new-announcement', label: t('nav_new_announcement') },
    { path: '/admin/announcements', label: t('nav_announcements') },
    { path: '/admin/calendar', label: t('nav_calendar') },
    { path: '/admin/templates', label: t('nav_templates') },
    { path: '/admin/snippets', label: t('nav_snippets') },
    ...(isSuperAdmin ? [{ path: '/admin/team', label: t('nav_team') }] : []),
    { path: '/admin/my-account', label: t('nav_my_account') },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: fonts.body, background: colors.parchment }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: colors.primary,
          color: colors.white,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${colors.primaryLight}` }}>
          <div style={{ fontFamily: fonts.heading, fontSize: 16, fontWeight: 700, color: colors.gold }}>
            {t('app_title')}
          </div>
          <div style={{ fontSize: 12, color: colors.goldLight, marginTop: 4 }}>
            {t('admin_panel')}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '10px 20px',
                color: isActive(item.path, (item as { exact?: boolean }).exact) ? colors.gold : 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: 14,
                background: isActive(item.path, (item as { exact?: boolean }).exact) ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderInlineStart: isActive(item.path, (item as { exact?: boolean }).exact) ? `3px solid ${colors.gold}` : '3px solid transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.primaryLight}` }}>
          {admin && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
              {admin.display_name}
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px 0', border: `1px solid ${colors.gold}`,
              borderRadius: 4, background: 'transparent', color: colors.gold,
              cursor: 'pointer', fontSize: 13,
            }}
          >
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header
          style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            padding: '10px 24px', background: colors.white,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <LanguageSwitcher />
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
